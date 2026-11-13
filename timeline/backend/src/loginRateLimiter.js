import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

const digest = (value) => createHash('sha256').update(value).digest('hex');

export function createSharedLoginLimiter({ url, token, redis, limiters = null, namespace = 'default' }) {
  const sharedRedis = redis || (!limiters ? new Redis({ url, token }) : null);
  const prefix = `grid-timeline:${String(namespace).replace(/[^a-zA-Z0-9_-]/g, '_')}:login`;
  const [perAccount, perAddress] = limiters || [
    new Ratelimit({ redis: sharedRedis, limiter: Ratelimit.fixedWindow(5, '1 m'), prefix: `${prefix}:account` }),
    new Ratelimit({ redis: sharedRedis, limiter: Ratelimit.fixedWindow(20, '1 m'), prefix: `${prefix}:ip` }),
  ];
  return async function sharedLoginLimiter(req, res, next) {
    try {
      const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
      const username = String(req.body?.username || '').trim().toLowerCase().slice(0, 80);
      const [accountResult, addressResult] = await Promise.all([
        perAccount.limit(digest(`${ip}\0${username}`)), perAddress.limit(digest(ip)),
      ]);
      if (!accountResult.success || !addressResult.success) {
        return res.status(429).json({ error: 'rate_limited', message: 'Too many login attempts. Try again later.' });
      }
      next();
    } catch {
      // A shared limiter outage must not disable production authentication protection.
      res.status(503).json({ error: 'authentication_temporarily_unavailable', message: 'Please try again shortly.' });
    }
  };
}
