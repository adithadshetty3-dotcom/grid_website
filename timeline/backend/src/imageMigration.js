import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** Copies image bytes from an already-protected SQLite/image backup to private durable storage.
 * Source is read-only; the destination must already contain matching migrated metadata.
 * Existing destination keys are accepted only when both bytes and metadata hashes match.
 */
export async function migrateImages({ sourceDb, destinationDb, sourceImageDir, storage }) {
  if (sourceDb.kind !== 'sqlite' || destinationDb.kind !== 'postgres') throw new Error('Image migration requires a SQLite backup and PostgreSQL destination.');
  const rows = await sourceDb.prepare('SELECT id, storage_key, mime_type, size_bytes, sha256 FROM timeline_images ORDER BY id').all();
  const result = { total: rows.length, copied: 0, alreadyPresent: 0, verified: 0 };
  for (const row of rows) {
    if (!/^[a-f0-9]{32}\.img$/.test(row.storage_key)) throw new Error(`Invalid source image key for metadata record ${row.id}.`);
    const target = await destinationDb.prepare('SELECT storage_key, mime_type, size_bytes, sha256 FROM timeline_images WHERE id = ?').get(row.id);
    if (!target || target.storage_key !== row.storage_key || target.mime_type !== row.mime_type || Number(target.size_bytes) !== Number(row.size_bytes) || target.sha256 !== row.sha256) {
      throw new Error(`Destination image metadata does not match source record ${row.id}.`);
    }
    const sourcePath = path.join(sourceImageDir, row.storage_key);
    const sourceBytes = await fs.readFile(sourcePath);
    const sourceHash = digest(sourceBytes);
    if (sourceBytes.length !== Number(row.size_bytes) || sourceHash !== row.sha256) throw new Error(`Source image backup failed size/hash verification for record ${row.id}.`);

    const existing = await storage.read(row.storage_key);
    if (existing) {
      if (existing.length !== sourceBytes.length || digest(existing) !== sourceHash) throw new Error(`Destination storage contains different bytes at key for record ${row.id}; refusing overwrite.`);
      result.alreadyPresent++;
    } else {
      await storage.put(row.storage_key, sourceBytes, row.mime_type);
      const stored = await storage.read(row.storage_key);
      if (!stored || stored.length !== sourceBytes.length || digest(stored) !== sourceHash) throw new Error(`Uploaded image failed read-back verification for record ${row.id}.`);
      result.copied++;
    }
    result.verified++;
  }
  return result;
}
