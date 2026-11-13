import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import sharp from 'sharp';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { handleUpload } from '@vercel/blob/client';
import { clearAuthCookie, csrfMiddleware, loadAdminSession, makeCsrfToken, normalizeTimestamp, requireAdmin, setAuthCookie, tokenDigest, USERNAME_PATTERN, verifyWerkzeugScrypt } from './security.js';
import { createTimelineRepository } from './timelineRepository.js';
import { createImageStorage } from './imageStorage.js';
import { createSharedLoginLimiter } from './loginRateLimiter.js';
import { imageIdFromUrl, newUuid, normalizeDateTime, parseJson, serializeMilestone, validUuid, validateMilestonePayload } from './validation.js';

const HASH_DUMMY = 'scrypt:32768:8:1$1a4R2uWgjUY2NeqF$c26be3a6d4de2ff0592b2aeb3d8a0478cbc28f4671e5efb278c7b91efaa27a44b969b662bfa8b4f64d157d363807fd7db7f1e2eb8b47adb84b52226bd314fa2b';
function adminSession(repository, config) {
  return (req, res, next) => requireAdmin(repository, config)(req, res, next);
}

async function setAdminSession(repository, config, row) {
  const raw = crypto.randomBytes(32).toString('base64url');
  const csrf = crypto.randomBytes(32).toString('base64url');
  await repository.createAdminSession({ tokenHash: tokenDigest(raw), csrfToken: csrf, adminId: row.id,
    sessionVersion: row.session_version, expiresAt: normalizeDateTime(Date.now() + config.sessionTtlSeconds * 1000) });
  return { raw, csrf };
}

function setBootstrapCookie(res, config, token) {
  res.cookie('timeline_csrf', token, {
    httpOnly: true, sameSite: 'lax', path: config.cookiePath || '/api', secure: config.secureCookies,
    maxAge: config.csrfTtlSeconds * 1000,
  });
}

function createLimiter(windowMs, max, keyGenerator) {
  return rateLimit({
    windowMs, limit: max, keyGenerator, standardHeaders: true, legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'rate_limited', message: 'Too many login attempts. Try again later.' }),
  });
}

function sendBad(res, errors) { return res.status(400).json({ error: 'invalid_milestone', fields: errors }); }

async function ensureImageReferenceExists(repository, config, images) {
  if (images.length > config.maxMilestoneImages) return 'A milestone can contain at most 8 photos.';
  let total = 0;
  for (const reference of images) {
    if (!reference.url.startsWith('/api/timeline/images/')) continue;
    const id = imageIdFromUrl(reference.url);
    if (!id) return 'Managed Timeline image references must use the canonical image URL.';
    const image = await repository.findImageSize(id);
    if (!image) return 'A managed Timeline image reference does not exist.';
    total += image.size_bytes;
  }
  return total > config.maxMilestoneImageBytes ? 'Keep combined uploaded photos under 40 MB per milestone.' : null;
}

async function listMilestones(repository, publishedOnly = false) {
  return (await repository.listMilestones(publishedOnly)).map((row) => serializeMilestone(row, true));
}

function setMilestone(input, existing = null) {
  const fields = {
    title: input.title ?? existing?.title,
    category: input.category ?? existing?.category,
    date: input.date ?? existing?.date,
    time: input.time ?? existing?.time ?? '',
    location: input.location ?? existing?.location ?? '',
    summary: input.summary ?? existing?.summary,
    description: input.description ?? existing?.description,
    images: input.images ?? parseJson(existing?.images, []),
    is_demo: input.isDemo ?? Boolean(existing?.is_demo),
    is_published: input.isPublished ?? Boolean(existing?.is_published),
  };
  return fields;
}

async function validateImages(repository, config, images) {
  return ensureImageReferenceExists(repository, config, images || []);
}

function imageUploadMiddleware(config) {
  const storage = {
    _handleFile(req, file, callback) {
      const chunks = [];
      let size = 0;
      let failed = false;
      file.stream.on('data', (chunk) => {
        size += chunk.length;
        req.timelineUploadBytes = (req.timelineUploadBytes || 0) + chunk.length;
        if (req.timelineUploadBytes > config.maxMilestoneImageBytes && !failed) {
          failed = true;
          const error = new multer.MulterError('LIMIT_FILE_SIZE', file.fieldname);
          callback(error);
          file.stream.resume();
          return;
        }
        if (!failed) chunks.push(chunk);
      });
      file.stream.once('error', (error) => { if (!failed) callback(error); });
      file.stream.once('end', () => {
        if (!failed) callback(null, { buffer: Buffer.concat(chunks, size), size });
      });
    },
    _removeFile(_req, file, callback) { delete file.buffer; callback(null); },
  };
  return multer({
    storage,
    limits: { fileSize: config.maxImageBytes, files: 9, fields: 16, fieldSize: config.maxJsonBytes, parts: 16 },
  });
}

async function validateImage(buffer, config) {
  if (!buffer?.length) throw new Error('Choose an image to upload.');
  if (buffer.length > config.maxImageBytes) throw new Error('Each photo must be 10 MB or smaller.');
  try {
    const options = { limitInputPixels: config.maxImagePixels, animated: false, failOn: 'error' };
    const metadata = await sharp(buffer, options).metadata();
    const allowed = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);
    if (!allowed.has(metadata.format)) throw new Error('Use JPG, PNG, WebP, GIF or AVIF images. SVG is not accepted.');
    const { width, height } = metadata;
    if (!width || !height || width > config.maxImageDimension || height > config.maxImageDimension || width * height > config.maxImagePixels) {
      throw new Error('Image dimensions exceed the Timeline upload limit.');
    }
    await sharp(buffer, options).rotate().jpeg({ quality: 80 }).toBuffer();
    return { mime: metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`, width, height };
  } catch (error) {
    if (error.message.startsWith('Use ') || error.message.startsWith('Image dimensions')) throw error;
    throw new Error('The uploaded file is not a valid supported raster image.');
  }
}

function safeImageName(original, mime) {
  let name = path.basename(String(original || '')).normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(0, 255);
  const extension = name.includes('.') ? name.split('.').at(-1).toLowerCase() : '';
  const supported = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
  if (!supported.has(extension)) name = `photo.${mime.split('/')[1].replace('jpeg', 'jpg')}`;
  return name || 'photo';
}

async function storeImage(repository, config, storage, req, file, { storageKey = `${crypto.randomBytes(16).toString('hex')}.img` } = {}) {
  const decoded = await validateImage(file.buffer, config);
  const id = newUuid();
  if (!/^[a-f0-9]{32}\.img$/.test(storageKey)) throw new Error('Invalid private image key.');
  await storage.put(storageKey, file.buffer, decoded.mime);
  const originalName = safeImageName(file.originalname, decoded.mime);
  try {
    await repository.createImage({ id, storageKey, originalName, mime: decoded.mime, size: file.buffer.length,
      width: decoded.width, height: decoded.height, sha256: crypto.createHash('sha256').update(file.buffer).digest('hex'), adminId: req.timelineAdmin.id });
  } catch (error) {
    await storage.remove(storageKey).catch(() => {});
    throw error;
  }
  return { id, storageKey, reference: { url: `/api/timeline/images/${id}`, name: originalName, type: decoded.mime }, size: file.buffer.length, width: decoded.width, height: decoded.height };
}

export function createApp({ db, config, imageStorage = createImageStorage(config), loginLimiter = null, blobUploadHandler = handleUpload }) {
  const app = express();
  const repository = createTimelineRepository(db);
  const upload = imageUploadMiddleware(config);
  app.disable('x-powered-by');
  app.set('trust proxy', config.mode === 'production' ? 1 : false);
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });
  app.use(cookieParser());
  app.use(express.json({ limit: config.maxJsonBytes, type: 'application/json' }));

  const auth = adminSession(repository, config);
  app.use('/api/admin', auth);
  app.use('/api/auth/logout', auth);
  app.use('/api/auth/session', loadAdminSession(repository, config));
  app.use(csrfMiddleware(config));

  const usernameLimiter = createLimiter(60_000, 5, (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.username || '').trim().toLowerCase().slice(0, 80)}`);
  const ipLimiter = createLimiter(60_000, 20, (req) => ipKeyGenerator(req.ip));
  const sharedLimiter = config.mode === 'production'
    ? (loginLimiter || createSharedLoginLimiter({ url: config.upstashUrl, token: config.upstashToken, namespace: config.rateLimitNamespace }))
    : null;

  app.get('/api/auth/csrf', (_req, res) => {
    const csrfToken = makeCsrfToken(config.secret);
    setBootstrapCookie(res, config, csrfToken);
    res.json({ csrf_token: csrfToken });
  });

  app.post('/api/auth/login', ...(sharedLimiter ? [sharedLimiter] : [ipLimiter, usernameLimiter]), async (req, res, next) => {
    try {
      const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      const username = payload.username;
      const password = payload.password;
      if (typeof username !== 'string' || !USERNAME_PATTERN.test(username.trim()) || typeof password !== 'string' || password.length > 1024) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      const account = await repository.findAdminByUsername(username.trim());
      const hash = account?.password_hash || HASH_DUMMY;
      const accepted = await verifyWerkzeugScrypt(hash, password);
      if (!account || !account.is_active || !accepted) return res.status(401).json({ error: 'invalid_credentials' });
      const session = await setAdminSession(repository, config, account);
      setAuthCookie(res, 'timeline_admin_session', session.raw, config);
      res.clearCookie('timeline_csrf', { path: config.cookiePath || '/api', httpOnly: true, sameSite: 'lax', secure: config.secureCookies });
      res.json({ authenticated: true, admin: { id: account.id, username: account.username }, csrf_token: session.csrf });
    } catch (error) { next(error); }
  });

  app.get('/api/auth/session', (req, res) => {
    if (!req.timelineSession) return res.json({ authenticated: false });
    res.json({ authenticated: true, admin: req.timelineAdmin, csrf_token: req.timelineSession.csrf_token });
  });

  app.post('/api/auth/logout', async (req, res) => {
    await repository.deleteAdminSession(req.timelineSession.session_id);
    clearAuthCookie(res, 'timeline_admin_session', config);
    res.clearCookie('timeline_csrf', { path: config.cookiePath || '/api', httpOnly: true, sameSite: 'lax', secure: config.secureCookies });
    res.json({ authenticated: false });
  });

  app.get('/api/admin/ping', (req, res) => res.json({ ok: true, admin: req.timelineAdmin }));

  app.get('/api/timeline/settings', async (_req, res) => {
    const starfieldEnabled = await repository.starfieldEnabled();
    res.set('Cache-Control', 'no-store').json({ settings: { starfieldEnabled } });
  });

  app.put('/api/admin/timeline/settings', async (req, res) => {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).length !== 1 || typeof req.body.starfieldEnabled !== 'boolean') {
      return res.status(400).json({ error: 'invalid_timeline_settings', fields: { starfieldEnabled: 'Expected exactly one boolean starfieldEnabled field.' } });
    }
    await repository.setStarfieldEnabled(req.body.starfieldEnabled);
    res.set('Cache-Control', 'no-store').json({ settings: { starfieldEnabled: req.body.starfieldEnabled } });
  });

  app.get('/api/timeline/milestones', async (_req, res) => res.json({ milestones: await listMilestones(repository, true) }));
  app.get('/api/admin/timeline/milestones', async (_req, res) => res.json({ milestones: await listMilestones(repository) }));

  app.post('/api/admin/timeline/milestones', async (req, res) => {
    const { value, errors } = validateMilestonePayload(req.body);
    if (Object.keys(errors).length) return sendBad(res, errors);
    const imageError = await validateImages(repository, config, value.images || []);
    if (imageError) return sendBad(res, { images: imageError });
    const fields = setMilestone(value);
    try { return res.status(201).json({ milestone: serializeMilestone(await repository.createMilestone(fields)) }); }
    catch (error) { if (error.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'milestone_conflict' }); throw error; }
  });

  app.patch('/api/admin/timeline/milestones/:id', async (req, res) => {
    const id = validUuid(req.params.id);
    const existing = id && await repository.findMilestone(id);
    if (!existing) return res.status(404).json({ error: 'milestone_not_found' });
    const { value, errors } = validateMilestonePayload(req.body, { partial: true });
    if (Object.keys(errors).length) return sendBad(res, errors);
    if (!Object.keys(value).length) return sendBad(res, { body: 'Provide at least one field to update.' });
    const fields = setMilestone(value, existing);
    const imageError = await validateImages(repository, config, fields.images);
    if (imageError) return sendBad(res, { images: imageError });
    try { return res.json({ milestone: serializeMilestone(await repository.updateMilestone(id, fields), true) }); }
    catch (error) { if (error.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'milestone_conflict' }); throw error; }
  });

  app.delete('/api/admin/timeline/milestones/:id', async (req, res) => {
    const id = validUuid(req.params.id);
    if (!id || !await repository.deleteMilestone(id)) return res.status(404).json({ error: 'milestone_not_found' });
    res.json({ deleted: true });
  });

  app.post('/api/admin/timeline/milestones/reorder', async (req, res) => {
    const ids = req.body?.ids;
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).length !== 1 || !Array.isArray(ids)) return sendBad(res, { ids: 'Expected an object containing the complete ordered milestone ID list.' });
    if (ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length) return sendBad(res, { ids: 'IDs must be unique strings.' });
    const canonical = ids.map(validUuid);
    if (canonical.some((id) => !id) || new Set(canonical).size !== canonical.length) return sendBad(res, { ids: 'Every ID must be a valid unique milestone UUID.' });
    if (!await repository.reorderMilestones(canonical)) return sendBad(res, { ids: 'Provide every existing milestone ID exactly once.' });
    res.json({ ids: canonical });
  });

  app.post('/api/admin/timeline/images', upload.single('file'), async (req, res, next) => {
    if (!req.file) return sendBad(res, { file: 'Choose one image file.' });
    try {
      const image = await storeImage(repository, config, imageStorage, req, req.file);
      res.status(201).json({ image: { ...image.reference, size: image.size, width: image.width, height: image.height } });
    } catch (error) { if (error.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(400).json({ error: 'invalid_milestone', fields: { file: 'The upload could not be stored.' } }); next(error); }
  });

  // Vercel's 4.5 MB function payload limit requires browser-to-private-Blob uploads.
  // Only a currently authenticated administrator with valid CSRF can obtain the constrained token.
  if (imageStorage.kind === 'vercel-blob') {
    app.post('/api/admin/timeline/images/upload-token', async (req, res, next) => {
      try {
        if (req.body?.type !== 'blob.generate-client-token' || !/^[a-f0-9]{32}\.img$/.test(req.body?.payload?.pathname || '')) {
          return sendBad(res, { file: 'Invalid private upload request.' });
        }
        const result = await blobUploadHandler({ request: req, body: req.body,
          onBeforeGenerateToken: async (pathname) => {
            if (!/^[a-f0-9]{32}\.img$/.test(pathname)) throw new Error('Invalid Timeline image pathname.');
            return { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], maximumSizeInBytes: config.maxImageBytes, addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 60 };
          },
        });
        res.status(200).json(result);
      } catch (error) { next(error); }
    });
    app.post('/api/admin/timeline/images/finalize', async (req, res, next) => {
      try {
        const { pathname, originalName } = req.body || {};
        if (typeof pathname !== 'string' || !/^[a-f0-9]{32}\.img$/.test(pathname) || typeof originalName !== 'string') {
          return sendBad(res, { file: 'Invalid private upload reference.' });
        }
        const existing = await repository.findImageByStorageKey(pathname);
        if (existing) return res.status(409).json({ error: 'image_already_registered' });
        const bytes = await imageStorage.read(pathname);
        if (!bytes) return res.status(404).json({ error: 'image_not_found' });
        const image = await storeImage(repository, config, { ...imageStorage, put: async () => {} }, req,
          { buffer: bytes, originalname: originalName }, { storageKey: pathname });
        res.status(201).json({ image: { ...image.reference, size: image.size, width: image.width, height: image.height } });
      } catch (error) { next(error); }
    });
  }

  app.post('/api/admin/timeline/imports', upload.fields([{ name: 'photos', maxCount: 8 }]), async (req, res, next) => {
    try {
      let payload;
      try { payload = JSON.parse(req.body?.milestone || ''); } catch { return sendBad(res, { milestone: 'Provide a valid milestone JSON object.' }); }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return sendBad(res, { milestone: 'Expected a JSON object.' });
      const sourceId = payload.sourceId;
      if (typeof sourceId !== 'string' || !sourceId.trim() || sourceId.length > 255) return sendBad(res, { sourceId: 'A stable local source ID up to 255 characters is required.' });
      const old = await repository.findMilestoneBySourceId(sourceId.trim());
      if (old) return res.json({ imported: false, alreadyImported: true, milestone: serializeMilestone(old, true) });
      if (payload.isPublished !== undefined && typeof payload.isPublished !== 'boolean') return sendBad(res, { isPublished: 'Expected a boolean.' });
      const files = req.files?.photos || [];
      if (!Array.isArray(payload.images || []) || (payload.images || []).length + files.length > 8) return sendBad(res, { images: 'At most 8 image references/photos are allowed.' });
      delete payload.sourceId;
      payload.isPublished = false;
      const { value, errors } = validateMilestonePayload(payload);
      if (Object.keys(errors).length) return sendBad(res, errors);
      let fileBytes = 0;
      for (const file of files) { fileBytes += file.size; if (fileBytes > config.maxMilestoneImageBytes) return sendBad(res, { images: 'Keep combined photos under 40 MB per milestone.' }); }
      const saved = [];
      try {
        const refs = [...(value.images || [])];
        for (const file of files) { const image = await storeImage(repository, config, imageStorage, req, file); saved.push(image); refs.push(image.reference); }
        const fields = setMilestone({ ...value, images: refs });
        const imageError = await validateImages(repository, config, fields.images);
        if (imageError) throw Object.assign(new Error(imageError), { status: 400 });
        const milestone = await repository.createMilestone(fields, { sourceId: sourceId.trim() });
        return res.status(201).json({ imported: true, alreadyImported: false, milestone: serializeMilestone(milestone, true) });
      } catch (error) {
        for (const image of saved) { await repository.deleteImage(image.id); await imageStorage.remove(image.storageKey).catch(() => {}); }
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
          const existing = await repository.findMilestoneBySourceId(sourceId.trim());
          if (existing) return res.json({ imported: false, alreadyImported: true, milestone: serializeMilestone(existing, true) });
        }
        if (error.status === 400) return sendBad(res, { images: error.message });
        next(error);
      }
    } catch (error) { next(error); }
  });

  app.get('/api/timeline/images/:id', async (req, res, next) => {
    const id = validUuid(req.params.id);
    if (!id) return res.status(404).json({ error: 'image_not_found' });
    const image = await repository.findImage(id);
    if (!image || !/^[a-f0-9]{32}\.img$/.test(image.storage_key)) return res.status(404).json({ error: 'image_not_found' });
    const token = req.cookies?.timeline_admin_session;
    const session = token && await repository.findAdminSession(tokenDigest(token));
    const validAdmin = session && Date.parse(normalizeTimestamp(session.expires_at)) > Date.now() && session.is_active && Number(session.session_version) === Number(session.admin_session_version);
    if (!validAdmin) {
      const reference = `/api/timeline/images/${id}`;
      if (!await repository.isImagePublic(reference)) return res.status(404).json({ error: 'image_not_found' });
    }
    res.set('Content-Type', image.mime_type);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', imageStorage.kind === 'vercel-blob' || validAdmin ? 'private, no-store' : 'public, max-age=3600');
    if (imageStorage.kind === 'vercel-blob') {
      const signedUrl = await imageStorage.createReadUrl(image.storage_key);
      return res.redirect(302, signedUrl);
    }
    const bytes = await imageStorage.read(image.storage_key);
    if (!bytes) return res.status(404).json({ error: 'image_not_found' });
    res.send(bytes);
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 400 : 400;
      return res.status(status).json({ error: 'invalid_milestone', fields: { file: 'The upload is invalid or exceeds the Timeline limit.' } });
    }
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'request_too_large', message: 'Request body exceeds the Timeline API upload limit.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'invalid_json' });
    // Do not log request bodies, cookies, headers, SQL values, or database contents.
    console.error('Timeline Express request failed.');
    res.status(500).json({ error: 'internal_error' });
  });
  return app;
}
