import { randomUUID } from 'node:crypto';

export const CATEGORIES = new Set(['Events', 'Workshops', 'Achievements', 'Projects', 'Community']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const WRITABLE = new Set(['title', 'category', 'date', 'time', 'location', 'summary', 'description', 'images', 'isDemo', 'isPublished']);
const REQUIRED = ['title', 'category', 'date', 'summary', 'description'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeDateTime(value) {
  if (!value) return new Date().toISOString().replace('T', ' ').replace('Z', '');
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return String(value);
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

export function timestamp(value) {
  const normalized = typeof value === 'string' && !value.includes('T') ? `${value.replace(' ', 'T')}Z` : value;
  const date = new Date(normalized);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
}

export function serializeMilestone(row, includeSource = false) {
  const result = {
    id: row.id, title: row.title, category: row.category, date: row.date,
    time: row.time || '', location: row.location || '', summary: row.summary,
    description: row.description, images: parseJson(row.images, []),
    isDemo: Boolean(row.is_demo), isPublished: Boolean(row.is_published),
    sortOrder: row.sort_order, createdAt: timestamp(row.created_at), updatedAt: timestamp(row.updated_at),
  };
  if (includeSource && row.source_id) result.sourceId = row.source_id;
  return result;
}

export function parseJson(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function validDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validImageReference(image) {
  if (!image || typeof image !== 'object' || Array.isArray(image) || Object.keys(image).some((key) => !['url', 'name', 'type'].includes(key))) return false;
  const { url, name = '', type = '' } = image;
  if (typeof url !== 'string' || !url || url.length > 2048 || /[\\\u0000-\u001f]/.test(url) || url.startsWith('//')) return false;
  let parsed;
  try { parsed = new URL(url, 'https://timeline.invalid'); } catch { return false; }
  const isSameOriginPath = url.startsWith('/') && !url.startsWith('//');
  if (parsed.username || parsed.password) return false;
  if (parsed.origin === 'https://timeline.invalid') {
    if (!isSameOriginPath) return false;
  } else if (parsed.protocol !== 'https:' || !parsed.hostname) return false;
  let rawPath = url.split(/[?#]/, 1)[0];
  if (/^https:\/\//i.test(rawPath)) {
    const slash = rawPath.indexOf('/', 8);
    rawPath = slash < 0 ? '/' : rawPath.slice(slash);
  }
  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { return false; }
  if (decoded.split('/').some((part) => part === '.' || part === '..')) return false;
  if (typeof name !== 'string' || name.length > 255 || typeof type !== 'string' || (type && !IMAGE_TYPES.has(type.toLowerCase()))) return false;
  const file = name || decoded.split('/').at(-1) || '';
  const extension = file.includes('.') ? file.split('.').at(-1).toLowerCase() : '';
  return !extension || EXTENSIONS.has(extension);
}

export function validateMilestonePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { value: null, errors: { body: 'Expected a JSON object.' } };
  const errors = {};
  for (const key of Object.keys(payload)) if (!WRITABLE.has(key)) errors[key] = 'This field is not accepted.';
  if (!partial) for (const key of REQUIRED) if (!(key in payload)) errors[key] = 'This field is required.';
  const value = {};
  for (const [key, input] of Object.entries(payload)) {
    if (!WRITABLE.has(key)) continue;
    if (['title', 'summary', 'description', 'location', 'time'].includes(key)) {
      if (typeof input !== 'string') { errors[key] = 'Expected text.'; continue; }
      const cleaned = input.trim();
      const max = { title: 90, summary: 180, description: 6000, location: 100, time: 5 }[key];
      if (cleaned.length > max) { errors[key] = `Must be no more than ${max} characters.`; continue; }
      if (REQUIRED.includes(key) && !cleaned) { errors[key] = 'This field cannot be blank.'; continue; }
      if (key === 'time' && cleaned && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cleaned)) { errors[key] = 'Expected a 24-hour HH:MM time.'; continue; }
      value[key] = cleaned;
    } else if (key === 'category') {
      if (typeof input !== 'string' || !CATEGORIES.has(input)) errors[key] = 'Choose one of the supported Timeline categories.';
      else value[key] = input;
    } else if (key === 'date') {
      if (typeof input !== 'string' || !validDate(input)) errors[key] = 'Expected a real calendar date in YYYY-MM-DD format.';
      else value[key] = input;
    } else if (key === 'isDemo' || key === 'isPublished') {
      if (typeof input !== 'boolean') errors[key] = 'Expected a boolean.';
      else value[key] = input;
    } else if (key === 'images') {
      if (!Array.isArray(input)) errors[key] = 'Expected a list of image references.';
      else if (input.length > 8) errors[key] = 'At most 8 image references are allowed.';
      else if (input.some((image) => !validImageReference(image))) errors[key] = 'Each image must use a safe HTTPS or same-origin path reference and supported image metadata.';
      else value[key] = input.map(({ url, name = '', type = '' }) => ({ url, name, type }));
    }
  }
  return Object.keys(errors).length ? { value: null, errors } : { value, errors: {} };
}

export function validUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) return null;
  return value.toLowerCase();
}

export function newUuid() { return randomUUID(); }
export function imageIdFromUrl(url) {
  const match = /^\/api\/timeline\/images\/([0-9a-f-]{36})$/.exec(url || '');
  return match ? validUuid(match[1]) : null;
}
