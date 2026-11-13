import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newDb } from 'pg-mem';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { PostgresDatabase } from '../src/db.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

test('PostgreSQL adapter executes parameterized CRUD, booleans, JSON and schema checks', async () => {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  const db = new PostgresDatabase(pool);
  try {
    const migration = await fs.readFile(path.join(HERE, '../../migrations/postgresql/0005_timeline_schema.sql'), 'utf8');
    await pool.query(migration);
    await db.assertSchema();

    const account = await db.prepare(`INSERT INTO timeline_admins (username, password_hash, is_active, session_version, created_at)
      VALUES (?, ?, ?, ?, ?) RETURNING id`).get('pg-adapter-test', 'not-a-real-secret-hash', true, 0, '2026-01-01 00:00:00');
    assert.ok(account.id);
    await db.prepare(`INSERT INTO timeline_milestones
      (id,title,category,date,time,location,summary,description,source_id,images,is_demo,is_published,sort_order,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('00000000-0000-4000-8000-000000000001', 'PG test', 'Community', '2026-01-01', '', '', 'Summary', 'Description', null, JSON.stringify([{ url: '/photo.png' }]), false, true, 0, '2026-01-01 00:00:00', '2026-01-01 00:00:00');
    const row = await db.prepare('SELECT is_published, images FROM timeline_milestones WHERE id = ?').get('00000000-0000-4000-8000-000000000001');
    assert.equal(row.is_published, true);
    assert.deepEqual(row.images, [{ url: '/photo.png' }]);

    await db.transaction(async (tx) => tx.prepare('UPDATE timeline_milestones SET title = ? WHERE id = ?').run('PG committed', '00000000-0000-4000-8000-000000000001'));
    const afterCommit = await db.prepare('SELECT title FROM timeline_milestones WHERE id = ?').get('00000000-0000-4000-8000-000000000001');
    assert.equal(afterCommit.title, 'PG committed');
  } finally { await db.close(); }
});

test('PostgreSQL adapter rolls back a failed transaction and releases its pooled client', async () => {
  const statements = [];
  let released = false;
  const pool = {
    connect: async () => ({
      query: async (sql, params) => { statements.push([sql, params]); return { rows: [], rowCount: 0 }; },
      release: () => { released = true; },
    }),
    end: async () => {},
  };
  const db = new PostgresDatabase(pool);
  await assert.rejects(db.transaction(async () => { throw new Error('rollback fixture'); }), /rollback fixture/);
  assert.deepEqual(statements.map(([sql]) => sql), ['BEGIN', 'ROLLBACK']);
  assert.equal(released, true);
});

test('Express auth and milestone business logic run unchanged over the PostgreSQL adapter', async () => {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  const db = new PostgresDatabase(pool);
  const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'grid-pg-adapter-'));
  const password = randomBytes(20).toString('base64url');
  const salt = randomBytes(8).toString('hex');
  const hash = `scrypt:32768:8:1$${salt}$${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
  let server;
  try {
    const migration = await fs.readFile(path.join(HERE, '../../migrations/postgresql/0005_timeline_schema.sql'), 'utf8');
    await pool.query(migration);
    await db.prepare('INSERT INTO timeline_admins (username,password_hash,is_active,session_version,created_at) VALUES (?,?,?,?,?)')
      .run('pg-admin-test', hash, true, 0, '2026-01-01 00:00:00');
    const config = { mode: 'test', secret: randomBytes(32).toString('hex'), uploadDir, sessionTtlSeconds: 3600, csrfTtlSeconds: 3600,
      secureCookies: false, maxJsonBytes: 32 * 1024, maxImageBytes: 10 * 1024 * 1024, maxMilestoneImageBytes: 40 * 1024 * 1024,
      maxMilestoneImages: 8, maxImageDimension: 8000, maxImagePixels: 32_000_000 };
    server = createApp({ db, config }).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const cookies = new Map();
    async function call(route, { method = 'GET', body, csrf, anonymous = false } = {}) {
      const headers = { Accept: 'application/json' };
      if (!anonymous && cookies.size) headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
      if (csrf) headers['X-CSRFToken'] = csrf;
      const multipart = body instanceof FormData;
      if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${base}${route}`, { method, headers, body: body === undefined ? undefined : (multipart ? body : JSON.stringify(body)) });
      for (const line of response.headers.getSetCookie()) {
        const [pair, ...attrs] = line.split(';'); const at = pair.indexOf('=');
        if (attrs.some((attr) => /^\s*max-age=0\s*$/i.test(attr))) cookies.delete(pair.slice(0, at));
        else cookies.set(pair.slice(0, at), pair.slice(at + 1));
      }
      const contentType = response.headers.get('content-type') || '';
      return { status: response.status, body: contentType.includes('application/json') ? await response.json() : null };
    }
    const bootstrap = await call('/api/auth/csrf');
    const login = await call('/api/auth/login', { method: 'POST', body: { username: 'pg-admin-test', password }, csrf: bootstrap.body.csrf_token });
    assert.equal(login.status, 200);
    assert.equal((await call('/api/auth/session')).body.authenticated, true);
    assert.equal((await call('/api/admin/timeline/milestones', { anonymous: true })).status, 401);
    assert.equal((await call('/api/admin/timeline/settings', { method: 'PUT', body: { starfieldEnabled: true }, anonymous: true })).status, 401);
    assert.equal((await call('/api/admin/timeline/settings', { method: 'PUT', csrf: 'wrong', body: { starfieldEnabled: true } })).status, 400);
    const created = await call('/api/admin/timeline/milestones', { method: 'POST', csrf: login.body.csrf_token, body: {
      title: 'Postgres route', category: 'Community', date: '2026-02-03', summary: 'Adapter check', description: 'Same route logic', isPublished: false, images: [],
    } });
    assert.equal(created.status, 201);
    assert.equal(created.body.milestone.isPublished, false);
    const published = await call(`/api/admin/timeline/milestones/${created.body.milestone.id}`, { method: 'PATCH', csrf: login.body.csrf_token, body: { isPublished: true } });
    assert.equal(published.status, 200);
    assert.equal((await call('/api/timeline/milestones')).body.milestones[0].id, created.body.milestone.id);
    const changed = await call('/api/admin/timeline/settings', { method: 'PUT', csrf: login.body.csrf_token, body: { starfieldEnabled: true } });
    assert.equal(changed.body.settings.starfieldEnabled, true);
    const sharp = (await import('sharp')).default;
    const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 20, g: 40, b: 60, alpha: 1 } } }).png().toBuffer();
    const form = new FormData(); form.append('file', new Blob([png], { type: 'image/png' }), 'pg.png');
    const uploaded = await call('/api/admin/timeline/images', { method: 'POST', csrf: login.body.csrf_token, body: form });
    assert.equal(uploaded.status, 201);
    assert.equal((await call(uploaded.body.image.url, { anonymous: true })).status, 404);
    const linked = await call(`/api/admin/timeline/milestones/${created.body.milestone.id}`, { method: 'PATCH', csrf: login.body.csrf_token, body: {
      images: [{ url: uploaded.body.image.url, name: uploaded.body.image.name, type: uploaded.body.image.type }],
    } });
    assert.equal(linked.status, 200);
    assert.equal((await call(uploaded.body.image.url, { anonymous: true })).status, 200);
    assert.equal((await call('/api/auth/logout', { method: 'POST', csrf: login.body.csrf_token })).status, 200);
    assert.equal((await call('/api/admin/timeline/milestones')).status, 401);
  } finally {
    if (server?.listening) { server.close(); await new Promise((resolve) => server.once('close', resolve)); }
    await db.close();
    await fs.rm(uploadDir, { recursive: true, force: true });
  }
});
