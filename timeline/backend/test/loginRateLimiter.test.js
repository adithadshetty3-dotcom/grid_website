import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSharedLoginLimiter } from '../src/loginRateLimiter.js';

function harness(limiter) {
  return new Promise((resolve) => limiter({ ip: '203.0.113.4', body: { username: '  Admin  ' }, socket: {} }, {
    status(code) { this.code = code; return this; },
    json(body) { resolve({ code: this.code || 200, body }); },
  }, () => resolve({ code: 200 })));
}

test('shared login limiting hashes identity keys and enforces both windows', async () => {
  const keys = [];
  const limiters = [0, 1].map(() => ({ async limit(key) { keys.push(key); return { success: true }; } }));
  assert.deepEqual(await harness(createSharedLoginLimiter({ limiters })), { code: 200 });
  assert.equal(keys.length, 2);
  assert.ok(keys.every((key) => /^[a-f0-9]{64}$/.test(key)));
  assert.ok(keys.every((key) => !key.includes('admin') && !key.includes('203.0.113.4')));
  const blocked = await harness(createSharedLoginLimiter({ limiters: [{ async limit() { return { success: false }; } }, { async limit() { return { success: true }; } }] }));
  assert.equal(blocked.code, 429);
  assert.equal(blocked.body.error, 'rate_limited');
});

test('shared limiter failure fails closed without exposing provider details', async () => {
  const failure = new Error('secret provider details');
  const result = await harness(createSharedLoginLimiter({ limiters: [{ async limit() { throw failure; } }, { async limit() { return { success: true }; } }] }));
  assert.equal(result.code, 503);
  assert.equal(JSON.stringify(result).includes('secret provider details'), false);
});
