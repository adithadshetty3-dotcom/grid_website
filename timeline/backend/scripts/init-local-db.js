import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSqliteDatabase } from '../src/db.js';
import { loadConfig } from '../src/config.js';

const config = loadConfig();
if (config.databaseKind !== 'sqlite') throw new Error('Local database initialization requires a SQLite URL.');
if (fs.existsSync(config.databasePath)) throw new Error('Refusing to initialize an existing database. Choose a new path; no records were changed.');
fs.mkdirSync(path.dirname(config.databasePath), { recursive: true, mode: 0o700 });
const descriptor = fs.openSync(config.databasePath, 'wx', 0o600);
fs.closeSync(descriptor);
const database = openSqliteDatabase(config.databasePath);
try {
  const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations/sqlite/0005_timeline_schema.sql');
  database.database.exec(fs.readFileSync(schemaPath, 'utf8'));
  await database.assertSchema();
  process.stdout.write('Created a new empty Timeline SQLite database at schema revision 0005. No admin account was created.\n');
} finally { await database.close(); }
