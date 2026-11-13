import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadConfig(env = process.env) {
  const mode = (env.TIMELINE_ENV || env.NODE_ENV || 'development').toLowerCase();
  if (env.VERCEL && mode !== 'production') {
    throw new Error('Vercel deployments must use production security and managed service adapters; set TIMELINE_ENV=production.');
  }
  const secret = env.TIMELINE_SECRET_KEY;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('Set a private TIMELINE_SECRET_KEY of at least 32 bytes.');
  }
  const dataRoot = process.platform === 'win32'
    ? path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'grid-timeline')
    : path.join(env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'grid-timeline');
  const databaseUrl = env.TIMELINE_DATABASE_URL || env.DATABASE_URL || env.POSTGRES_URL || `sqlite:///${path.join(dataRoot, 'timeline-admin.sqlite3')}`;
  const databaseKind = databaseUrl.startsWith('sqlite:///') ? 'sqlite'
    : (/^postgres(?:ql)?:\/\//i.test(databaseUrl) ? 'postgres' : null);
  if (!databaseKind) throw new Error('TIMELINE_DATABASE_URL must use sqlite:/// or postgresql://.');
  if (mode === 'production' && databaseKind !== 'postgres') throw new Error('Production requires managed PostgreSQL; SQLite is local/test only.');
  if (mode === 'production' && !env.TIMELINE_DATABASE_URL) throw new Error('Production requires an explicit Timeline-specific TIMELINE_DATABASE_URL.');
  if (mode === 'production' && new URL(databaseUrl).searchParams.get('sslmode') !== 'verify-full') {
    throw new Error('Production TIMELINE_DATABASE_URL must enable hostname-verified TLS with sslmode=verify-full.');
  }
  const databasePath = databaseKind === 'sqlite' ? path.resolve(databaseUrl.slice('sqlite://'.length)) : null;
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  if (databasePath && (databasePath === packageRoot || databasePath.startsWith(`${packageRoot}${path.sep}`))) {
    throw new Error('SQLite database files must be stored outside the Timeline package.');
  }
  const uploadDir = path.resolve(env.TIMELINE_UPLOAD_DIR || path.join(dataRoot, 'images'));
  if (uploadDir === packageRoot || uploadDir.startsWith(`${packageRoot}${path.sep}`)) {
    throw new Error('Timeline upload storage must be outside the Timeline package.');
  }
  const imageStorage = mode === 'production' ? 'vercel-blob' : (env.TIMELINE_IMAGE_STORAGE || 'filesystem');
  if (!['filesystem', 'vercel-blob'].includes(imageStorage)) throw new Error('TIMELINE_IMAGE_STORAGE must be filesystem or vercel-blob.');
  // The Vercel Upstash Marketplace integration uses the longer KV_REST_API names
  // when a custom prefix is supplied. Also accept the canonical SDK names so
  // manual installations and existing environments remain compatible.
  const upstashUrl = env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const upstashToken = env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (mode === 'production' && (!upstashUrl || !upstashToken)) throw new Error('Production requires shared Upstash Redis rate limiting.');
  if (mode === 'production' && !env.BLOB_READ_WRITE_TOKEN) throw new Error('Production requires a Vercel Blob private-storage token.');
  const rateLimitNamespace = String(env.VERCEL_ENV || (env.VERCEL ? 'vercel' : 'local')).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const port = Number(env.TIMELINE_PORT || 5001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('TIMELINE_PORT must be a valid port.');
  const databasePoolMax = Number(env.TIMELINE_DATABASE_POOL_MAX || 5);
  if (!Number.isInteger(databasePoolMax) || databasePoolMax < 1 || databasePoolMax > 10) throw new Error('TIMELINE_DATABASE_POOL_MAX must be an integer from 1 to 10.');
  const cookiePath = env.TIMELINE_COOKIE_PATH || '/api';
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(cookiePath) || cookiePath.startsWith('//') || cookiePath.split('/').includes('..')) throw new Error('TIMELINE_COOKIE_PATH must be a safe same-origin path.');
  return {
    mode,
    databaseKind,
    databaseUrl,
    databasePoolMax,
    secret,
    databasePath,
    uploadDir,
    imageStorage,
    upstashUrl,
    upstashToken,
    rateLimitNamespace,
    port,
    cookiePath,
    secureCookies: mode === 'production',
    sessionTtlSeconds: 12 * 60 * 60,
    csrfTtlSeconds: 8 * 60 * 60,
    maxJsonBytes: 32 * 1024,
    maxImageBytes: 10 * 1024 * 1024,
    maxMilestoneImageBytes: 40 * 1024 * 1024,
    maxMilestoneImages: 8,
    maxImageDimension: 8000,
    maxImagePixels: 32_000_000,
  };
}
