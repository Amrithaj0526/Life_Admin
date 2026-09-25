import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export const searchController = {
  // 1. Standard Multi-field Keyword Search
  async search(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { q } = req.query;
      const queryStr = typeof q === 'string' ? q.trim() : '';

      if (!queryStr) {
        return res.json({ documents: [], actions: [] });
      }

      const db = await getDatabase();
      const term = `%${queryStr}%`;

      const docs = await db.query(
        `SELECT d.*, c.name as category_name, c.color as category_color
         FROM documents d
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1 AND (
           LOWER(d.title) LIKE LOWER($2) OR
           LOWER(d.provider) LIKE LOWER($2) OR
           LOWER(d.document_number) LIKE LOWER($2) OR
           LOWER(d.ocr_text) LIKE LOWER($2) OR
           LOWER(c.name) LIKE LOWER($2)
         )
         LIMIT 20`,
        [userId, term]
      );

      const actions = await db.query(
        `SELECT a.*, d.title as document_title
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND (
           LOWER(a.title) LIKE LOWER($2) OR
           LOWER(a.description) LIKE LOWER($2)
         )
         LIMIT 20`,
        [userId, term]
      );

      return res.json({ documents: docs.rows, actions: actions.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Natural Language Search Parser (Safe Parameterized Filter Translation)
  async naturalLanguage(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { q } = req.query;
      const prompt = typeof q === 'string' ? q.toLowerCase() : '';

      const db = await getDatabase();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      let categoryFilter: string | null = null;
      let expiringSoon = false;
      let overdue = false;
      let onlyActions = false;

      // Safe deterministic intent classification (no raw AI SQL execution)
      if (prompt.includes('insurance')) categoryFilter = 'Insurance';
      else if (prompt.includes('car') || prompt.includes('vehicle')) categoryFilter = 'Vehicle';
      else if (prompt.includes('bill') || prompt.includes('utility')) categoryFilter = 'Bills';
      else if (prompt.includes('warranty')) categoryFilter = 'Warranty';
      else if (prompt.includes('identity') || prompt.includes('passport')) categoryFilter = 'Identity';

      if (prompt.includes('expir') || prompt.includes('renew') || prompt.includes('next month') || prompt.includes('this year')) {
        expiringSoon = true;
      }
      if (prompt.includes('overdue') || prompt.includes('late')) {
        overdue = true;
      }
      if (prompt.includes('action') || prompt.includes('what do i need to do') || prompt.includes('payment') || prompt.includes('due')) {
        onlyActions = true;
      }

      let sql = `
        SELECT d.*, c.name as category_name, c.color as category_color
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.user_id = $1 AND d.status != 'ARCHIVED'
      `;
      const params: any[] = [userId];
      let pIdx = 2;

      if (categoryFilter) {
        sql += ` AND LOWER(c.name) = LOWER($${pIdx})`;
        params.push(categoryFilter);
        pIdx++;
      }

      if (expiringSoon) {
        const nextMonth = new Date(today);
        nextMonth.setDate(nextMonth.getDate() + 45);
        sql += ` AND d.expiry_date >= $${pIdx} AND d.expiry_date <= $${pIdx + 1}`;
        params.push(todayStr, nextMonth.toISOString().split('T')[0]);
        pIdx += 2;
      }

      sql += ` ORDER BY d.expiry_date ASC NULLS LAST LIMIT 15`;
      const docsRes = await db.query(sql, params);

      // Actions query
      const actionsRes = await db.query(
        `SELECT a.*, d.title as document_title
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'
         ORDER BY a.due_date ASC LIMIT 10`,
        [userId]
      );

      return res.json({
        interpretedQuery: {
          category: categoryFilter,
          expiringSoon,
          overdue,
          onlyActions,
        },
        documents: docsRes.rows,
        actions: actionsRes.rows,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
