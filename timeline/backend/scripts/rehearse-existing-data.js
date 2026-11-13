import { backup } from 'node:sqlite';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pgMem from 'pg-mem';
import { openSqliteDatabase, PostgresDatabase } from '../src/db.js';
import { migrateSqliteToPostgres } from '../src/sqliteToPostgresMigration.js';
import { migrateImages } from '../src/imageMigration.js';
import { sha256File, verifyBackupMarker } from '../src/sqliteBackup.js';

if (process.env.TIMELINE_REHEARSE_EXISTING_DATA !== 'YES') throw new Error('Set TIMELINE_REHEARSE_EXISTING_DATA=YES only to rehearse a read-only copy of local data.');
const sourcePath = path.resolve(process.env.TIMELINE_REHEARSE_SOURCE_SQLITE || '');
const sourceImageDir = path.resolve(process.env.TIMELINE_REHEARSE_SOURCE_IMAGES || '');
if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) throw new Error('Explicit source SQLite database is missing.');
if (!fs.existsSync(sourceImageDir) || !fs.statSync(sourceImageDir).isDirectory()) throw new Error('Explicit source image directory is missing.');
const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'grid-timeline-private-migration-rehearsal-'));
await fsp.chmod(workDir, 0o700);
const backupPath = path.join(workDir, 'source-backup.sqlite3');
const imageBackup = path.join(workDir, 'images');
const source = openSqliteDatabase(sourcePath, { readonly: true });
let backupDb;
let target;
try {
  await source.assertSchema();
  await backup(source.database, backupPath);
  await fsp.chmod(backupPath, 0o600);
  const revision = (await source.prepare('SELECT version_num FROM alembic_version').get()).version_num;
  const marker = { format: 'grid-timeline-sqlite-backup-v1', revision, createdAt: new Date().toISOString(), sha256: await sha256File(backupPath) };
  await fsp.writeFile(`${backupPath}.timeline-backup.json`, JSON.stringify(marker), { mode: 0o600, flag: 'wx' });
  await verifyBackupMarker(backupPath);
  await fsp.cp(sourceImageDir, imageBackup, { recursive: true, errorOnExist: true, force: false, dereference: false });
  await fsp.chmod(imageBackup, 0o700);
  for (const entry of await fsp.readdir(imageBackup, { withFileTypes: true })) {
    if (!entry.isFile()) throw new Error('The source image backup must contain only ordinary files.');
    await fsp.chmod(path.join(imageBackup, entry.name), 0o600);
  }
  backupDb = openSqliteDatabase(backupPath, { readonly: true });
  await backupDb.assertSchema();

  const memory = pgMem.newDb({ autoCreateForeignKeyIndices: true });
  memory.public.registerFunction({ name: 'pg_get_serial_sequence', args: [pgMem.DataType.text, pgMem.DataType.text], returns: pgMem.DataType.text, implementation: () => 'fixture_sequence' });
  memory.public.registerFunction({ name: 'setval', args: [pgMem.DataType.text, pgMem.DataType.integer, pgMem.DataType.bool], returns: pgMem.DataType.integer, implementation: (_sequence, value) => value });
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  target = new PostgresDatabase(pool);
  await pool.query(await fsp.readFile(new URL('../../migrations/postgresql/0005_timeline_schema.sql', import.meta.url), 'utf8'));
  const dataResult = await migrateSqliteToPostgres({ source: backupDb, target });
  const admins = await backupDb.prepare('SELECT password_hash, is_active FROM timeline_admins').all();
  const adminHashFormatCompatible = admins.length === 1 && Boolean(admins[0].is_active)
    && /^scrypt:(\d+):(\d+):(\d+)\$[^$]+\$([a-f0-9]{32,256})$/i.test(admins[0].password_hash)
    && Buffer.from(admins[0].password_hash.split('$').at(-1), 'hex').length >= 16;
  if (!adminHashFormatCompatible) throw new Error('The existing active administrator password hash format is not compatible with the Express verifier.');
  const bytes = new Map();
  const storage = {
    async read(key) { return bytes.get(key) || null; },
    async put(key, value) { if (bytes.has(key)) throw new Error('Refusing overwrite during rehearsal.'); bytes.set(key, Buffer.from(value)); },
  };
  const imageResult = await migrateImages({ sourceDb: backupDb, destinationDb: target, sourceImageDir: imageBackup, storage });
  if (imageResult.verified !== imageResult.total || bytes.size !== imageResult.total) throw new Error('Private image rehearsal did not verify every image.');
  process.stdout.write(`${JSON.stringify({ databaseStatus: dataResult.status, tableCounts: dataResult.counts, activeAdminHashFormatCompatible: adminHashFormatCompatible, images: imageResult })}\n`);
} finally {
  await Promise.allSettled([source.close(), backupDb?.close(), target?.close()]);
  await fsp.rm(workDir, { recursive: true, force: true });
}
