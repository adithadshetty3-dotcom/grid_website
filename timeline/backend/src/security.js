import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{1,80}$/;
const COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax', path: '/api' };

export const tokenDigest = (token) => createHash('sha256').update(token, 'utf8').digest('hex');

export async function verifyWerkzeugScrypt(encoded, password) {
  const match = /^scrypt:(\d+):(\d+):(\d+)\$([^$]+)\$([a-f0-9]+)$/i.exec(encoded || '');
  if (!match) return false;
  const [, nText, rText, pText, salt, expectedHex] = match;
  const N = Number(nText), r = Number(rText), p = Number(pText);
  const expected = Buffer.from(expectedHex, 'hex');
  if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || expected.length < 16 || expected.length > 128) return false;
  try {
    const actual = await scrypt(password, salt, expected.length, { N, r, p, maxmem: Math.max(64 * 1024 * 1024, 256 * N * r) });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function makeCsrfToken(secret, now = Date.now()) {
  const payload = `${now}.${randomBytes(24).toString('base64url')}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyCsrfToken(secret, token, now = Date.now(), maxAgeMs = 8 * 60 * 60 * 1000) {
  if (typeof token !== 'string' || token.length > 512) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const timestamp = Number(parts[0]);
  if (!Number.isSafeInteger(timestamp) || timestamp > now || now - timestamp > maxAgeMs) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(parts[2], 'base64url'); } catch { return false; }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function csrfMiddleware(config) {
  return (req, res, next) => {
    const path = req.originalUrl.split('?', 1)[0];
    if (!path.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const headerToken = req.get('X-CSRFToken') || '';
    if (path === '/api/auth/login') {
      const cookieToken = req.cookies?.timeline_csrf || '';
      if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyCsrfToken(config.secret, headerToken)) {
        return res.status(400).json({ error: 'csrf_failed', message: 'A valid CSRF token is required.' });
      }
      return next();
    }
    if (!req.timelineSession) return res.status(401).json({ error: 'authentication_required' });
    if (!safeEqual(req.timelineSession.csrf_token, headerToken)) {
      return res.status(400).json({ error: 'csrf_failed', message: 'A valid CSRF token is required.' });
    }
    next();
  };
}

export function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function populateAdminSession(repository, req) {
  const token = req.cookies?.timeline_admin_session;
  if (!token) return;
  const row = await repository.findAdminSession(tokenDigest(token));
  if (!row || Date.parse(normalizeTimestamp(row.expires_at)) <= Date.now() || !row.is_active || Number(row.session_version) !== Number(row.admin_session_version)) return;
  req.timelineSession = row;
  req.timelineAdmin = { id: row.admin_id, username: row.username };
}

export function loadAdminSession(repository, _config) {
  return (req, _res, next) => populateAdminSession(repository, req).then(() => next(), next);
}

export function requireAdmin(repository, config) {
  void config;
  return async (req, res, next) => {
    try {
      await populateAdminSession(repository, req);
      if (!req.timelineSession) return res.status(401).json({ error: 'authentication_required' });
      next();
    } catch (error) { next(error); }
  };
}

export function normalizeTimestamp(value) {
  if (typeof value !== 'string') return value;
  return value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
}

export function setAuthCookie(res, name, value, config) {
  res.cookie(name, value, { ...COOKIE_OPTIONS, path: config.cookiePath || COOKIE_OPTIONS.path, secure: config.secureCookies, maxAge: config.sessionTtlSeconds * 1000 });
}

export function clearAuthCookie(res, name, config) {
  res.clearCookie(name, { ...COOKIE_OPTIONS, path: config.cookiePath || COOKIE_OPTIONS.path, secure: config.secureCookies });
}

export { COOKIE_OPTIONS, USERNAME_PATTERN };
