import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createImageStorage } from '../src/imageStorage.js';

test('private Blob adapter always reads/writes with private access and never emits public URLs', async () => {
  const calls = [];
  const client = {
    async put(key, bytes, options) { calls.push(['put', key, Buffer.from(bytes), options]); },
    async get(key, options) { calls.push(['get', key, options]); return { stream: Readable.from([Buffer.from('private bytes')]) }; },
    async issueSignedToken(options) { calls.push(['sign', options]); return { delegationToken: 'opaque' }; },
    async presignUrl(token, options) { calls.push(['url', token, options]); return { presignedUrl: 'https://private.invalid/signed' }; },
  };
  const storage = createImageStorage({ imageStorage: 'vercel-blob' }, client);
  await storage.put('0123456789abcdef0123456789abcdef.img', Buffer.from('private bytes'), 'image/png');
  assert.deepEqual(await storage.read('0123456789abcdef0123456789abcdef.img'), Buffer.from('private bytes'));
  assert.deepEqual(calls[0][3], { access: 'private', addRandomSuffix: false, contentType: 'image/png' });
  assert.deepEqual(calls[1][2], { access: 'private', useCache: false });
  const url = await storage.createReadUrl('0123456789abcdef0123456789abcdef.img');
  assert.equal(url, 'https://private.invalid/signed');
  assert.deepEqual(calls[2][1].operations, ['get']);
  assert.equal(calls[2][1].pathname, '0123456789abcdef0123456789abcdef.img');
  assert.equal(calls[2][1].validUntil - Date.now() <= 5 * 60 * 1000, true);
});
