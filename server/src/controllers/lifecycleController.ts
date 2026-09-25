import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';
import { ocrService } from '../services/ocr/ocrService.js';
import { aiService } from '../services/ai/aiService.js';
import { PriorityEngine } from '../services/documents/priorityEngine.js';
import { ReminderService } from '../services/reminders/reminderService.js';
import { config } from '../config/env.js';

export interface FieldDiff {
  fieldName: string;
  oldValue: string;
  newValue: string;
  status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
}

export const lifecycleController = {
  // 1. Start Renewal Workflow
  async startRenewal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      const docRes = await db.query(
        `SELECT id, title FROM documents WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      await db.query(
        `UPDATE documents SET renewal_status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      // Audit log
      await db.query(
        `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata, created_at)
         VALUES ($1, $2, 'DOCUMENT', $3, 'RENEWAL_STARTED', $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), userId, id, JSON.stringify({ previousRenewalStatus: 'DUE' })]
      );

      return res.json({ message: 'Renewal workflow initiated. Status set to IN_PROGRESS.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Upload Renewed Document (Creates New Version, Archives Previous Version, Recalculates Reminders)
  async renewDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;
      const userId = req.user!.id;
      const db = await getDatabase();

      if (!file) {
        return res.status(400).json({ error: 'No renewal document uploaded.' });
      }

      // 1. Fetch current document
      const currentDocRes = await db.query(
        `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (currentDocRes.rows.length === 0) {
        return res.status(404).json({ error: 'Original document not found.' });
      }
      const oldDoc = currentDocRes.rows[0];

      // 2. OCR and AI parse new file
      const filePath = path.join(config.uploadDir, file.filename);
      const ocrText = await ocrService.extractText(filePath, file.mimetype);
      const analysis = await aiService.analyzeDocument(ocrText, file.originalname);

      // 3. Calculate Field Differences (Version Comparison Engine)
      const diffs: FieldDiff[] = [];
      const compareItems: Array<{ name: string; oldVal: string; newVal: string }> = [
        { name: 'Expiry Date', oldVal: oldDoc.expiry_date || '', newVal: analysis.expiryDate || '' },
        { name: 'Amount / Premium', oldVal: oldDoc.amount ? `${oldDoc.amount} ${oldDoc.currency}` : '', newVal: analysis.amount ? `${analysis.amount} ${analysis.currency || 'USD'}` : '' },
        { name: 'Document Number', oldVal: oldDoc.document_number || '', newVal: analysis.documentNumber || '' },
        { name: 'Provider', oldVal: oldDoc.provider || '', newVal: analysis.provider || '' },
      ];

      for (const item of compareItems) {
        let status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED' = 'UNCHANGED';
        if (!item.oldVal && item.newVal) status = 'ADDED';
        else if (item.oldVal && !item.newVal) status = 'REMOVED';
        else if (item.oldVal !== item.newVal) status = 'CHANGED';
        diffs.push({ fieldName: item.name, oldValue: item.oldVal, newValue: item.newVal, status });
      }

      // 4. Determine Version Number
      const verRes = await db.query(
        `SELECT MAX(version_number) as max_ver FROM document_versions WHERE document_id = $1`,
        [id]
      );
      const nextVer = (verRes.rows[0]?.max_ver || 1) + 1;

      // 5. Save New Version record
      const changeSummary = `Renewed to v${nextVer}. Expiry extended to ${analysis.expiryDate || 'N/A'}. Changes: ${diffs.filter(d => d.status !== 'UNCHANGED').map(d => `${d.fieldName} (${d.oldValue} -> ${d.newValue})`).join(', ') || 'Standard renewal'}`;

      await db.query(
        `INSERT INTO document_versions (id, document_id, version_number, storage_key, original_filename, ocr_text, extracted_data, change_summary, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          id,
          nextVer,
          file.filename,
          file.originalname,
          ocrText,
          JSON.stringify(analysis),
          changeSummary,
        ]
      );

      // 6. Update Primary Document with renewed details
      await db.query(
        `UPDATE documents SET
          title = $1,
          storage_key = $2,
          original_filename = $3,
          ocr_text = $4,
          expiry_date = $5,
          amount = $6,
          currency = $7,
          document_number = COALESCE($8, document_number),
          status = 'ACTIVE',
          renewal_status = 'RENEWED',
          verification_status = 'VERIFIED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9`,
        [
          analysis.title || oldDoc.title,
          file.filename,
          file.originalname,
          ocrText,
          analysis.expiryDate || oldDoc.expiry_date,
          analysis.amount || oldDoc.amount,
          analysis.currency || oldDoc.currency,
          analysis.documentNumber,
          id,
        ]
      );

      // 7. Complete Old Renewal Actions & Schedule New Actions / Reminders
      const existingActions = await db.query(
        `SELECT id FROM actions WHERE document_id = $1 AND (type = 'RENEW' OR type = 'PAY') AND status != 'COMPLETED'`,
        [id]
      );
      for (const act of existingActions.rows) {
        await db.query(`UPDATE actions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1`, [act.id]);
        await ReminderService.cancelRemindersForAction(act.id);
      }

      // Schedule new action for the next expiry
      if (analysis.expiryDate) {
        const newActionId = uuidv4();
        const pEval = PriorityEngine.calculate(analysis.expiryDate, 'RENEW', oldDoc.category_name || 'Insurance');
        await db.query(
          `INSERT INTO actions (id, document_id, title, description, type, due_date, priority, status, created_at)
           VALUES ($1, $2, $3, $4, 'RENEW', $5, $6, 'PENDING', CURRENT_TIMESTAMP)`,
          [
            newActionId,
            id,
            `Renew ${analysis.title || oldDoc.title}`,
            `Upcoming policy renewal scheduled for ${analysis.expiryDate}`,
            analysis.expiryDate,
            pEval.priority,
          ]
        );
        await ReminderService.scheduleRemindersForAction(newActionId, analysis.expiryDate);
      }

      // 8. Log Audit
      await db.query(
        `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata, created_at)
         VALUES ($1, $2, 'DOCUMENT', $3, 'DOCUMENT_RENEWED', $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), userId, id, JSON.stringify({ version: nextVer, newExpiry: analysis.expiryDate })]
      );

      return res.json({
        message: 'Document successfully renewed. New version created and old actions resolved.',
        version: nextVer,
        diffs,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Get Version Comparison (Diff) between two versions
  async compareVersions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { v1, v2 } = req.query;
      const db = await getDatabase();

      const versionsRes = await db.query(
        `SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_number ASC`,
        [id]
      );

      if (versionsRes.rows.length < 2) {
        return res.json({ diffs: [], note: 'At least 2 versions are required for comparison.' });
      }

      const verA = v1 ? versionsRes.rows.find((v: any) => v.version_number === parseInt(v1 as string)) : versionsRes.rows[versionsRes.rows.length - 2];
      const verB = v2 ? versionsRes.rows.find((v: any) => v.version_number === parseInt(v2 as string)) : versionsRes.rows[versionsRes.rows.length - 1];

      const dataA = verA ? JSON.parse(verA.extracted_data || '{}') : {};
      const dataB = verB ? JSON.parse(verB.extracted_data || '{}') : {};

      const fieldsToCompare = ['title', 'provider', 'documentNumber', 'expiryDate', 'amount', 'currency'];
      const diffs: FieldDiff[] = [];

      for (const field of fieldsToCompare) {
        const valA = dataA[field] !== undefined && dataA[field] !== null ? String(dataA[field]) : '';
        const valB = dataB[field] !== undefined && dataB[field] !== null ? String(dataB[field]) : '';

        let status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED' = 'UNCHANGED';
        if (!valA && valB) status = 'ADDED';
        else if (valA && !valB) status = 'REMOVED';
        else if (valA !== valB) status = 'CHANGED';

        diffs.push({
          fieldName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
          oldValue: valA,
          newValue: valB,
          status,
        });
      }

      return res.json({
        versionA: verA?.version_number,
        versionB: verB?.version_number,
        diffs,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. Get System Audit History Trail
  async getAuditLogs(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();

      const logs = await db.query(
        `SELECT al.*, u.name as user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.user_id = $1
         ORDER BY al.created_at DESC
         LIMIT 50`,
        [userId]
      );

      return res.json({ logs: logs.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
