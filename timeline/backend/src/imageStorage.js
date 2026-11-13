import fs from 'node:fs/promises';
import path from 'node:path';
import { get, issueSignedToken, presignUrl, put } from '@vercel/blob';

/** Private image bytes live behind a storage adapter, never in route code. */
export function createImageStorage(config, blobClient = { get, put, issueSignedToken, presignUrl }) {
  if (config.imageStorage === 'vercel-blob') {
    return {
      kind: 'vercel-blob',
      async put(key, bytes, mime) {
        await blobClient.put(key, bytes, { access: 'private', addRandomSuffix: false, contentType: mime });
      },
      async read(key) {
        const result = await blobClient.get(key, { access: 'private', useCache: false });
        if (!result) return null;
        const chunks = [];
        for await (const chunk of result.stream) chunks.push(Buffer.from(chunk));
        return Buffer.concat(chunks);
      },
      async createReadUrl(key) {
        const validUntil = Date.now() + 5 * 60 * 1000;
        const token = await blobClient.issueSignedToken({ pathname: key, operations: ['get'], validUntil });
        return (await blobClient.presignUrl(token, {
        operation: 'get',
        pathname: key,
        validUntil,
        access: 'private',
      })).presignedUrl;
      },
      async remove(key) {
        // Intentionally no implicit delete. Private bytes can be referenced by old backups.
        return key;
      },
    };
  }

  return {
    kind: 'filesystem',
    async put(key, bytes) {
      await fs.mkdir(config.uploadDir, { recursive: true, mode: 0o700 });
      try { await fs.chmod(config.uploadDir, 0o700); } catch {}
      await fs.writeFile(path.join(config.uploadDir, key), bytes, { flag: 'wx', mode: 0o600 });
    },
    async read(key) {
      try { return await fs.readFile(path.join(config.uploadDir, key)); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async createReadUrl() { return null; },
    async remove(key) {
      await fs.unlink(path.join(config.uploadDir, key)).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    },
  };
}
