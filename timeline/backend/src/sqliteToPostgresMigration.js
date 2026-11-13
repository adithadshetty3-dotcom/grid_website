import { createHash } from 'node:crypto';

const TABLES = [
  { name: 'timeline_admins', key: 'id', columns: ['id', 'username', 'password_hash', 'is_active', 'session_version', 'created_at'], bool: ['is_active'], timestamps: ['created_at'] },
  { name: 'timeline_admin_sessions', key: 'id', columns: ['id', 'token_hash', 'csrf_token', 'admin_id', 'session_version', 'expires_at', 'created_at'], timestamps: ['expires_at', 'created_at'] },
  { name: 'timeline_milestones', key: 'id', columns: ['id', 'title', 'category', 'date', 'time', 'location', 'summary', 'description', 'source_id', 'images', 'is_demo', 'is_published', 'sort_order', 'created_at', 'updated_at'], json: ['images'], bool: ['is_demo', 'is_published'], timestamps: ['created_at', 'updated_at'] },
  { name: 'timeline_images', key: 'id', columns: ['id', 'storage_key', 'original_name', 'mime_type', 'size_bytes', 'width', 'height', 'sha256', 'uploaded_by', 'created_at'], timestamps: ['created_at'] },
  { name: 'timeline_site_settings', key: 'id', columns: ['id', 'starfield_enabled', 'updated_at'], bool: ['starfield_enabled'], timestamps: ['updated_at'] },
];

function canonicalValue(value, table, column) {
  if (value === null || value === undefined) return null;
  if (table.bool?.includes(column)) return Boolean(value);
  if (table.json?.includes(column)) return typeof value === 'string' ? JSON.parse(value) : value;
  if (table.timestamps?.includes(column)) {
    const text = value instanceof Date ? value.toISOString() : String(value);
    const date = new Date(text.includes('T') || /Z$|[+-]\d\d:\d\d$/.test(text) ? text : `${text.replace(' ', 'T')}Z`);
    return Number.isFinite(date.valueOf()) ? date.toISOString() : text;
  }
  return value;
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  return value;
}

function digestRows(rows, table) {
  const normalized = rows.map((row) => Object.fromEntries(table.columns.map((column) => [column, stableJson(canonicalValue(row[column], table, column))])));
  const ordered = normalized.sort((left, right) => String(left[table.key]).localeCompare(String(right[table.key])));
  return createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}

async function rows(db, table) {
  return db.prepare(`SELECT ${table.columns.join(',')} FROM ${table.name} ORDER BY ${table.key}`).all();
}

export async function migrateSqliteToPostgres({ source, target }) {
  if (source.kind !== 'sqlite' || target.kind !== 'postgres') throw new Error('Migration requires a read-only SQLite source and PostgreSQL destination.');
  await source.assertSchema();
  await target.assertSchema();
  const sourceRows = new Map();
  for (const table of TABLES) sourceRows.set(table.name, await rows(source, table));
  const sourceDigests = new Map(TABLES.map((table) => [table.name, digestRows(sourceRows.get(table.name), table)]));
  const targetRows = new Map();
  for (const table of TABLES) targetRows.set(table.name, await rows(target, table));

  const destinationEmpty = [...targetRows.values()].every((items) => items.length === 0);
  if (!destinationEmpty) {
    const alreadyMatches = TABLES.every((table) => digestRows(targetRows.get(table.name), table) === sourceDigests.get(table.name));
    if (alreadyMatches) return { status: 'already-migrated', counts: Object.fromEntries(TABLES.map((table) => [table.name, sourceRows.get(table.name).length])) };
    throw new Error('PostgreSQL destination is not empty and does not match this SQLite source; refusing to merge or overwrite records.');
  }

  await target.transaction(async (tx) => {
    for (const table of TABLES) {
      const columns = table.columns.join(',');
      const marks = table.columns.map(() => '?').join(',');
      for (const row of sourceRows.get(table.name)) {
        const values = table.columns.map((column) => {
          const value = canonicalValue(row[column], table, column);
          return table.json?.includes(column) ? JSON.stringify(value) : value;
        });
        await tx.prepare(`INSERT INTO ${table.name} (${columns}) VALUES (${marks})`).run(...values);
      }
    }
    for (const name of ['timeline_admins', 'timeline_admin_sessions']) {
      await tx.prepare(`SELECT setval(pg_get_serial_sequence('${name}', 'id'), COALESCE((SELECT MAX(id) FROM ${name}), 0) + 1, false)`).get();
    }
    for (const table of TABLES) {
      const copied = await rows(tx, table);
      if (digestRows(copied, table) !== sourceDigests.get(table.name)) throw new Error(`PostgreSQL migration verification failed for ${table.name}.`);
    }
  });
  return { status: 'migrated', counts: Object.fromEntries(TABLES.map((table) => [table.name, sourceRows.get(table.name).length])) };
}

export { TABLES, digestRows };
