import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';

const { Pool, types } = pg;
// Preserve PostgreSQL's timezone-free database timestamps as strings. Flask's
// SQLite schema stores the same UTC values as text; this keeps serialization stable.
types.setTypeParser(1114, (value) => value);

const REQUIRED_COLUMNS = {
  alembic_version: ['version_num'],
  timeline_admins: ['id', 'username', 'password_hash', 'is_active', 'session_version', 'created_at'],
  timeline_admin_sessions: ['id', 'token_hash', 'csrf_token', 'admin_id', 'session_version', 'expires_at', 'created_at'],
  timeline_milestones: ['id', 'title', 'category', 'date', 'time', 'location', 'summary', 'description', 'source_id', 'images', 'is_demo', 'is_published', 'sort_order', 'created_at', 'updated_at'],
  timeline_images: ['id', 'storage_key', 'original_name', 'mime_type', 'size_bytes', 'width', 'height', 'sha256', 'uploaded_by', 'created_at'],
  timeline_site_settings: ['id', 'starfield_enabled', 'updated_at'],
};

function normalizeError(error) {
  if (error.code === '23505') error.code = 'SQLITE_CONSTRAINT_UNIQUE';
  else if (error.code === '23503') error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
  else if (error.code === '23514' || error.code === '23502') error.code = 'SQLITE_CONSTRAINT_CHECK';
  return error;
}

function placeholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

const sqliteValues = (values) => values.map((value) => typeof value === 'boolean' ? Number(value) : value);

export class SqliteDatabase {
  kind = 'sqlite';
  constructor(database, { ownsDatabase = true } = {}) { this.database = database; this.ownsDatabase = ownsDatabase; }
  prepare(sql) {
    const statement = this.database.prepare(sql);
    return {
      get: async (...params) => statement.get(...sqliteValues(params)),
      all: async (...params) => statement.all(...sqliteValues(params)),
      run: async (...params) => statement.run(...sqliteValues(params)),
    };
  }
  async exec(sql) { this.database.exec(sql); }
  async transaction(work) {
    this.database.exec('BEGIN IMMEDIATE');
    try { const result = await work(this); this.database.exec('COMMIT'); return result; }
    catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }
  async close() { if (this.ownsDatabase) this.database.close(); }
  async assertSchema() {
    for (const [table, expected] of Object.entries(REQUIRED_COLUMNS)) {
      const exists = this.database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!exists) throw new Error(`Timeline database schema is incomplete (missing ${table}).`);
      const actual = new Set(this.database.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
      if (expected.some((column) => !actual.has(column))) throw new Error(`Timeline database schema is incompatible (missing columns from ${table}).`);
    }
    const revision = this.database.prepare('SELECT version_num FROM alembic_version').get()?.version_num;
    if (revision !== '0005_timeline_starfield_setting') throw new Error('Timeline database must be at Alembic revision 0005_timeline_starfield_setting before Express can start.');
  }
}

export class PostgresDatabase {
  kind = 'postgres';
  constructor(pool) { this.pool = pool; }
  prepare(sql) {
    const text = placeholders(sql);
    const query = async (...params) => {
      try { return await this.pool.query(text, params); }
      catch (error) { throw normalizeError(error); }
    };
    return {
      get: async (...params) => (await query(...params)).rows[0],
      all: async (...params) => (await query(...params)).rows,
      run: async (...params) => {
        const result = await query(...params);
        return { changes: result.rowCount, lastInsertRowid: undefined };
      },
    };
  }
  async exec(sql) { await this.pool.query(sql); }
  async transaction(work) {
    const client = await this.pool.connect();
    const transactionDb = {
      prepare: (sql) => {
        const text = placeholders(sql);
        const query = async (...params) => {
          try { return await client.query(text, params); }
          catch (error) { throw normalizeError(error); }
        };
        return {
          get: async (...params) => (await query(...params)).rows[0],
          all: async (...params) => (await query(...params)).rows,
          run: async (...params) => ({ changes: (await query(...params)).rowCount }),
        };
      },
    };
    try {
      await client.query('BEGIN');
      const result = await work(transactionDb);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw normalizeError(error);
    } finally { client.release(); }
  }
  async close() { await this.pool.end(); }
  async assertSchema() {
    for (const [table, expected] of Object.entries(REQUIRED_COLUMNS)) {
      const result = await this.pool.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', [table]);
      const actual = new Set(result.rows.map((column) => column.column_name));
      if (expected.some((column) => !actual.has(column))) throw new Error(`Timeline PostgreSQL schema is incomplete or incompatible (${table}).`);
    }
    const result = await this.pool.query('SELECT version_num FROM alembic_version');
    if (result.rows[0]?.version_num !== '0005_timeline_starfield_setting') throw new Error('Timeline PostgreSQL schema must be provisioned at version 0005_timeline_starfield_setting.');
  }
}

export function openSqliteDatabase(databasePath, { readonly = false } = {}) {
  const existed = fs.existsSync(databasePath);
  if (!readonly) fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath, { readOnly: readonly, enableForeignKeyConstraints: true });
  database.exec('PRAGMA foreign_keys = ON');
  if (!readonly) database.exec('PRAGMA busy_timeout = 5000');
  if (!readonly && !existed && process.platform !== 'win32') fs.chmodSync(databasePath, 0o600);
  return new SqliteDatabase(database);
}

export function openMemoryDatabase() {
  const database = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  database.exec('PRAGMA foreign_keys = ON');
  return new SqliteDatabase(database);
}

export function openPostgresDatabase(connectionString, { max = 5, ssl } = {}) {
  const pool = new Pool({ connectionString, max, ssl, connectionTimeoutMillis: 8000, idleTimeoutMillis: 10_000, allowExitOnIdle: true });
  if (process.env.VERCEL) attachDatabasePool(pool);
  return new PostgresDatabase(pool);
}

// Kept as a test helper for callers that need to inspect a raw disposable DB.
export function assertCompatibleSchema(db) {
  if (db instanceof SqliteDatabase) return db.assertSchema();
  const adapter = new SqliteDatabase(db, { ownsDatabase: false });
  return adapter.assertSchema();
}
