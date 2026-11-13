import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { sha256File, verifyBackupMarker } from '../src/sqliteBackup.js';

test('SQLite backup marker binds a protected copy to its bytes and detects changes', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'grid-timeline-backup-test-'));
  const sourcePath = path.join(dir, 'source.sqlite3');
  const backupPath = path.join(dir, 'backup.sqlite3');
  const source = new DatabaseSync(sourcePath);
  source.exec('CREATE TABLE fixture (id TEXT PRIMARY KEY); INSERT INTO fixture VALUES (\'synthetic\')');
  await backup(source, backupPath);
  source.close();
  const sha256 = await sha256File(backupPath);
  await fs.writeFile(`${backupPath}.timeline-backup.json`, JSON.stringify({
    format: 'grid-timeline-sqlite-backup-v1', revision: 'synthetic', createdAt: new Date().toISOString(), sha256,
  }), { mode: 0o600 });
  try {
    assert.equal((await verifyBackupMarker(backupPath)).revision, 'synthetic');
    const handle = await fs.open(backupPath, 'a');
    await handle.write(randomBytes(1));
    await handle.close();
    await assert.rejects(verifyBackupMarker(backupPath), /no longer matches/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
