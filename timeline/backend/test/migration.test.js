import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newDb, DataType } from 'pg-mem';
import { test } from 'node:test';
import { openSqliteDatabase, PostgresDatabase } from '../src/db.js';
import { migrateSqliteToPostgres } from '../src/sqliteToPostgresMigration.js';
import { migrateImages } from '../src/imageMigration.js';
import crypto from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));

test('SQLite-to-PostgreSQL migration copies all Timeline tables, verifies records, and safely recognizes retries', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'grid-timeline-migration-'));
  const sourcePath = path.join(directory, 'source.sqlite3');
  const raw = new DatabaseSync(sourcePath, { enableForeignKeyConstraints: true });
  raw.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL);
    INSERT INTO alembic_version VALUES ('0005_timeline_starfield_setting');
    CREATE TABLE timeline_admins (id INTEGER PRIMARY KEY, username VARCHAR(80) NOT NULL UNIQUE, password_hash VARCHAR(256) NOT NULL, is_active BOOLEAN NOT NULL DEFAULT 1, session_version INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL);
    CREATE TABLE timeline_admin_sessions (id INTEGER PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE, csrf_token VARCHAR(64) NOT NULL, admin_id INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE CASCADE, session_version INTEGER NOT NULL DEFAULT 0, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL);
    CREATE TABLE timeline_milestones (id VARCHAR(36) PRIMARY KEY, title VARCHAR(90) NOT NULL, category VARCHAR(24) NOT NULL, date VARCHAR(10) NOT NULL, time VARCHAR(5) NOT NULL DEFAULT '', location VARCHAR(100) NOT NULL DEFAULT '', summary VARCHAR(180) NOT NULL, description VARCHAR(6000) NOT NULL, source_id VARCHAR(255) UNIQUE, images JSON NOT NULL, is_demo BOOLEAN NOT NULL DEFAULT 0, is_published BOOLEAN NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL);
    CREATE TABLE timeline_images (id VARCHAR(36) PRIMARY KEY, storage_key VARCHAR(40) NOT NULL UNIQUE, original_name VARCHAR(255) NOT NULL, mime_type VARCHAR(32) NOT NULL, size_bytes INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, sha256 VARCHAR(64) NOT NULL, uploaded_by INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE RESTRICT, created_at DATETIME NOT NULL);
    CREATE TABLE timeline_site_settings (id VARCHAR(24) PRIMARY KEY, starfield_enabled BOOLEAN NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL);
    INSERT INTO timeline_admins VALUES (7,'migration-test','scrypt:fixture-only',1,3,'2026-01-01 00:00:00.000000');
    INSERT INTO timeline_admin_sessions VALUES (11,'digest-fixture','csrf-fixture',7,3,'2026-01-01 12:00:00.000000','2026-01-01 00:00:00.000000');
    INSERT INTO timeline_milestones VALUES ('00000000-0000-4000-8000-000000000007','Private migration fixture','Community','2026-01-02','','','summary','description',NULL,'[{"url":"/api/timeline/images/00000000-0000-4000-8000-000000000008","name":"one.png","type":"image/png"}]',0,0,4,'2026-01-01 00:00:00.000000','2026-01-01 00:00:00.000000');
    INSERT INTO timeline_images VALUES ('00000000-0000-4000-8000-000000000008','0123456789abcdef0123456789abcdef.img','one.png','image/png',12,2,3,'abcdef',7,'2026-01-01 00:00:00.000000');
    INSERT INTO timeline_site_settings VALUES ('global',1,'2026-01-01 00:00:00.000000');
  `);
  raw.close();

  const memory = newDb({ autoCreateForeignKeyIndices: true });
  memory.public.registerFunction({ name: 'pg_get_serial_sequence', args: [DataType.text, DataType.text], returns: DataType.text, implementation: () => 'fixture_sequence' });
  memory.public.registerFunction({ name: 'setval', args: [DataType.text, DataType.integer, DataType.bool], returns: DataType.integer, implementation: (_sequence, value) => value });
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  const source = openSqliteDatabase(sourcePath, { readonly: true });
  const target = new PostgresDatabase(pool);
  try {
    const schema = await fs.readFile(path.join(HERE, '../../migrations/postgresql/0005_timeline_schema.sql'), 'utf8');
    await pool.query(schema);
    const result = await migrateSqliteToPostgres({ source, target });
    assert.equal(result.status, 'migrated');
    assert.deepEqual(result.counts, { timeline_admins: 1, timeline_admin_sessions: 1, timeline_milestones: 1, timeline_images: 1, timeline_site_settings: 1 });
    assert.equal((await target.prepare('SELECT username FROM timeline_admins WHERE id=?').get(7)).username, 'migration-test');
    assert.equal((await target.prepare('SELECT is_active FROM timeline_admins WHERE id=?').get(7)).is_active, true);
    assert.equal((await target.prepare('SELECT starfield_enabled FROM timeline_site_settings WHERE id=?').get('global')).starfield_enabled, true);
    assert.equal((await migrateSqliteToPostgres({ source, target })).status, 'already-migrated');
    await target.prepare("UPDATE timeline_admins SET username='changed' WHERE id=7").run();
    await assert.rejects(migrateSqliteToPostgres({ source, target }), /does not match this SQLite source/);
  } finally {
    await source.close();
    await target.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('private image migration verifies source and destination bytes and supports safe retries', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'grid-timeline-image-migration-'));
  const sourcePath = path.join(directory, 'source.sqlite3');
  const imageDir = path.join(directory, 'images');
  const key = '0123456789abcdef0123456789abcdef.img';
  const bytes = Buffer.from('synthetic PNG fixture bytes');
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  await fs.mkdir(imageDir);
  await fs.writeFile(path.join(imageDir, key), bytes);
  const raw = new DatabaseSync(sourcePath);
  raw.exec('CREATE TABLE timeline_images (id TEXT, storage_key TEXT, mime_type TEXT, size_bytes INTEGER, sha256 TEXT)');
  raw.prepare('INSERT INTO timeline_images VALUES (?, ?, ?, ?, ?)').run('synthetic-id', key, 'image/png', bytes.length, sha);
  raw.close();
  const source = openSqliteDatabase(sourcePath, { readonly: true });
  const destination = { kind: 'postgres', prepare: () => ({ get: async () => ({ storage_key: key, mime_type: 'image/png', size_bytes: bytes.length, sha256: sha }) }) };
  const blobs = new Map();
  const storage = {
    async read(blobKey) { return blobs.get(blobKey) || null; },
    async put(blobKey, value) { if (blobs.has(blobKey)) throw new Error('overwrite refused'); blobs.set(blobKey, Buffer.from(value)); },
  };
  try {
    assert.deepEqual(await migrateImages({ sourceDb: source, destinationDb: destination, sourceImageDir: imageDir, storage }), { total: 1, copied: 1, alreadyPresent: 0, verified: 1 });
    assert.deepEqual(await migrateImages({ sourceDb: source, destinationDb: destination, sourceImageDir: imageDir, storage }), { total: 1, copied: 0, alreadyPresent: 1, verified: 1 });
    blobs.set(key, Buffer.from('wrong bytes'));
    await assert.rejects(migrateImages({ sourceDb: source, destinationDb: destination, sourceImageDir: imageDir, storage }), /different bytes.*refusing overwrite/);
    blobs.delete(key);
    await fs.writeFile(path.join(imageDir, key), Buffer.from('changed fixture'));
    await assert.rejects(migrateImages({ sourceDb: source, destinationDb: destination, sourceImageDir: imageDir, storage }), /failed size\/hash verification/);
  } finally {
    await source.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
