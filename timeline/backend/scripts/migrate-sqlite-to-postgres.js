import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPostgresDatabase, openSqliteDatabase } from '../src/db.js';
import { verifyBackupMarker } from '../src/sqliteBackup.js';
import { migrateSqliteToPostgres } from '../src/sqliteToPostgresMigration.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceUrl = process.env.TIMELINE_MIGRATION_SOURCE_SQLITE_URL;
const destinationUrl = process.env.TIMELINE_MIGRATION_DESTINATION_DATABASE_URL || process.env.TIMELINE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (process.env.TIMELINE_MIGRATION_SOURCE_IS_BACKUP !== 'YES') {
  throw new Error('Refusing migration: set TIMELINE_MIGRATION_SOURCE_IS_BACKUP=YES after creating a protected backup with npm run db:backup.');
}
if (!sourceUrl?.startsWith('sqlite:///')) throw new Error('Set TIMELINE_MIGRATION_SOURCE_SQLITE_URL to an explicit SQLite backup path.');
if (!/^postgres(?:ql)?:\/\//i.test(destinationUrl || '')) throw new Error('Set TIMELINE_DATABASE_URL to a provisioned PostgreSQL destination.');
const sourcePath = path.resolve(sourceUrl.slice('sqlite://'.length));
if (sourcePath === packageRoot || sourcePath.startsWith(`${packageRoot}${path.sep}`)) throw new Error('Migration source must be outside the Timeline package.');
if (!fs.existsSync(sourcePath)) throw new Error('The explicitly selected SQLite backup does not exist.');
await verifyBackupMarker(sourcePath);

const source = openSqliteDatabase(sourcePath, { readonly: true });
const target = openPostgresDatabase(destinationUrl, { max: 2 });
try {
  const result = await migrateSqliteToPostgres({ source, target });
  process.stdout.write(`SQLite-to-PostgreSQL migration ${result.status}; verified rows: ${JSON.stringify(result.counts)}\n`);
} finally {
  await Promise.all([source.close(), target.close()]);
}
