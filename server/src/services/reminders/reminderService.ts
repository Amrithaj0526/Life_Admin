import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../config/database.js';

export interface ReminderRule {
  daysBefore: number;
}

export class ReminderService {
  // Standard schedule: 30, 14, 7, 3, 1 days before and on due date
  private static defaultDaysBefore = [30, 14, 7, 3, 1, 0];

  static async scheduleRemindersForAction(actionId: string, dueDateStr: string): Promise<number> {
    const db = await getDatabase();
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(9, 0, 0, 0); // 9:00 AM

    const now = new Date();
    let scheduledCount = 0;

    for (const days of this.defaultDaysBefore) {
      const scheduledFor = new Date(dueDate);
      scheduledFor.setDate(scheduledFor.getDate() - days);

      if (scheduledFor > now) {
        const scheduledStr = scheduledFor.toISOString();

        // Check duplicate
        const existing = await db.query(
          'SELECT id FROM reminders WHERE action_id = $1 AND scheduled_for = $2',
          [actionId, scheduledStr]
        );

        if (existing.rows.length === 0) {
          await db.query(
            `INSERT INTO reminders (id, action_id, scheduled_for, status, channel, created_at)
             VALUES ($1, $2, $3, 'SCHEDULED', 'IN_APP', CURRENT_TIMESTAMP)`,
            [uuidv4(), actionId, scheduledStr]
          );
          scheduledCount++;
        }
      }
    }

    return scheduledCount;
  }

  static async cancelRemindersForAction(actionId: string): Promise<void> {
    const db = await getDatabase();
    await db.query(
      `UPDATE reminders SET status = 'CANCELLED' WHERE action_id = $1 AND status = 'SCHEDULED'`,
      [actionId]
    );
  }

  static async recalculateActionReminders(actionId: string, newDueDateStr: string): Promise<void> {
    await this.cancelRemindersForAction(actionId);
    await this.scheduleRemindersForAction(actionId, newDueDateStr);
  }
}
