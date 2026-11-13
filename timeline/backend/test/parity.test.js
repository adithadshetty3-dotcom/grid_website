import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';
import { test } from 'node:test';
import { verifyWerkzeugScrypt } from '../src/security.js';

const NODE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = path.resolve(NODE_DIR, '..');
const FLASK_DIR = path.resolve(process.env.TIMELINE_FLASK_DIR || path.join(APP_DIR, '..', 'react-pilot', 'backend'));
const PYTHON = process.env.TIMELINE_FLASK_PYTHON || path.join(FLASK_DIR, '.venv', 'bin', 'python');
const enabled = process.env.TIMELINE_RUN_FLASK_PARITY === '1';

async function reservePort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('Express matches Flask auth, milestone, settings and private-image behavior on isolated databases', { skip: !enabled }, async () => {
    assert.ok(fs.existsSync(PYTHON), 'Create backend/.venv before running Flask parity tests.');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-timeline-parity-'));
    const secret = randomBytes(32).toString('hex');
    const username = `parity-${randomBytes(4).toString('hex')}`;
    const password = randomBytes(24).toString('base64url');
    const flaskPort = await reservePort();
    let expressPort = await reservePort();
    while (expressPort === flaskPort) expressPort = await reservePort();
    const targets = [
      { name: 'flask', port: flaskPort, db: path.join(temp, 'flask.sqlite3'), uploads: path.join(temp, 'flask-images') },
      { name: 'express', port: expressPort, db: path.join(temp, 'express.sqlite3'), uploads: path.join(temp, 'express-images') },
    ];
    const children = [];
    const envBase = { ...process.env, TIMELINE_ENV: 'development', TIMELINE_SECRET_KEY: secret, TIMELINE_RATE_LIMIT_STORAGE_URI: 'memory://', PARITY_TEST_USERNAME: username, PARITY_TEST_PASSWORD: password };
    const run = (command, args, cwd, env) => {
      const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
      if (result.status !== 0) throw new Error(`Isolated ${cwd === FLASK_DIR ? 'Flask' : 'Node'} setup failed (${result.status}).`);
    };
    const waitReady = async (target, child) => {
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(`${target.name} stopped before readiness.`);
        try {
          const response = await fetch(`http://127.0.0.1:${target.port}/api/auth/csrf`);
          if (response.status === 200) return;
        } catch {}
        await delay(150);
      }
      throw new Error(`${target.name} did not become ready.`);
    };

    async function exercise(target) {
      const base = `http://127.0.0.1:${target.port}`;
      const cookies = new Map();
      async function call(route, { method = 'GET', body, csrf, anonymous = false } = {}) {
        const headers = { Accept: 'application/json' };
        if (csrf) headers['X-CSRFToken'] = csrf;
        if (!anonymous && cookies.size) headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
        let requestBody = body;
        if (body !== undefined && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; requestBody = JSON.stringify(body); }
        const response = await fetch(`${base}${route}`, { method, headers, body: requestBody });
        for (const line of response.headers.getSetCookie()) {
          const [pair, ...attrs] = line.split(';');
          const equals = pair.indexOf('=');
          const name = pair.slice(0, equals), value = pair.slice(equals + 1);
          if (attrs.some((attr) => /^\s*max-age=0\s*$/i.test(attr))) cookies.delete(name);
          else if (value) cookies.set(name, value);
        }
        const bytes = Buffer.from(await response.arrayBuffer());
        let json = {};
        try { json = bytes.length ? JSON.parse(bytes.toString('utf8')) : {}; } catch {}
        return { status: response.status, json, bytes, contentType: response.headers.get('content-type') };
      }
      const csrf = await call('/api/auth/csrf');
      assert.equal(csrf.status, 200, `${target.name} CSRF bootstrap`);
      const missingCsrf = await call('/api/auth/login', { method: 'POST', body: { username, password }, anonymous: true });
      assert.equal(missingCsrf.status, 400, `${target.name} missing login CSRF`);
      const missingCredentials = await call('/api/auth/login', { method: 'POST', body: {}, csrf: csrf.json.csrf_token });
      assert.equal(missingCredentials.status, 401, `${target.name} missing credentials`);
      const wrong = await call('/api/auth/login', { method: 'POST', body: { username, password: 'incorrect-disposable-password' }, csrf: csrf.json.csrf_token });
      assert.equal(wrong.status, 401, `${target.name} bad password`);
      const login = await call('/api/auth/login', { method: 'POST', body: { username, password }, csrf: csrf.json.csrf_token });
      assert.equal(login.status, 200, `${target.name} valid login (${login.json.error || 'no error code'})`);
      assert.equal(login.json.authenticated, true);
      const restored = await call('/api/auth/session');
      assert.equal(restored.json.authenticated, true, `${target.name} session restore`);
      assert.equal(restored.json.csrf_token, login.json.csrf_token);
      assert.equal((await call('/api/admin/ping')).status, 200, `${target.name} admin ping`);
      assert.equal((await call('/api/admin/timeline/milestones')).status, 200);
      assert.equal((await call('/api/admin/timeline/milestones', { method: 'POST', body: {}, csrf: 'invalid' })).status, 400);

      const item = { title: 'Parity milestone', category: 'Community', date: '2024-02-29', time: '', location: '', summary: 'Temporary', description: 'Parity run', images: [], isDemo: false, isPublished: false };
      const created = await call('/api/admin/timeline/milestones', { method: 'POST', body: item, csrf: login.json.csrf_token });
      assert.equal(created.status, 201, `${target.name} create`);
      assert.equal((await call('/api/timeline/milestones')).json.milestones.length, 0, `${target.name} draft hidden`);
      let changed = await call(`/api/admin/timeline/milestones/${created.json.milestone.id}`, { method: 'PATCH', body: { isPublished: true }, csrf: login.json.csrf_token });
      assert.equal(changed.status, 200);
      const publicMilestone = (await call('/api/timeline/milestones')).json.milestones[0];
      assert.equal(publicMilestone.title, item.title);
      changed = await call(`/api/admin/timeline/milestones/${created.json.milestone.id}`, { method: 'PATCH', body: { title: 'Changed' }, csrf: login.json.csrf_token });
      assert.equal(changed.json.milestone.title, 'Changed');
      assert.equal((await call('/api/admin/timeline/milestones/reorder', { method: 'POST', body: { ids: [created.json.milestone.id] }, csrf: login.json.csrf_token })).status, 200);
      assert.equal((await call('/api/timeline/settings')).json.settings.starfieldEnabled, false);
      assert.equal((await call('/api/admin/timeline/settings', { method: 'PUT', body: { starfieldEnabled: true }, csrf: login.json.csrf_token })).json.settings.starfieldEnabled, true);
      assert.equal((await call('/api/timeline/settings')).json.settings.starfieldEnabled, true);

      const png = await sharp({ create: { width: 2, height: 3, channels: 4, background: { r: 100, g: 50, b: 25, alpha: 1 } } }).png().toBuffer();
      const form = new FormData();
      form.append('file', new Blob([png], { type: 'image/png' }), 'parity.png');
      const upload = await call('/api/admin/timeline/images', { method: 'POST', body: form, csrf: login.json.csrf_token });
      assert.equal(upload.status, 201, `${target.name} upload`);
      assert.deepEqual([upload.json.image.type, upload.json.image.width, upload.json.image.height, upload.json.image.size], ['image/png', 2, 3, png.length]);
      assert.equal((await call(upload.json.image.url, { anonymous: true })).status, 404, `${target.name} image private before linked/published`);
      const linked = await call('/api/admin/timeline/milestones', { method: 'POST', body: { ...item, title: 'Private photo', images: [{ url: upload.json.image.url, name: upload.json.image.name, type: upload.json.image.type }] }, csrf: login.json.csrf_token });
      assert.equal(linked.status, 201);
      assert.equal((await call(upload.json.image.url, { anonymous: true })).status, 404);
      await call(`/api/admin/timeline/milestones/${linked.json.milestone.id}`, { method: 'PATCH', body: { isPublished: true }, csrf: login.json.csrf_token });
      assert.equal((await call(upload.json.image.url, { anonymous: true })).status, 200, `${target.name} published image readable`);

      const importForm = new FormData();
      importForm.append('milestone', JSON.stringify({ ...item, title: 'Imported once', sourceId: `parity-${username}` }));
      const imported = await call('/api/admin/timeline/imports', { method: 'POST', body: importForm, csrf: login.json.csrf_token });
      assert.equal(imported.status, 201, `${target.name} import`);
      assert.equal(imported.json.imported, true);
      const retry = await call('/api/admin/timeline/imports', { method: 'POST', body: importForm, csrf: login.json.csrf_token });
      assert.equal(retry.status, 200, `${target.name} import retry`);
      assert.equal(retry.json.alreadyImported, true);
      assert.equal(retry.json.milestone.id, imported.json.milestone.id);

      const anon = await call('/api/admin/timeline/milestones', { anonymous: true });
      assert.equal(anon.status, 401, `${target.name} anonymous admin read`);
      assert.equal((await call('/api/admin/timeline/milestones', { method: 'POST', body: item, anonymous: true })).status, 401);
      assert.equal((await call(`/api/admin/timeline/milestones/${linked.json.milestone.id}`, { method: 'DELETE', csrf: login.json.csrf_token })).status, 200);
      assert.equal((await call(`/api/admin/timeline/milestones/${created.json.milestone.id}`, { method: 'DELETE', csrf: login.json.csrf_token })).status, 200);
      assert.equal((await call('/api/auth/logout', { method: 'POST', csrf: login.json.csrf_token })).status, 200);
      assert.equal((await call('/api/admin/timeline/milestones')).status, 401);

      const freshCsrf = await call('/api/auth/csrf');
      const secondLogin = await call('/api/auth/login', { method: 'POST', body: { username, password }, csrf: freshCsrf.json.csrf_token });
      assert.equal(secondLogin.status, 200, `${target.name} second login for expiry test`);
      const rawSession = cookies.get('timeline_admin_session');
      const tokenHash = createHash('sha256').update(rawSession).digest('hex');
      const isolatedDb = new DatabaseSync(target.db);
      isolatedDb.prepare("UPDATE timeline_admin_sessions SET expires_at = '2000-01-01 00:00:00' WHERE token_hash = ?").run(tokenHash);
      isolatedDb.close();
      assert.equal((await call('/api/auth/session')).json.authenticated, false, `${target.name} expired session restore`);
      assert.equal((await call('/api/admin/timeline/milestones')).status, 401, `${target.name} expired session admin route`);
      return { loginStatus: login.status, created: created.json.milestone, uploaded: upload.json.image };
    }

    try {
      for (const target of targets) {
        const env = { ...envBase, TIMELINE_DATABASE_URL: `sqlite:///${target.db}`, TIMELINE_UPLOAD_DIR: target.uploads };
        run(PYTHON, ['-m', 'flask', '--app', 'app:create_app', 'db', 'upgrade'], FLASK_DIR, env);
        run(PYTHON, ['test/seed_admin.py'], NODE_DIR, { ...env, PYTHONPATH: FLASK_DIR });
      }
      const check = new DatabaseSync(targets[0].db, { readOnly: true });
      const seeded = check.prepare('SELECT password_hash FROM timeline_admins').get();
      assert.ok(seeded, 'Flask reference admin fixture was seeded.');
      assert.equal(await verifyWerkzeugScrypt(seeded.password_hash, password), true, 'Node verifier accepts the Werkzeug scrypt fixture.');
      check.close();
      const flaskEnv = { ...envBase, TIMELINE_DATABASE_URL: `sqlite:///${targets[0].db}`, TIMELINE_UPLOAD_DIR: targets[0].uploads };
      const expressEnv = { ...envBase, TIMELINE_DATABASE_URL: `sqlite:///${targets[1].db}`, TIMELINE_UPLOAD_DIR: targets[1].uploads, TIMELINE_PORT: String(targets[1].port) };
      flaskEnv.FLASK_SKIP_DOTENV = '1';
      const flask = spawn(PYTHON, ['-m', 'flask', '--app', 'app:create_app', 'run', '--host', '127.0.0.1', '--port', String(targets[0].port), '--no-reload'], { cwd: FLASK_DIR, env: flaskEnv, stdio: 'ignore' });
      children.push(flask);
      const express = spawn(process.execPath, ['src/server.js'], { cwd: NODE_DIR, env: expressEnv, stdio: 'ignore' });
      children.push(express);
      await Promise.all([waitReady(targets[0], flask), waitReady(targets[1], express)]);
      const flaskResult = await exercise(targets[0]);
      const expressResult = await exercise(targets[1]);
      assert.equal(flaskResult.loginStatus, expressResult.loginStatus);
      for (const field of ['title', 'category', 'date', 'time', 'location', 'summary', 'description', 'isDemo', 'isPublished', 'sortOrder']) {
        assert.equal(expressResult.created[field], flaskResult.created[field], `serialized create field ${field}`);
      }
      assert.equal(expressResult.uploaded.type, flaskResult.uploaded.type);
      assert.equal(expressResult.uploaded.width, flaskResult.uploaded.width);
      assert.equal(expressResult.uploaded.height, flaskResult.uploaded.height);
      assert.equal(expressResult.uploaded.size, flaskResult.uploaded.size);
    } finally {
      for (const child of children) child.kill('SIGTERM');
      await Promise.all(children.map((child) => once(child, 'exit').catch(() => {})));
      fs.rmSync(temp, { recursive: true, force: true });
    }
});
