import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

export interface IDatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  close(): Promise<void>;
}

// 1. SQLite Client Implementation (for zero-setup instant local preview)
class SQLiteDatabaseClient implements IDatabaseClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  private initSchema() {
    const schemaFile = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaFile)) {
      let schemaSql = fs.readFileSync(schemaFile, 'utf-8');
      // Normalize Postgres types to SQLite
      schemaSql = schemaSql
        .replace(/TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP/gi, 'TEXT DEFAULT (datetime(\'now\'))')
        .replace(/TIMESTAMP WITH TIME ZONE/gi, 'TEXT');
      this.db.exec(schemaSql);
      // Auto-migrate newly added columns for existing SQLite tables if not present
      try {
        this.db.exec(`ALTER TABLE reminders ADD COLUMN google_calendar_event_id TEXT;`);
      } catch {}
      try {
        this.db.exec(`ALTER TABLE reminders ADD COLUMN calendar_sync_status TEXT DEFAULT 'NOT_CONNECTED';`);
      } catch {}
      try {
        this.db.exec(`ALTER TABLE reminders ADD COLUMN updated_at TEXT;`);
      } catch {}
      try {
        this.db.exec(`ALTER TABLE documents ADD COLUMN analysis_source TEXT DEFAULT 'GEMINI_AI';`);
      } catch {}
      try {
        this.db.exec(`ALTER TABLE documents ADD COLUMN is_demo_mode INTEGER DEFAULT 0;`);
      } catch {}
      try {
        this.db.exec(`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));`);
      } catch {}
      try {
        this.db.exec(`CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), expires_at TEXT NOT NULL);`);
      } catch {}
      this.seedDefaultCategories();
    }
  }

  private seedDefaultCategories() {
    const categories = [
      { id: 'cat_identity', name: 'Identity', icon: 'UserCheck', color: '#ec4899', description: 'Passport, Aadhaar, PAN, voter ID, driving license' },
      { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#6366f1', description: 'Certificates, degrees, scholarships, fee receipts' },
      { id: 'cat_medical', name: 'Healthcare', icon: 'Activity', color: '#ef4444', description: 'Prescriptions, lab reports, health records' },
      { id: 'cat_insurance', name: 'Insurance', icon: 'Shield', color: '#3b82f6', description: 'Health, motor, life and term insurance policies' },
      { id: 'cat_vehicle', name: 'Vehicle', icon: 'Car', color: '#10b981', description: 'RC, vehicle insurance, PUC, service records' },
      { id: 'cat_property', name: 'Property & Rental', icon: 'Home', color: '#06b6d4', description: 'Rental agreements, property tax receipts, deeds' },
      { id: 'cat_employment', name: 'Employment', icon: 'Briefcase', color: '#0ea5e9', description: 'Offer letters, payslips, experience certificates, Form 16' },
      { id: 'cat_finance', name: 'Finance', icon: 'DollarSign', color: '#14b8a6', description: 'Taxes, investments, bank statements, loans' },
      { id: 'cat_utilities', name: 'Utilities', icon: 'Zap', color: '#eab308', description: 'Electricity, water, gas, broadband connections' },
      { id: 'cat_bills', name: 'Bills & Receipts', icon: 'Receipt', color: '#f59e0b', description: 'Household receipts, maintenance, purchase invoices' },
      { id: 'cat_government', name: 'Government & Civic', icon: 'Landmark', color: '#f97316', description: 'Municipal records, ration cards, voter slips' },
      { id: 'cat_certificates', name: 'Certificates', icon: 'FileCheck', color: '#a855f7', description: 'Birth, marriage, community, domicile records' },
      { id: 'cat_warranty', name: 'Warranties', icon: 'Award', color: '#8b5cf6', description: 'Electronics, appliances, equipment guarantees' },
      { id: 'cat_subscription', name: 'Subscriptions', icon: 'RefreshCw', color: '#d946ef', description: 'Digital memberships, periodic subscriptions' },
      { id: 'cat_other', name: 'Other', icon: 'Folder', color: '#64748b', description: 'Miscellaneous personal records' },
    ];

    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO categories (id, name, icon, color, description) VALUES (?, ?, ?, ?, ?)'
    );
    for (const cat of categories) {
      insert.run(cat.id, cat.name, cat.icon, cat.color, cat.description);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    // Translate Postgres $1, $2 params to ? for SQLite
    let sqliteSql = sql.replace(/\$(\d+)/g, '?');

    // Simple heuristic: SELECT vs mutations
    const trimmed = sqliteSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = this.db.prepare(sqliteSql);
      const rows = stmt.all(...params) as T[];
      return { rows, rowCount: rows.length };
    } else {
      const stmt = this.db.prepare(sqliteSql);
      const info = stmt.run(...params);
      return { rows: [] as T[], rowCount: info.changes };
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// 2. PostgreSQL Client Implementation
class PostgresDatabaseClient implements IDatabaseClient {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const res = await this.pool.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount || 0 };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let dbInstance: IDatabaseClient | null = null;

export async function getDatabase(): Promise<IDatabaseClient> {
  if (dbInstance) return dbInstance;

  if (config.useSqliteFallback) {
    const sqlitePath = path.resolve(__dirname, '../../../database/lifeadmin.db');
    dbInstance = new SQLiteDatabaseClient(sqlitePath);
    console.log(`[Database] Connected to SQLite database at: ${sqlitePath}`);
    return dbInstance;
  }

  try {
    const pg = new PostgresDatabaseClient(config.databaseUrl);
    await pg.query('SELECT 1');
    console.log('[Database] Connected to PostgreSQL successfully.');
    dbInstance = pg;
    return dbInstance;
  } catch (err) {
    console.warn('[Database] PostgreSQL connection failed. Falling back to local SQLite.', err);
    const sqlitePath = path.resolve(__dirname, '../../../database/lifeadmin.db');
    dbInstance = new SQLiteDatabaseClient(sqlitePath);
    return dbInstance;
  }
}
