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
  // Retrieve effective Google OAuth credentials (database settings take priority over .env)
  static async getEffectiveCredentials(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
    try {
      const db = await getDatabase();
      const idRes = await db.query(`SELECT value FROM system_settings WHERE key = 'GOOGLE_CLIENT_ID'`);
      const secRes = await db.query(`SELECT value FROM system_settings WHERE key = 'GOOGLE_CLIENT_SECRET'`);

      const dbClientId = idRes.rows[0]?.value;
      const dbClientSecret = secRes.rows[0]?.value;

      return {
        clientId: (dbClientId || config.googleClientId || '').trim(),
        clientSecret: (dbClientSecret || config.googleClientSecret || '').trim(),
        redirectUri: config.googleRedirectUri,
      };
    } catch {
      return {
        clientId: config.googleClientId.trim(),
        clientSecret: config.googleClientSecret.trim(),
        redirectUri: config.googleRedirectUri,
      };
    }
  }

  // Get configuration status for settings page
  static async getCredentialsStatus(): Promise<{ configured: boolean; clientId: string; hasSecret: boolean; redirectUri: string }> {
    const creds = await this.getEffectiveCredentials();
    return {
      configured: Boolean(creds.clientId && creds.clientSecret),
      clientId: creds.clientId,
      hasSecret: Boolean(creds.clientSecret),
      redirectUri: creds.redirectUri,
    };
  }

  // Save user-provided Google OAuth credentials
  static async saveCredentials(clientId: string, clientSecret: string): Promise<void> {
    const db = await getDatabase();
    // Check if system_settings exists, SQLite insert or replace
    await db.query(
      `INSERT INTO system_settings (key, value) VALUES ('GOOGLE_CLIENT_ID', $1)
       ON CONFLICT(key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [clientId.trim()]
    );
    await db.query(
      `INSERT INTO system_settings (key, value) VALUES ('GOOGLE_CLIENT_SECRET', $1)
       ON CONFLICT(key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [clientSecret.trim()]
    );
    config.googleClientId = clientId.trim();
    config.googleClientSecret = clientSecret.trim();
  }

  private static async getOAuth2Client() {
    const creds = await this.getEffectiveCredentials();
    return new google.auth.OAuth2(
      creds.clientId,
      creds.clientSecret,
      creds.redirectUri
    );
  }

  // 1. Generate Auth URL for user to grant calendar permission
  static async getAuthUrl(userId: string): Promise<{ url?: string; configured: boolean; message?: string }> {
    const creds = await this.getEffectiveCredentials();
    if (!creds.clientId || !creds.clientSecret) {
      return {
        configured: false,
        message: 'Google Cloud OAuth Client ID & Secret must be configured in settings to link your real Google account.',
      };
    }

    const oauth2Client = await this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });

    return { url, configured: true };
  }

  // 2. Handle OAuth Callback and Save Tokens
  static async handleCallback(code: string, userId: string): Promise<{ email: string }> {
    const db = await getDatabase();
    const creds = await this.getEffectiveCredentials();

    if (!creds.clientId || !creds.clientSecret) {
      throw new Error('Google OAuth credentials not configured on server.');
    }

    const oauth2Client = await this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user's real verified Gmail address from Google API
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || 'connected.google.user@gmail.com';

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

    const creds = await this.getEffectiveCredentials();

    // Check if running in mock/offline mode without client credentials
    if (!creds.clientId || tokenData.access_token === 'demo_access_token') {
      const generatedEventId = existingEventId || `gcal_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      await db.query(
        `UPDATE reminders SET google_calendar_event_id = $1, calendar_sync_status = 'SYNCED', channel = 'GOOGLE_CALENDAR', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [generatedEventId, reminderId]
      );
      return { eventId: generatedEventId, status: 'SYNCED' };
    }

    try {
      const oauth2Client = await this.getOAuth2Client();
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

    const creds = await this.getEffectiveCredentials();
    if (tokenRes.rows.length > 0 && creds.clientId && tokenRes.rows[0].access_token !== 'demo_access_token') {
      try {
        const oauth2Client = await this.getOAuth2Client();
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

  // 8. Generate 1-Click Direct Google Calendar Web Intent URL
  static generateWebIntentUrl(event: { summary: string; description?: string; date: string }): string {
    const start = event.date.replace(/-/g, '');
    const dateObj = new Date(event.date);
    dateObj.setDate(dateObj.getDate() + 1);
    const end = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.summary,
      dates: `${start}/${end}`,
      details: event.description || 'Synced from LifeAdmin Platform',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // 9. Generate standard RFC 5545 iCalendar (.ics) file for all active reminders
  static async generateIcsFeed(userId: string): Promise<string> {
    const db = await getDatabase();
    const rows = await db.query(
      `SELECT a.title, a.due_date, a.description, d.title as doc_title, c.name as category_name
       FROM actions a
       JOIN documents d ON a.document_id = d.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.user_id = $1 AND a.status != 'COMPLETED'`,
      [userId]
    );

    const nowIso = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LifeAdmin//Personal Document Intelligence//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:LifeAdmin Deadlines',
    ];

    for (const r of rows.rows) {
      if (!r.due_date) continue;
      const cleanDate = r.due_date.replace(/-/g, '');
      const uid = `lifeadmin-${uuidv4()}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowIso}`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:[LifeAdmin] ${r.title}`,
        `DESCRIPTION:${(r.description || '').replace(/\n/g, '\\n')}\\nDocument: ${r.doc_title || ''}\\nCategory: ${r.category_name || ''}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${r.title}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
}
