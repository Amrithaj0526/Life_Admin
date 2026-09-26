import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDatabase } from '../config/database.js';
import { ocrService } from '../services/ocr/ocrService.js';
import { aiService } from '../services/ai/aiService.js';
import { PriorityEngine } from '../services/documents/priorityEngine.js';
import { ReminderService } from '../services/reminders/reminderService.js';
import { config } from '../config/env.js';

export const documentController = {
  // 1. Upload & Analyze Document
  async upload(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const userId = req.user!.id;
      const documentId = uuidv4();
      const db = await getDatabase();

      // Initial DB record with UPLOADED status
      await db.query(
        `INSERT INTO documents (
          id, user_id, title, status, storage_key, original_filename,
          mime_type, file_size, verification_status, created_at, updated_at
        ) VALUES ($1, $2, $3, 'PROCESSING', $4, $5, $6, $7, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          documentId,
          userId,
          file.originalname,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
        ]
      );

      // Async process pipeline (OCR + AI + Action Detection)
      (async () => {
        try {
          const filePath = path.join(config.uploadDir, file.filename);

          // Step 1: OCR
          const ocrText = await ocrService.extractText(filePath, file.mimetype);
          await db.query(
            `UPDATE documents SET ocr_text = $1, status = 'OCR_COMPLETED' WHERE id = $2`,
            [ocrText, documentId]
          );

          // Step 2: AI Structured Extraction
          const analysis = await aiService.analyzeDocument(ocrText, file.originalname);

          // Find or create category
          let categoryId = null;
          const catQuery = await db.query(
            `SELECT id FROM categories WHERE LOWER(name) = LOWER($1)`,
            [analysis.categoryName]
          );
          if (catQuery.rows.length > 0) {
            categoryId = catQuery.rows[0].id;
          } else {
            categoryId = 'cat_other';
          }

          // Step 3: Update Document metadata & transition to NEEDS_REVIEW
          await db.query(
            `UPDATE documents SET
              title = $1,
              category_id = $2,
              status = 'NEEDS_REVIEW',
              provider = $3,
              document_number = $4,
              owner_name = $5,
              issue_date = $6,
              expiry_date = $7,
              amount = $8,
              currency = $9,
              summary = $10,
              confidence = $11,
              analysis_source = $12,
              is_demo_mode = $13,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $14`,
            [
              analysis.title,
              categoryId,
              analysis.provider || null,
              analysis.documentNumber || null,
              analysis.ownerName || null,
              analysis.issueDate || null,
              analysis.expiryDate || null,
              analysis.amount || null,
              analysis.currency || 'USD',
              analysis.summary || null,
              analysis.confidence || 0.9,
              analysis.analysisSource,
              analysis.isDemoMode ? 1 : 0,
              documentId,
            ]
          );

          // Store extracted fields
          for (const f of analysis.fields) {
            await db.query(
              `INSERT INTO document_fields (id, document_id, field_name, field_value, confidence, source, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, 'AI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [uuidv4(), documentId, f.fieldName, f.fieldValue, f.confidence]
            );
          }

          // Step 4: Detect Actions and calculate Priority
          for (const act of analysis.actions) {
            const actionId = uuidv4();
            const priorityEval = PriorityEngine.calculate(
              act.dueDate,
              act.type,
              analysis.categoryName
            );

            await db.query(
              `INSERT INTO actions (id, document_id, title, description, type, due_date, priority, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', CURRENT_TIMESTAMP)`,
              [
                actionId,
                documentId,
                act.title,
                act.description || null,
                act.type,
                act.dueDate,
                priorityEval.priority,
              ]
            );

            // Schedule default automated reminders
            await ReminderService.scheduleRemindersForAction(actionId, act.dueDate);
          }

          // Step 5: Version 1 record
          await db.query(
            `INSERT INTO document_versions (id, document_id, version_number, storage_key, original_filename, ocr_text, extracted_data, created_at)
             VALUES ($1, $2, 1, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
              uuidv4(),
              documentId,
              file.filename,
              file.originalname,
              ocrText,
              JSON.stringify(analysis),
            ]
          );

          // Step 6: Log Audit
          await db.query(
            `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata, created_at)
             VALUES ($1, $2, 'DOCUMENT', $3, 'DOCUMENT_PROCESSED', $4, CURRENT_TIMESTAMP)`,
            [
              uuidv4(),
              userId,
              documentId,
              JSON.stringify({ title: analysis.title, category: analysis.categoryName }),
            ]
          );
        } catch (pipelineErr: any) {
          console.error('[Pipeline Error]', pipelineErr);
          await db.query(
            `UPDATE documents SET status = 'FAILED' WHERE id = $1`,
            [documentId]
          );
        }
      })();

      return res.status(201).json({
        id: documentId,
        message: 'Document uploaded. Background processing started.',
        status: 'PROCESSING',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. List Documents with Filtering, Search & Priority Sort
  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { category, status, search, sort } = req.query;
      const db = await getDatabase();

      let sql = `
        SELECT
          d.id, d.title, d.status, d.provider, d.document_number,
          d.issue_date, d.expiry_date, d.amount, d.currency, d.confidence,
          d.verification_status, d.renewal_status, d.analysis_source, d.is_demo_mode,
          d.created_at, d.updated_at,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          (SELECT COUNT(*) FROM actions a WHERE a.document_id = d.id AND a.status != 'COMPLETED') as pending_actions_count
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.user_id = $1
      `;
      const params: any[] = [userId];
      let pIdx = 2;

      if (category) {
        sql += ` AND (LOWER(c.name) = LOWER($${pIdx}) OR d.category_id = $${pIdx})`;
        params.push(category);
        pIdx++;
      }

      if (status) {
        sql += ` AND d.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      } else {
        sql += ` AND d.status != 'ARCHIVED'`;
      }

      if (search) {
        sql += ` AND (LOWER(d.title) LIKE LOWER($${pIdx}) OR LOWER(d.provider) LIKE LOWER($${pIdx}) OR LOWER(d.document_number) LIKE LOWER($${pIdx}))`;
        params.push(`%${search}%`);
        pIdx++;
      }

      if (sort === 'expiring_soon') {
        sql += ` ORDER BY d.expiry_date ASC NULLS LAST`;
      } else if (sort === 'oldest') {
        sql += ` ORDER BY d.created_at ASC`;
      } else {
        sql += ` ORDER BY d.created_at DESC`;
      }

      const result = await db.query(sql, params);
      return res.json({ documents: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Get Document Details (including Fields, Actions, Versions, Relationships)
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      const docRes = await db.query(
        `SELECT d.*, c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM documents d
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.id = $1 AND d.user_id = $2`,
        [id, userId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = docRes.rows[0];

      // Actions
      const actionsRes = await db.query(
        `SELECT * FROM actions WHERE document_id = $1 ORDER BY due_date ASC`,
        [id]
      );

      // Granular fields
      const fieldsRes = await db.query(
        `SELECT * FROM document_fields WHERE document_id = $1 ORDER BY created_at ASC`,
        [id]
      );

      // Versions
      const versionsRes = await db.query(
        `SELECT id, version_number, original_filename, change_summary, created_at
         FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC`,
        [id]
      );

      // Related documents
      const relRes = await db.query(
        `SELECT r.id, r.relationship_type, r.confidence,
                d2.id as target_id, d2.title as target_title, c2.name as target_category
         FROM document_relationships r
         JOIN documents d2 ON (r.target_document_id = d2.id)
         LEFT JOIN categories c2 ON d2.category_id = c2.id
         WHERE r.source_document_id = $1`,
        [id]
      );

      return res.json({
        document,
        actions: actionsRes.rows,
        fields: fieldsRes.rows,
        versions: versionsRes.rows,
        relationships: relRes.rows,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. Verify & Confirm AI Extraction (Human-In-The-Loop)
  async verify(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { title, provider, documentNumber, expiryDate, amount, currency } = req.body;
      const db = await getDatabase();

      await db.query(
        `UPDATE documents SET
          title = COALESCE($1, title),
          provider = COALESCE($2, provider),
          document_number = COALESCE($3, document_number),
          expiry_date = COALESCE($4, expiry_date),
          amount = COALESCE($5, amount),
          currency = COALESCE($6, currency),
          status = 'ACTIVE',
          verification_status = 'VERIFIED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND user_id = $8`,
        [title, provider, documentNumber, expiryDate, amount, currency, id, userId]
      );

      // Audit log
      await db.query(
        `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata, created_at)
         VALUES ($1, $2, 'DOCUMENT', $3, 'EXTRACTION_VERIFIED', $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), userId, id, JSON.stringify({ verifiedBy: userId })]
      );

      return res.json({ message: 'Document verified and activated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 5. Download Original File
  async downloadFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      const docRes = await db.query(
        `SELECT storage_key, original_filename, mime_type FROM documents WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const doc = docRes.rows[0];
      const filePath = path.join(config.uploadDir, doc.storage_key);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File does not exist on storage.' });
      }

      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
      return fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 6. Archive Document
  async archive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      await db.query(
        `UPDATE documents SET status = 'ARCHIVED', archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      return res.json({ message: 'Document archived successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
