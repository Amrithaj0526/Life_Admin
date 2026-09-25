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
      this.seedDefaultCategories();
    }
  }

  private seedDefaultCategories() {
    const categories = [
      { id: 'cat_insurance', name: 'Insurance', icon: 'Shield', color: '#3b82f6', description: 'Health, motor, life and property insurance' },
      { id: 'cat_vehicle', name: 'Vehicle', icon: 'Car', color: '#10b981', description: 'Registration, service, pollution & license' },
      { id: 'cat_bills', name: 'Bills', icon: 'Receipt', color: '#f59e0b', description: 'Electricity, water, internet & utilities' },
      { id: 'cat_warranty', name: 'Warranty', icon: 'Award', color: '#8b5cf6', description: 'Electronics, appliances & equipment' },
      { id: 'cat_identity', name: 'Identity', icon: 'UserCheck', color: '#ec4899', description: 'Passport, national ID, licenses' },
      { id: 'cat_medical', name: 'Medical', icon: 'Activity', color: '#ef4444', description: 'Prescriptions, lab reports, doctor records' },
      { id: 'cat_property', name: 'Property', icon: 'Home', color: '#06b6d4', description: 'Rental agreements, tax receipts, deeds' },
      { id: 'cat_finance', name: 'Finance', icon: 'DollarSign', color: '#14b8a6', description: 'Taxes, investments, bank statements' },
      { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#6366f1', description: 'Degrees, diplomas, certifications' },
      { id: 'cat_subscription', name: 'Subscription', icon: 'RefreshCw', color: '#d946ef', description: 'Digital memberships and subscriptions' },
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
