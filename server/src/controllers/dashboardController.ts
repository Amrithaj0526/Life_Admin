import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export const dashboardController = {
  async getOverview(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];

      // 1. Metric Counts
      const totalDocs = await db.query(
        `SELECT COUNT(*) as count FROM documents WHERE user_id = $1 AND status != 'ARCHIVED'`,
        [userId]
      );

      const activeDocs = await db.query(
        `SELECT COUNT(*) as count FROM documents WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId]
      );

      const pendingReviewDocs = await db.query(
        `SELECT COUNT(*) as count FROM documents WHERE user_id = $1 AND status = 'NEEDS_REVIEW'`,
        [userId]
      );

      const overdueActions = await db.query(
        `SELECT COUNT(*) as count
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED' AND a.due_date < $2`,
        [userId, today]
      );

      const pendingActions = await db.query(
        `SELECT COUNT(*) as count
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'`,
        [userId]
      );

      // 2. Urgent Actions Required (Ordered by Priority & Proximity)
      const urgentActions = await db.query(
        `SELECT
          a.id, a.title, a.description, a.type, a.due_date, a.priority, a.status,
          d.id as document_id, d.title as document_title, d.provider,
          c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'
         ORDER BY
          CASE
            WHEN a.due_date < $2 THEN 1
            WHEN a.priority = 'CRITICAL' THEN 2
            WHEN a.priority = 'HIGH' THEN 3
            WHEN a.priority = 'MEDIUM' THEN 4
            ELSE 5
          END,
          a.due_date ASC
         LIMIT 6`,
        [userId, today]
      );

      // 3. Upcoming Deadlines Timeline (Next 60 Days)
      const upcomingDeadlines = await db.query(
        `SELECT
          d.id, d.title, d.expiry_date, d.amount, d.currency,
          c.name as category_name, c.color as category_color
         FROM documents d
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1 AND d.expiry_date >= $2 AND d.status != 'ARCHIVED'
         ORDER BY d.expiry_date ASC
         LIMIT 6`,
        [userId, today]
      );

      // 4. Recent Documents
      const recentDocs = await db.query(
        `SELECT
          d.id, d.title, d.status, d.created_at, d.expiry_date, d.amount, d.currency,
          c.name as category_name, c.color as category_color
         FROM documents d
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1
         ORDER BY d.created_at DESC
         LIMIT 5`,
        [userId]
      );

      // 5. Priority Summary Counts
      const prioritySummary = await db.query(
        `SELECT a.priority, COUNT(*) as count
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'
         GROUP BY a.priority`,
        [userId]
      );

      const pMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const row of prioritySummary.rows) {
        pMap[row.priority] = parseInt(row.count, 10);
      }

      return res.json({
        metrics: {
          totalDocuments: parseInt(totalDocs.rows[0]?.count || '0', 10),
          activeDocuments: parseInt(activeDocs.rows[0]?.count || '0', 10),
          pendingReview: parseInt(pendingReviewDocs.rows[0]?.count || '0', 10),
          overdueActions: parseInt(overdueActions.rows[0]?.count || '0', 10),
          pendingActions: parseInt(pendingActions.rows[0]?.count || '0', 10),
        },
        prioritySummary: pMap,
        urgentActions: urgentActions.rows,
        upcomingDeadlines: upcomingDeadlines.rows,
        recentDocuments: recentDocs.rows,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
