import { Request, Response } from 'express';
import { GoogleCalendarService } from '../services/calendar/googleCalendarService.js';
import { getDatabase } from '../config/database.js';
import { config } from '../config/env.js';

export const calendarController = {
  // 1. Get OAuth Connect URL
  async getConnectUrl(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const url = GoogleCalendarService.getAuthUrl(userId);
      return res.json({ url });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. OAuth Callback
  async handleCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      const userId = (state as string) || (req.user?.id);

      if (!code || !userId) {
        return res.redirect(`${config.clientUrl}/settings?calendar_error=missing_code`);
      }

      await GoogleCalendarService.handleCallback(code as string, userId);
      return res.redirect(`${config.clientUrl}/settings?calendar_connected=true`);
    } catch (err: any) {
      console.error('[Calendar Callback Error]', err);
      return res.redirect(`${config.clientUrl}/settings?calendar_error=auth_failed`);
    }
  },

  // 3. Get Connection Status
  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const status = await GoogleCalendarService.getStatus(userId);
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. Disconnect Google Calendar
  async disconnect(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      await GoogleCalendarService.disconnect(userId);
      return res.json({ message: 'Google Calendar integration disconnected successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 5. Sync a single Reminder to Google Calendar
  async syncReminder(req: Request, res: Response) {
    try {
      const { reminderId } = req.params;
      const userId = req.user!.id;
      const db = await getDatabase();

      // Find reminder, action and document
      const queryRes = await db.query(
        `SELECT r.id, r.scheduled_for, a.title, a.due_date, a.description,
                d.title as doc_title, c.name as category_name
         FROM reminders r
         JOIN actions a ON r.action_id = a.id
         JOIN documents d ON a.document_id = d.id
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE r.id = $1 AND d.user_id = $2`,
        [reminderId, userId]
      );

      if (queryRes.rows.length === 0) {
        return res.status(404).json({ error: 'Reminder not found or unauthorized.' });
      }

      const row = queryRes.rows[0];
      const payload = {
        summary: `[LifeAdmin] ${row.title}`,
        description: `This reminder was created by LifeAdmin.\n\nDocument: ${row.doc_title}\nCategory: ${row.category_name || 'General'}\nDue Date: ${row.due_date}\n\nManaged automatically by LifeAdmin.`,
        date: row.due_date,
        reminderMinutes: [43200, 10080, 1440], // 30d, 7d, 1d
      };

      const syncResult = await GoogleCalendarService.syncEventForReminder(userId, reminderId, payload);
      return res.json({
        message: syncResult.status === 'SYNCED' ? 'Synchronized with Google Calendar.' : 'Calendar sync failed.',
        eventId: syncResult.eventId,
        status: syncResult.status,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 6. Delete Calendar Event
  async removeEvent(req: Request, res: Response) {
    try {
      const { reminderId } = req.params;
      const userId = req.user!.id;
      await GoogleCalendarService.deleteEventForReminder(userId, reminderId);
      return res.json({ message: 'Google Calendar event deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 7. Manual Sync All Active Reminders
  async syncAll(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await GoogleCalendarService.syncAllActiveReminders(userId);
      return res.json({
        message: `Sync completed: ${result.syncedCount} synchronized, ${result.errors} failed.`,
        syncedCount: result.syncedCount,
        errors: result.errors,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
