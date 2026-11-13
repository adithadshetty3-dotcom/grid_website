import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes, scryptSync } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';
import { assertCompatibleSchema, openMemoryDatabase } from '../src/db.js';

let db;
let server;
let base;
let config;
let password;
let browser;

function initializeSchema(database) {
  database.database.exec(`
    CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL);
    INSERT INTO alembic_version VALUES ('0005_timeline_starfield_setting');
    CREATE TABLE timeline_admins (
      id INTEGER PRIMARY KEY, username VARCHAR(80) NOT NULL UNIQUE, password_hash VARCHAR(256) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1, session_version INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL
    );
    CREATE TABLE timeline_admin_sessions (
      id INTEGER PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE, csrf_token VARCHAR(64) NOT NULL,
      admin_id INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE CASCADE,
      session_version INTEGER NOT NULL DEFAULT 0, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL
    );
    CREATE TABLE timeline_milestones (
      id VARCHAR(36) PRIMARY KEY, title VARCHAR(90) NOT NULL, category VARCHAR(24) NOT NULL,
      date VARCHAR(10) NOT NULL, time VARCHAR(5) NOT NULL DEFAULT '', location VARCHAR(100) NOT NULL DEFAULT '',
      summary VARCHAR(180) NOT NULL, description VARCHAR(6000) NOT NULL, source_id VARCHAR(255) UNIQUE,
      images JSON NOT NULL, is_demo BOOLEAN NOT NULL DEFAULT 0, is_published BOOLEAN NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
      CHECK(sort_order >= 0), CHECK(category IN ('Events','Workshops','Achievements','Projects','Community'))
    );
    CREATE INDEX ix_timeline_milestones_public_order ON timeline_milestones(is_published, sort_order, date, id);
    CREATE TABLE timeline_images (
      id VARCHAR(36) PRIMARY KEY, storage_key VARCHAR(40) NOT NULL UNIQUE, original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(32) NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes > 0),
      width INTEGER NOT NULL CHECK(width > 0), height INTEGER NOT NULL CHECK(height > 0), sha256 VARCHAR(64) NOT NULL,
      uploaded_by INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE RESTRICT, created_at DATETIME NOT NULL
    );
    CREATE TABLE timeline_site_settings (
      id VARCHAR(24) PRIMARY KEY, starfield_enabled BOOLEAN NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL
    );
  `);
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function request(path, { method = 'GET', body, csrf, includeCookies = true, multipart = false, redirect } = {}) {
  const headers = { Accept: 'application/json' };
  if (csrf) headers['X-CSRFToken'] = csrf;
  if (includeCookies && browser.cookies.size) headers.Cookie = cookieHeader(browser.cookies);
  let requestBody = body;
  if (body !== undefined && !multipart) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  const response = await fetch(`${base}${path}`, { method, headers, body: requestBody, redirect });
  for (const line of response.headers.getSetCookie()) {
    const [pair, ...attributes] = line.split(';');
    const split = pair.indexOf('=');
    const name = pair.slice(0, split);
    const value = pair.slice(split + 1);
    if (attributes.some((attribute) => /^\s*max-age=0\s*$/i.test(attribute))) browser.cookies.delete(name);
    else if (value) browser.cookies.set(name, value);
  }
  const raw = await response.arrayBuffer();
  let payload = {};
  try { payload = raw.byteLength ? JSON.parse(Buffer.from(raw).toString('utf8')) : {}; } catch {}
  return { status: response.status, payload, raw: Buffer.from(raw), type: response.headers.get('content-type'), location: response.headers.get('location') };
}

async function getCsrf() {
  const result = await request('/api/auth/csrf');
  assert.equal(result.status, 200);
  return result.payload.csrf_token;
}

beforeEach(async () => {
  db = openMemoryDatabase();
  initializeSchema(db);
  config = {
    mode: 'test', secret: randomBytes(32).toString('hex'), databasePath: ':memory:',
    uploadDir: path.join(os.tmpdir(), `grid-timeline-express-test-${process.pid}-${randomBytes(4).toString('hex')}`),
    port: 0, secureCookies: false, sessionTtlSeconds: 12 * 60 * 60, csrfTtlSeconds: 8 * 60 * 60,
    maxJsonBytes: 32 * 1024, maxImageBytes: 10 * 1024 * 1024, maxMilestoneImageBytes: 40 * 1024 * 1024,
    maxMilestoneImages: 8, maxImageDimension: 8000, maxImagePixels: 32_000_000,
  };
  password = randomBytes(24).toString('base64url');
  const salt = randomBytes(16).toString('hex').slice(0, 16);
  const hash = `scrypt:32768:8:1$${salt}$${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
  db.database.prepare('INSERT INTO timeline_admins (username, password_hash, is_active, session_version, created_at) VALUES (?, ?, 1, 0, ?)')
    .run('disposable-admin', hash, new Date().toISOString());
  server = createApp({ db, config }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  browser = { cookies: new Map() };
});

test('startup schema guard requires the Flask 0005 schema without changing it', () => {
  return assertCompatibleSchema(db).then(async () => {
    await db.database.prepare("UPDATE alembic_version SET version_num='0004_timeline_private_images'").run();
    await assert.rejects(assertCompatibleSchema(db), /must be at Alembic revision 0005/);
  });
});

afterEach(async () => {
  if (server?.listening) { server.close(); await once(server, 'close'); }
  db?.close();
  const fs = await import('node:fs/promises');
  await fs.rm(config.uploadDir, { recursive: true, force: true });
});

test('same-origin login, session cookie, CSRF, logout and protected-route parity contract', async () => {
  const missingCsrf = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password } });
  assert.equal(missingCsrf.status, 400);
  let csrf = await getCsrf();
  const wrongPassword = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password: 'wrong-test-password' }, csrf });
  assert.equal(wrongPassword.status, 401);
  csrf = await getCsrf();
  const missingCredentials = await request('/api/auth/login', { method: 'POST', body: {}, csrf });
  assert.equal(missingCredentials.status, 401);
  csrf = await getCsrf();
  const login = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password }, csrf });
  assert.equal(login.status, 200);
  assert.equal(login.payload.authenticated, true);
  assert.equal(login.payload.admin.username, 'disposable-admin');
  const sessionCookie = [...browser.cookies.keys()].find((name) => name === 'timeline_admin_session');
  assert.ok(sessionCookie);
  const restored = await request('/api/auth/session');
  assert.equal(restored.status, 200);
  assert.equal(restored.payload.authenticated, true);
  assert.equal(restored.payload.csrf_token, login.payload.csrf_token);
  const adminList = await request('/api/admin/timeline/milestones');
  assert.deepEqual(adminList.payload, { milestones: [] });
  const badWrite = await request('/api/admin/timeline/settings', { method: 'PUT', body: { starfieldEnabled: true }, csrf: 'incorrect' });
  assert.equal(badWrite.status, 400);
  const logout = await request('/api/auth/logout', { method: 'POST', csrf: login.payload.csrf_token });
  assert.equal(logout.status, 200);
  assert.equal((await request('/api/admin/timeline/milestones')).status, 401);
});

test('milestone create, public draft filtering, publish, edit, reorder, settings and deletion', async () => {
  const csrf = await getCsrf();
  const login = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password }, csrf });
  assert.equal(login.status, 200);
  const writeToken = login.payload.csrf_token;
  const draft = { title: 'Disposable test', category: 'Community', date: '2024-02-29', summary: 'Private until published', description: 'Temporary parity test', images: [] };
  const created = await request('/api/admin/timeline/milestones', { method: 'POST', body: draft, csrf: writeToken });
  assert.equal(created.status, 201);
  const id = created.payload.milestone.id;
  assert.equal(created.payload.milestone.isPublished, false);
  assert.equal((await request('/api/timeline/milestones')).payload.milestones.length, 0);
  const published = await request(`/api/admin/timeline/milestones/${id}`, { method: 'PATCH', body: { isPublished: true }, csrf: writeToken });
  assert.equal(published.status, 200);
  assert.equal((await request('/api/timeline/milestones')).payload.milestones[0].id, id);
  const edited = await request(`/api/admin/timeline/milestones/${id}`, { method: 'PATCH', body: { title: 'Edited test' }, csrf: writeToken });
  assert.equal(edited.payload.milestone.title, 'Edited test');
  assert.deepEqual((await request('/api/admin/timeline/milestones/reorder', { method: 'POST', body: { ids: [id] }, csrf: writeToken })).payload, { ids: [id] });
  assert.equal((await request('/api/timeline/settings')).payload.settings.starfieldEnabled, false);
  assert.equal((await request('/api/admin/timeline/settings', { method: 'PUT', body: { starfieldEnabled: true }, csrf: writeToken })).payload.settings.starfieldEnabled, true);
  assert.equal((await request('/api/timeline/settings')).payload.settings.starfieldEnabled, true);
  assert.equal((await request('/api/admin/timeline/milestones/invalid', { method: 'DELETE', csrf: writeToken })).status, 404);
  assert.deepEqual((await request(`/api/admin/timeline/milestones/${id}`, { method: 'DELETE', csrf: writeToken })).payload, { deleted: true });
  assert.equal((await request('/api/timeline/milestones')).payload.milestones.length, 0);
});

test('admin image uploads are validated and remain private until a published milestone links them', async () => {
  const csrf = await getCsrf();
  const login = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password }, csrf });
  assert.equal(login.status, 200);
  const writeToken = login.payload.csrf_token;
  const { default: sharp } = await import('sharp');
  const bytes = await sharp({ create: { width: 3, height: 2, channels: 4, background: { r: 20, g: 30, b: 40, alpha: 1 } } }).png().toBuffer();
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'tiny.png');
  const uploaded = await request('/api/admin/timeline/images', { method: 'POST', body: form, csrf: writeToken, multipart: true });
  assert.equal(uploaded.status, 201);
  const reference = uploaded.payload.image;
  assert.equal(reference.width, 3);
  assert.equal(reference.height, 2);
  const hidden = await request(reference.url, { includeCookies: false });
  assert.equal(hidden.status, 404);
  const linked = await request('/api/admin/timeline/milestones', { method: 'POST', body: {
    title: 'Image test', category: 'Projects', date: '2024-03-01', summary: 'Private image test', description: 'Temporary', images: [{ url: reference.url, name: reference.name, type: reference.type }],
  }, csrf: writeToken });
  assert.equal(linked.status, 201);
  const stillHidden = await request(reference.url, { includeCookies: false });
  assert.equal(stillHidden.status, 404);
  const visible = await request(`/api/admin/timeline/milestones/${linked.payload.milestone.id}`, { method: 'PATCH', body: { isPublished: true }, csrf: writeToken });
  assert.equal(visible.status, 200);
  const publicImage = await request(reference.url, { includeCookies: false, redirect: 'manual' });
  assert.equal(publicImage.status, 200);
  assert.match(publicImage.type, /image\/png/);
  assert.ok(publicImage.raw.length > 0);
});

test('Vercel private Blob token and finalize flow stays admin/CSRF protected and serves scoped signed URLs', async () => {
  const csrf = await getCsrf();
  const login = await request('/api/auth/login', { method: 'POST', body: { username: 'disposable-admin', password }, csrf });
  assert.equal(login.status, 200);
  if (server?.listening) { server.close(); await once(server, 'close'); }
  const { default: sharp } = await import('sharp');
  const bytes = await sharp({ create: { width: 3, height: 2, channels: 3, background: '#123456' } }).png().toBuffer();
  const key = 'abcdef0123456789abcdef0123456789.img';
  const blob = new Map([[key, bytes]]);
  let signed = false;
  const imageStorage = {
    kind: 'vercel-blob',
    async put() {},
    async read(pathname) { return blob.get(pathname) || null; },
    async remove() {},
    async createReadUrl(pathname) { signed = true; return `https://private.invalid/${pathname}?signed=opaque`; },
  };
  let tokenOptions;
  server = createApp({ db, config, imageStorage, blobUploadHandler: async ({ body, onBeforeGenerateToken }) => {
    tokenOptions = await onBeforeGenerateToken(body.payload.pathname);
    return { type: 'blob.generate-client-token', clientToken: 'synthetic-token' };
  } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  const denied = await request('/api/admin/timeline/images/upload-token', { method: 'POST', body: { type: 'blob.generate-client-token', payload: { pathname: key } }, csrf: login.payload.csrf_token, includeCookies: false });
  assert.equal(denied.status, 401);
  const issued = await request('/api/admin/timeline/images/upload-token', { method: 'POST', body: { type: 'blob.generate-client-token', payload: { pathname: key } }, csrf: login.payload.csrf_token });
  assert.equal(issued.status, 200);
  assert.equal(tokenOptions.maximumSizeInBytes, config.maxImageBytes);
  assert.deepEqual(tokenOptions.allowedContentTypes, ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
  assert.equal(tokenOptions.allowOverwrite, false);
  const finalize = await request('/api/admin/timeline/images/finalize', { method: 'POST', body: { pathname: key, originalName: 'private.png' }, csrf: login.payload.csrf_token });
  assert.equal(finalize.status, 201);
  const reference = finalize.payload.image;
  const hidden = await request(reference.url, { includeCookies: false });
  assert.equal(hidden.status, 404);
  assert.equal(signed, false);
  const milestone = await request('/api/admin/timeline/milestones', { method: 'POST', body: {
    title: 'Blob fixture', category: 'Projects', date: '2025-01-01', summary: 'Private image', description: 'Synthetic', images: [{ url: reference.url, name: reference.name, type: reference.type }],
  }, csrf: login.payload.csrf_token });
  assert.equal(milestone.status, 201);
  const published = await request(`/api/admin/timeline/milestones/${milestone.payload.milestone.id}`, { method: 'PATCH', body: { isPublished: true }, csrf: login.payload.csrf_token });
  assert.equal(published.status, 200);
  const publicImage = await request(reference.url, { includeCookies: false, redirect: 'manual' });
  assert.equal(publicImage.status, 302);
  assert.match(publicImage.location, /private\.invalid/);
  assert.equal(signed, true);
});
