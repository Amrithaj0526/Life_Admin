import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';
import { ReminderService } from '../services/reminders/reminderService.js';
import { PriorityEngine } from '../services/documents/priorityEngine.js';

export const actionController = {
  // 1. List Actions with Priority & Status Filters
  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { status, priority } = req.query;
      const db = await getDatabase();

      let sql = `
        SELECT
          a.id, a.title, a.description, a.type, a.due_date, a.priority, a.status, a.created_at, a.completed_at,
          d.id as document_id, d.title as document_title, d.provider,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          r.id as reminder_id, r.calendar_sync_status, r.google_calendar_event_id
        FROM actions a
        JOIN documents d ON a.document_id = d.id
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN reminders r ON r.action_id = a.id
        WHERE d.user_id = $1
      `;
      const params: any[] = [userId];
      let pIdx = 2;

      if (status) {
        sql += ` AND a.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }

      if (priority) {
        sql += ` AND a.priority = $${pIdx}`;
        params.push(priority);
        pIdx++;
      }

      sql += ` ORDER BY
        CASE
          WHEN a.priority = 'CRITICAL' THEN 1
          WHEN a.priority = 'HIGH' THEN 2
          WHEN a.priority = 'MEDIUM' THEN 3
          ELSE 4
        END,
        a.due_date ASC
      `;

      const result = await db.query(sql, params);

      // Re-evaluate dynamic overdue status
      const today = new Date().toISOString().split('T')[0];
      const actionsWithEvaluatedPriority = result.rows.map((act: any) => {
        const evalRes = PriorityEngine.calculate(act.due_date, act.type, act.category_name);
        return {
          ...act,
          priorityReason: evalRes.reason,
          daysRemaining: evalRes.daysRemaining,
          isOverdue: act.due_date < today && act.status !== 'COMPLETED',
        };
      });

      return res.json({ actions: actionsWithEvaluatedPriority });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Mark Action Complete
  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      // Check ownership
      const check = await db.query(
        `SELECT a.id FROM actions a JOIN documents d ON a.document_id = d.id WHERE a.id = $1 AND d.user_id = $2`,
        [id, userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Action not found' });
      }

      await db.query(
        `UPDATE actions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      // Cancel future scheduled reminders for this action
      await ReminderService.cancelRemindersForAction(id);

      // Audit log
      await db.query(
        `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata, created_at)
         VALUES ($1, $2, 'ACTION', $3, 'ACTION_COMPLETED', $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), userId, id, JSON.stringify({ completedAt: new Date().toISOString() })]
      );

      return res.json({ message: 'Action marked as completed successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Start Action (IN_PROGRESS)
  async start(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      const check = await db.query(
        `SELECT a.id FROM actions a JOIN documents d ON a.document_id = d.id WHERE a.id = $1 AND d.user_id = $2`,
        [id, userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Action not found' });
      }

      await db.query(
        `UPDATE actions SET status = 'IN_PROGRESS' WHERE id = $1`,
        [id]
      );

      return res.json({ message: 'Action marked as in progress.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
