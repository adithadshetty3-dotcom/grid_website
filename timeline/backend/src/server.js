import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openPostgresDatabase, openSqliteDatabase } from './db.js';

const config = loadConfig();
if (config.databaseKind === 'sqlite' && !fs.existsSync(config.databasePath)) {
  throw new Error('Timeline SQLite database does not exist; provision/migrate an explicit local database before starting Express.');
}
const db = config.databaseKind === 'postgres'
  ? openPostgresDatabase(config.databaseUrl, { max: config.databasePoolMax })
  : openSqliteDatabase(config.databasePath);
try { await db.assertSchema(); }
catch (error) { await db.close(); throw error; }

const app = createApp({ db, config });
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const publicDir = path.join(packageRoot, 'public');
const indexFile = path.join(publicDir, 'index.html');
if (fs.existsSync(indexFile)) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();

    let requestedPath;
    try {
      requestedPath = decodeURIComponent(req.path === '/' ? '/index.html' : req.path);
    } catch {
      return res.sendStatus(400);
    }

    const candidate = path.resolve(publicDir, `.${requestedPath}`);
    if (!candidate.startsWith(`${publicDir}${path.sep}`) && candidate !== indexFile) {
      return res.sendStatus(404);
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return res.sendFile(candidate);
    }
    return res.sendFile(indexFile);
  });
}
export default app;

let server;
if (!process.env.VERCEL) {
  const { createServer } = await import('node:http');
  server = createServer(app);
  server.listen(config.port, '127.0.0.1', () => {
    process.stdout.write(`GRID Timeline Express API listening on 127.0.0.1:${config.port}\n`);
  });
}

function shutdown() {
  if (server?.listening) server.close(() => { void db.close().finally(() => process.exit(0)); });
}
if (!process.env.VERCEL) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
