import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { openSqliteDatabase, openPostgresDatabase } from '../src/db.js';
import { createImageStorage } from '../src/imageStorage.js';
import { migrateImages } from '../src/imageMigration.js';
import { verifyBackupMarker } from '../src/sqliteBackup.js';

const sourcePath = process.env.TIMELINE_SQLITE_BACKUP;
const sourceImageDir = process.env.TIMELINE_IMAGE_BACKUP_DIR;
if (!sourcePath || !sourceImageDir || process.env.TIMELINE_SQLITE_BACKUP_CONFIRMED !== 'yes') {
  throw new Error('Set TIMELINE_SQLITE_BACKUP, TIMELINE_IMAGE_BACKUP_DIR, and TIMELINE_SQLITE_BACKUP_CONFIRMED=yes for an explicitly prepared backup.');
}
const config = loadConfig({ ...process.env, TIMELINE_IMAGE_STORAGE: 'vercel-blob' });
await verifyBackupMarker(path.resolve(sourcePath));
const source = openSqliteDatabase(path.resolve(sourcePath), { readonly: true });
const target = openPostgresDatabase(config.databaseUrl, { max: 2 });
try {
  await source.assertSchema();
  await target.assertSchema();
  const report = await migrateImages({ sourceDb: source, destinationDb: target, sourceImageDir: path.resolve(sourceImageDir), storage: createImageStorage(config) });
  console.log(JSON.stringify(report));
} finally {
  await source.close();
  await target.close();
}
