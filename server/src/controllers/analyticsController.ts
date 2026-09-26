import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export const analyticsController = {
  async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];

      // 1. Category Distribution (Only categories with documents for this user)
      const catRes = await db.query(
        `SELECT c.name, c.color, COUNT(d.id) as count
         FROM categories c
         JOIN documents d ON d.category_id = c.id
         WHERE d.user_id = $1 AND d.status != 'ARCHIVED'
         GROUP BY c.id, c.name, c.color
         ORDER BY count DESC`,
        [userId]
      );

      const categoryDistribution = catRes.rows.map((row: any) => ({
        name: row.name,
        color: row.color || '#4F46E5',
        count: parseInt(row.count, 10),
      }));

      // 2. Real Expiration Timeline Projections for Next 6 Months
      // Generate the next 6 month labels (e.g., "Sep 26", "Oct 26", ...)
      const monthsList: { key: string; label: string; count: number }[] = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const shortMonth = d.toLocaleString('en-US', { month: 'short' });
        const shortYear = String(yyyy).slice(-2);
        monthsList.push({
          key: `${yyyy}-${mm}`,
          label: `${shortMonth} '${shortYear}`,
          count: 0,
        });
      }

      // Fetch user's documents and actions with expiry/due dates
      const expRes = await db.query(
        `SELECT expiry_date as date_val FROM documents
         WHERE user_id = $1 AND expiry_date IS NOT NULL AND expiry_date != '' AND status != 'ARCHIVED'
         UNION ALL
         SELECT a.due_date as date_val FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED' AND a.due_date IS NOT NULL AND a.due_date != ''`,
        [userId]
      );

      for (const row of expRes.rows) {
        if (!row.date_val) continue;
        const datePrefix = row.date_val.slice(0, 7); // "YYYY-MM"
        const target = monthsList.find((m) => m.key === datePrefix);
        if (target) {
          target.count += 1;
        }
      }

      const expiryTrend = monthsList.map((m) => ({
        month: m.label,
        count: m.count,
      }));

      // 3. Priority Urgency Breakdown (Real from actions)
      const priorityRes = await db.query(
        `SELECT a.priority, COUNT(*) as count
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'
         GROUP BY a.priority`,
        [userId]
      );

      const pMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const row of priorityRes.rows) {
        pMap[row.priority] = parseInt(row.count, 10);
      }

      const urgencyDistribution = [
        { priority: 'Critical', count: pMap.CRITICAL, color: '#EF4444' },
        { priority: 'High', count: pMap.HIGH, color: '#F59E0B' },
        { priority: 'Medium', count: pMap.MEDIUM, color: '#3B82F6' },
        { priority: 'Low', count: pMap.LOW, color: '#94A3B8' },
      ];

      // 4. Action Completion Status
      const actionStatusRes = await db.query(
        `SELECT
           SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
           SUM(CASE WHEN a.status != 'COMPLETED' AND a.due_date >= $2 THEN 1 ELSE 0 END) as active_count,
           SUM(CASE WHEN a.status != 'COMPLETED' AND a.due_date < $2 THEN 1 ELSE 0 END) as overdue_count
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1`,
        [userId, today]
      );

      const actionCounts = actionStatusRes.rows[0] || {};
      const actionStatusData = [
        { name: 'Completed on Time', count: parseInt(actionCounts.completed_count || '0', 10), color: '#10B981' },
        { name: 'Upcoming & Scheduled', count: parseInt(actionCounts.active_count || '0', 10), color: '#3B82F6' },
        { name: 'Overdue Attention', count: parseInt(actionCounts.overdue_count || '0', 10), color: '#EF4444' },
      ];

      // 5. System Health & Real Verification Metrics
      const docStats = await db.query(
        `SELECT
           COUNT(*) as total_docs,
           SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_docs,
           AVG(CASE WHEN confidence > 0 THEN confidence ELSE NULL END) as avg_confidence,
           SUM(CASE WHEN expiry_date < $2 AND expiry_date IS NOT NULL AND expiry_date != '' THEN 1 ELSE 0 END) as expired_docs,
           SUM(COALESCE(amount, 0)) as total_amount
         FROM documents
         WHERE user_id = $1 AND status != 'ARCHIVED'`,
        [userId, today]
      );

      const reminderStats = await db.query(
        `SELECT
           COUNT(r.id) as total_reminders,
           SUM(CASE WHEN r.calendar_sync_status = 'SYNCED' THEN 1 ELSE 0 END) as synced_reminders
         FROM reminders r
         JOIN actions a ON r.action_id = a.id
         JOIN documents d ON a.document_id = d.id
         WHERE d.user_id = $1`,
        [userId]
      );

      const totalDocsCount = parseInt(docStats.rows[0]?.total_docs || '0', 10);
      const verifiedDocsCount = parseInt(docStats.rows[0]?.verified_docs || '0', 10);
      const rawAvgConf = parseFloat(docStats.rows[0]?.avg_confidence || '0.92');
      const avgConfidencePct = totalDocsCount > 0 ? (rawAvgConf * 100).toFixed(1) : '95.0';
      const verificationRate = totalDocsCount > 0 ? Math.round((verifiedDocsCount / totalDocsCount) * 100) : 100;
      const expiredDocsCount = parseInt(docStats.rows[0]?.expired_docs || '0', 10);
      const totalAmount = parseFloat(docStats.rows[0]?.total_amount || '0');

      const totalReminders = parseInt(reminderStats.rows[0]?.total_reminders || '0', 10);
      const syncedReminders = parseInt(reminderStats.rows[0]?.synced_reminders || '0', 10);

      return res.json({
        categoryDistribution,
        expiryTrend,
        urgencyDistribution,
        actionStatusData,
        metrics: {
          totalDocuments: totalDocsCount,
          verifiedDocuments: verifiedDocsCount,
          verificationRate,
          avgConfidencePct: `${avgConfidencePct}%`,
          expiredDocuments: expiredDocsCount,
          totalProtectedValue: totalAmount,
          totalReminders,
          syncedReminders,
          calendarSyncRate: totalReminders > 0 ? Math.round((syncedReminders / totalReminders) * 100) : 0,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
