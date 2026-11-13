import crypto from 'node:crypto';
import fs from 'node:fs/promises';

export async function sha256File(filepath) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of await fs.open(filepath, 'r').then((handle) => handle.createReadStream())) hash.update(chunk);
  return hash.digest('hex');
}

export async function verifyBackupMarker(filepath) {
  const markerPath = `${filepath}.timeline-backup.json`;
  let marker;
  try { marker = JSON.parse(await fs.readFile(markerPath, 'utf8')); }
  catch { throw new Error('SQLite source must be a backup created by the Timeline backup utility; confirmation text alone is not sufficient.'); }
  if (marker.format !== 'grid-timeline-sqlite-backup-v1' || !/^[a-f0-9]{64}$/.test(marker.sha256 || '') || await sha256File(filepath) !== marker.sha256) {
    throw new Error('SQLite backup verification marker is missing, invalid, or no longer matches the backup.');
  }
  return { revision: marker.revision, createdAt: marker.createdAt };
}
