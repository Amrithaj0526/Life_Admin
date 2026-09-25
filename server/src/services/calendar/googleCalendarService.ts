import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env.js';
import { getDatabase } from '../../config/database.js';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  date: string; // YYYY-MM-DD
  reminderMinutes: number[]; // e.g. [43200, 10080, 1440] (30 days, 7 days, 1 day)
}

export class GoogleCalendarService {
  private static getOAuth2Client() {
    return new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
  }

  // 1. Generate Auth URL for user to grant calendar permission
  static getAuthUrl(userId: string): string {
    if (!config.googleClientId || !config.googleClientSecret) {
      // In local dev without credentials, provide a mock redirect that simulates success
      return `${config.clientUrl}/settings?demo_google_connect=true`;
    }

    const oauth2Client = this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });
  }

  // 2. Handle OAuth Callback and Save Tokens
  static async handleCallback(code: string, userId: string): Promise<{ email: string }> {
    const db = await getDatabase();

    // Check for demo/mock connect mode
    if (!config.googleClientId || code === 'mock_demo_code') {
      const email = 'user.calendar@gmail.com';
      await db.query(`DELETE FROM google_calendar_tokens WHERE user_id = $1`, [userId]);
      await db.query(
        `INSERT INTO google_calendar_tokens (id, user_id, email, access_token, refresh_token, token_type, sync_enabled)
         VALUES ($1, $2, $3, 'demo_access_token', 'demo_refresh_token', 'Bearer', 1)`,
        [uuidv4(), userId, email]
      );
      return { email };
    }

    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || 'connected@gmail.com';

    await db.query(`DELETE FROM google_calendar_tokens WHERE user_id = $1`, [userId]);
    await db.query(
      `INSERT INTO google_calendar_tokens (id, user_id, email, access_token, refresh_token, scope, token_type, expiry_date, sync_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
      [
        uuidv4(),
        userId,
        email,
        tokens.access_token || '',
        tokens.refresh_token || null,
        tokens.scope || '',
        tokens.token_type || 'Bearer',
        tokens.expiry_date || null,
      ]
    );

    return { email };
  }

  // 3. Get User Connection Status
  static async getStatus(userId: string): Promise<{ connected: boolean; email?: string; syncEnabled: boolean }> {
    const db = await getDatabase();
    const res = await db.query(
      `SELECT email, sync_enabled FROM google_calendar_tokens WHERE user_id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      return { connected: false, syncEnabled: false };
    }

    return {
      connected: true,
      email: res.rows[0].email,
      syncEnabled: res.rows[0].sync_enabled === 1,
    };
  }

  // 4. Disconnect Google Calendar
  static async disconnect(userId: string): Promise<void> {
    const db = await getDatabase();
    await db.query(`DELETE FROM google_calendar_tokens WHERE user_id = $1`, [userId]);
    // Reset sync status on user reminders
    await db.query(
      `UPDATE reminders SET calendar_sync_status = 'DISCONNECTED'
       WHERE action_id IN (SELECT a.id FROM actions a JOIN documents d ON a.document_id = d.id WHERE d.user_id = $1)`,
      [userId]
    );
  }

  // 5. Create or Update Event in Google Calendar
  static async syncEventForReminder(
    userId: string,
    reminderId: string,
    payload: CalendarEventPayload
  ): Promise<{ eventId: string; status: 'SYNCED' | 'FAILED' }> {
    const db = await getDatabase();

    const tokenRes = await db.query(
      `SELECT * FROM google_calendar_tokens WHERE user_id = $1`,
      [userId]
    );

    if (tokenRes.rows.length === 0) {
      await db.query(`UPDATE reminders SET calendar_sync_status = 'NOT_CONNECTED' WHERE id = $1`, [reminderId]);
      return { eventId: '', status: 'FAILED' };
    }

    const tokenData = tokenRes.rows[0];

    // Check if event already exists
    const remRes = await db.query(
      `SELECT google_calendar_event_id FROM reminders WHERE id = $1`,
      [reminderId]
    );
    const existingEventId = remRes.rows[0]?.google_calendar_event_id;

    // Check if running in mock/offline mode without client credentials
    if (!config.googleClientId || tokenData.access_token === 'demo_access_token') {
      const generatedEventId = existingEventId || `gcal_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      await db.query(
        `UPDATE reminders SET google_calendar_event_id = $1, calendar_sync_status = 'SYNCED', channel = 'GOOGLE_CALENDAR', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [generatedEventId, reminderId]
      );
      return { eventId: generatedEventId, status: 'SYNCED' };
    }

    try {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const overrides = payload.reminderMinutes.map((min) => ({
        method: 'popup',
        minutes: min,
      }));

      const eventBody = {
        summary: payload.summary,
        description: payload.description,
        start: { date: payload.date },
        end: { date: payload.date },
        reminders: {
          useDefault: false,
          overrides: overrides.length > 0 ? overrides : [{ method: 'popup', minutes: 1440 }],
        },
      };

      let finalEventId = '';

      if (existingEventId) {
        // Update existing event
        const updated = await calendar.events.update({
          calendarId: 'primary',
          eventId: existingEventId,
          requestBody: eventBody,
        });
        finalEventId = updated.data.id || existingEventId;
      } else {
        // Insert new event
        const created = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        });
        finalEventId = created.data.id || '';
      }

      await db.query(
        `UPDATE reminders SET google_calendar_event_id = $1, calendar_sync_status = 'SYNCED', channel = 'GOOGLE_CALENDAR', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [finalEventId, reminderId]
      );

      return { eventId: finalEventId, status: 'SYNCED' };
    } catch (err: any) {
      console.error('[Google Calendar Sync Error]', err.message);
      await db.query(
        `UPDATE reminders SET calendar_sync_status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [reminderId]
      );
      return { eventId: '', status: 'FAILED' };
    }
  }

  // 6. Delete Event from Google Calendar
  static async deleteEventForReminder(userId: string, reminderId: string): Promise<void> {
    const db = await getDatabase();
    const remRes = await db.query(
      `SELECT google_calendar_event_id FROM reminders WHERE id = $1`,
      [reminderId]
    );

    const eventId = remRes.rows[0]?.google_calendar_event_id;
    if (!eventId) return;

    const tokenRes = await db.query(
      `SELECT * FROM google_calendar_tokens WHERE user_id = $1`,
      [userId]
    );

    if (tokenRes.rows.length > 0 && config.googleClientId && tokenRes.rows[0].access_token !== 'demo_access_token') {
      try {
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
          access_token: tokenRes.rows[0].access_token,
          refresh_token: tokenRes.rows[0].refresh_token,
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({ calendarId: 'primary', eventId });
      } catch (err) {
        console.warn('[Google Calendar Delete Event Warning]', err);
      }
    }

    await db.query(
      `UPDATE reminders SET google_calendar_event_id = NULL, calendar_sync_status = 'NOT_CONNECTED' WHERE id = $1`,
      [reminderId]
    );
  }

  // 7. Manual Sync All Active Reminders for User
  static async syncAllActiveReminders(userId: string): Promise<{ syncedCount: number; errors: number }> {
    const db = await getDatabase();
    const actionsRes = await db.query(
      `SELECT a.id as action_id, a.title, a.due_date, a.description,
              d.title as doc_title, d.expiry_date, c.name as category_name,
              r.id as reminder_id, r.google_calendar_event_id
       FROM actions a
       JOIN documents d ON a.document_id = d.id
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN reminders r ON r.action_id = a.id
       WHERE d.user_id = $1 AND a.status != 'COMPLETED'`,
      [userId]
    );

    let syncedCount = 0;
    let errors = 0;

    for (const row of actionsRes.rows) {
      if (!row.reminder_id) continue;

      const payload: CalendarEventPayload = {
        summary: `[LifeAdmin] ${row.title}`,
        description: `This reminder was created by LifeAdmin.\n\nDocument: ${row.doc_title}\nCategory: ${row.category_name || 'General'}\nDue Date: ${row.due_date}\n\nManaged automatically by LifeAdmin.`,
        date: row.due_date,
        reminderMinutes: [43200, 10080, 1440], // 30d, 7d, 1d
      };

      const res = await this.syncEventForReminder(userId, row.reminder_id, payload);
      if (res.status === 'SYNCED') syncedCount++;
      else errors++;
    }

    return { syncedCount, errors };
  }
}
