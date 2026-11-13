import fs from 'node:fs';
import path from 'node:path';
import { backup } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { openSqliteDatabase } from '../src/db.js';
import { sha256File } from '../src/sqliteBackup.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceUrl = process.env.TIMELINE_BACKUP_SOURCE_SQLITE_URL;
const outputPath = process.env.TIMELINE_BACKUP_OUTPUT;
if (!sourceUrl?.startsWith('sqlite:///')) throw new Error('Set TIMELINE_BACKUP_SOURCE_SQLITE_URL to the SQLite database path.');
if (!outputPath) throw new Error('Set TIMELINE_BACKUP_OUTPUT to a new path outside the Timeline package.');
const sourcePath = path.resolve(sourceUrl.slice('sqlite://'.length));
const backupPath = path.resolve(outputPath);
if (sourcePath === backupPath) throw new Error('Backup destination must differ from source.');
if (backupPath === packageRoot || backupPath.startsWith(`${packageRoot}${path.sep}`)) throw new Error('Store protected backups outside the Timeline package.');
if (!fs.existsSync(sourcePath)) throw new Error('Source database does not exist.');
if (fs.existsSync(backupPath) || fs.existsSync(`${backupPath}.timeline-backup.json`)) throw new Error('Refusing to overwrite an existing backup or marker.');
fs.mkdirSync(path.dirname(backupPath), { recursive: true, mode: 0o700 });
const source = openSqliteDatabase(sourcePath, { readonly: true });
try {
  await source.assertSchema();
  await backup(source.database, backupPath);
} finally { await source.close(); }
try {
  fs.chmodSync(backupPath, 0o600);
  const verify = openSqliteDatabase(backupPath, { readonly: true });
  let revision;
  try { await verify.assertSchema(); revision = (await verify.prepare('SELECT version_num FROM alembic_version').get()).version_num; }
  finally { await verify.close(); }
  const marker = { format: 'grid-timeline-sqlite-backup-v1', revision, createdAt: new Date().toISOString(), sha256: await sha256File(backupPath) };
  fs.writeFileSync(`${backupPath}.timeline-backup.json`, `${JSON.stringify(marker, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  process.stdout.write(`Protected SQLite backup created and verified (revision ${revision}). The original database was read-only.\n`);
} catch (error) {
  // Leave any partial backup for manual inspection; never delete a database automatically.
  throw error;
}
