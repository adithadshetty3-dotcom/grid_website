import assert from 'node:assert/strict';
import os from 'node:os';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('config selects PostgreSQL URLs without coupling the route layer to the driver', () => {
  const config = loadConfig({ TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_DATABASE_URL: 'postgresql://user:pass@localhost:5432/grid', TIMELINE_ENV: 'development' });
  assert.equal(config.databaseKind, 'postgres');
  assert.equal(config.databasePath, null);
  assert.equal(config.databasePoolMax, 5);
});

test('config forbids SQLite in production and bounds pool size', () => {
  assert.throws(() => loadConfig({ TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_DATABASE_URL: 'sqlite:////tmp/grid.sqlite3', TIMELINE_ENV: 'production' }), /managed PostgreSQL/);
  assert.throws(() => loadConfig({ TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_DATABASE_URL: 'postgresql://localhost/grid', TIMELINE_DATABASE_POOL_MAX: '100', TIMELINE_ENV: 'development' }), /POOL_MAX/);
});

test('local database and upload storage must stay outside the standalone Timeline package', () => {
  const base = { TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes' };
  assert.throws(() => loadConfig({ ...base, TIMELINE_DATABASE_URL: `sqlite:///${path.join(packageRoot, 'inside.sqlite3')}` }), /outside the Timeline package/);
  assert.throws(() => loadConfig({ ...base, TIMELINE_UPLOAD_DIR: path.join(packageRoot, 'images') }), /outside the Timeline package/);
  const outside = path.join(os.tmpdir(), 'timeline-outside-package');
  const config = loadConfig({ ...base, TIMELINE_DATABASE_URL: `sqlite:///${path.join(outside, 'timeline.sqlite3')}`, TIMELINE_UPLOAD_DIR: path.join(outside, 'images') });
  assert.equal(config.databaseKind, 'sqlite');
});

test('production requires managed PostgreSQL, private Blob credentials, and shared rate-limit credentials', () => {
  const base = {
    TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_ENV: 'production',
    TIMELINE_DATABASE_URL: 'postgresql://placeholder:placeholder@localhost/grid?sslmode=verify-full',
  };
  assert.throws(() => loadConfig(base), /shared Upstash/);
  assert.throws(() => loadConfig({ ...base, UPSTASH_REDIS_REST_URL: 'https://invalid.example', UPSTASH_REDIS_REST_TOKEN: 'placeholder' }), /Vercel Blob/);
  const config = loadConfig({ ...base, UPSTASH_REDIS_REST_URL: 'https://invalid.example', UPSTASH_REDIS_REST_TOKEN: 'placeholder', BLOB_READ_WRITE_TOKEN: 'placeholder' });
  assert.equal(config.databaseKind, 'postgres');
  assert.equal(config.imageStorage, 'vercel-blob');
  assert.equal(config.secureCookies, true);
});


test('production accepts the Vercel Upstash integration REST environment variable names', () => {
  const base = {
    TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_ENV: 'production',
    TIMELINE_DATABASE_URL: 'postgresql://placeholder:placeholder@localhost/grid?sslmode=verify-full',
    UPSTASH_REDIS_REST_KV_REST_API_URL: 'https://example.upstash.io',
    UPSTASH_REDIS_REST_KV_REST_API_TOKEN: 'integration-token-placeholder',
    BLOB_READ_WRITE_TOKEN: 'placeholder',
  };
  const config = loadConfig(base);
  assert.equal(config.upstashUrl, 'https://example.upstash.io');
  assert.equal(config.upstashToken, 'integration-token-placeholder');
  assert.equal(config.rateLimitNamespace, 'local');
  const preview = loadConfig({ ...base, VERCEL: '1', VERCEL_ENV: 'preview' });
  const production = loadConfig({ ...base, VERCEL: '1', VERCEL_ENV: 'production' });
  assert.equal(preview.rateLimitNamespace, 'preview');
  assert.equal(production.rateLimitNamespace, 'production');
});

test('production PostgreSQL requires hostname-verified TLS', () => {
  assert.throws(() => loadConfig({
    TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_ENV: 'production',
    TIMELINE_DATABASE_URL: 'postgresql://user:pass@localhost/grid',
  }), /sslmode=verify-full/);
});

test('Vercel cannot run with development adapters or an implicit database URL', () => {
  const secret = 'local-test-key-longer-than-32-bytes';
  assert.throws(() => loadConfig({ VERCEL: '1', TIMELINE_ENV: 'preview', TIMELINE_SECRET_KEY: secret }), /TIMELINE_ENV=production/);
  assert.throws(() => loadConfig({ VERCEL: '1', NODE_ENV: 'production', TIMELINE_SECRET_KEY: secret, DATABASE_URL: 'postgresql://host/grid' }), /explicit Timeline-specific TIMELINE_DATABASE_URL/);
});

test('cookie path is configurable for an explicitly same-origin parent proxy and rejects unsafe paths', () => {
  const config = loadConfig({ TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_DATABASE_URL: 'postgresql://user:pass@localhost/grid', TIMELINE_COOKIE_PATH: '/timeline-api/api' });
  assert.equal(config.cookiePath, '/timeline-api/api');
  assert.throws(() => loadConfig({ TIMELINE_SECRET_KEY: 'local-test-key-longer-than-32-bytes', TIMELINE_COOKIE_PATH: '//attacker.invalid' }), /safe same-origin path/);
});
