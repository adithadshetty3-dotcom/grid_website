const AUTH_SESSION = '/api/auth/session';
const AUTH_CSRF = '/api/auth/csrf';
const AUTH_LOGIN = '/api/auth/login';
const AUTH_LOGOUT = '/api/auth/logout';
const ADMIN_MILESTONES = '/api/admin/timeline/milestones';
const PUBLIC_MILESTONES = '/api/timeline/milestones';

export function orderTimelineMilestones(items) {
  return [...items].sort((a, b) => {
    const aOrder = Number.isFinite(a.sortOrder);
    const bOrder = Number.isFinite(b.sortOrder);
    if (aOrder && bOrder) return a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);
    if (aOrder !== bOrder) return aOrder ? -1 : 1;
    return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '') || a.id.localeCompare(b.id);
  });
}

export function applyCanonicalMilestoneOrder(items, ids) {
  if (!Array.isArray(ids) || ids.length !== items.length || new Set(ids).size !== ids.length) {
    throw new Error('The Timeline API returned an invalid order.');
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids.map((id) => byId.get(id));
  if (ordered.some((item) => !item)) throw new Error('The Timeline API returned an unknown milestone ID in its order.');
  return ordered.map((item, sortOrder) => ({ ...item, sortOrder }));
}

export function milestonePayload(draft) {
  const images = (draft.images || []).filter((image) => image?.url && !image.blob)
    .map(({ url, name = '', type = '' }) => ({ url, name, type }));
  return {
    title: draft.title.trim(), category: draft.category, date: draft.date,
    time: draft.time || '', location: draft.location || '', summary: draft.summary.trim(),
    description: draft.description.trim(), images, isDemo: Boolean(draft.isDemo),
    isPublished: Boolean(draft.isPublished),
  };
}

async function jsonRequest(path, { method = 'GET', csrfToken, body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  const response = await fetch(path, {
    method, credentials: 'same-origin', headers,
    body: body === undefined ? undefined : JSON.stringify(body), signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || result.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.payload = result;
    throw error;
  }
  return result;
}

export async function restoreAdminSession() {
  const session = await jsonRequest(AUTH_SESSION);
  if (!session.authenticated) return { authenticated: false, admin: null, csrfToken: '' };
  if (!session.csrf_token) throw new Error('The authenticated session did not provide a CSRF token.');
  return { authenticated: true, admin: session.admin, csrfToken: session.csrf_token };
}

export async function loginAdmin(username, password) {
  const csrf = await jsonRequest(AUTH_CSRF);
  return jsonRequest(AUTH_LOGIN, {
    method: 'POST', csrfToken: csrf.csrf_token, body: { username, password },
  });
}

export const logoutAdmin = (csrfToken) => jsonRequest(AUTH_LOGOUT, { method: 'POST', csrfToken });
export async function listPublicMilestones() {
  const result = await jsonRequest(PUBLIC_MILESTONES);
  if (!Array.isArray(result.milestones) || result.milestones.some((item) => item?.isPublished !== true)) {
    throw new Error('The public Timeline API returned an invalid or unpublished milestone list.');
  }
  return result.milestones;
}
export const listAdminMilestones = () => jsonRequest(ADMIN_MILESTONES);
export const createAdminMilestone = (draft, csrfToken) => jsonRequest(ADMIN_MILESTONES, {
  method: 'POST', csrfToken, body: milestonePayload(draft),
});

export async function uploadAdminImage(file, csrfToken) {
  const body = new FormData();
  body.append('file', file, file.name || 'photo');
  const response = await fetch('/api/admin/timeline/images', {
    method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-CSRFToken': csrfToken }, body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || result.error || result.fields?.file || `Upload failed (${response.status}).`);
    error.status = response.status; error.payload = result; throw error;
  }
  if (!result.image?.url || !result.image?.name || !result.image?.type) throw new Error('The upload response is missing its server image reference.');
  return result.image;
}

export async function importLocalMilestone({ milestone, sourceId, photos }, csrfToken) {
  const body = new FormData();
  const images = (milestone.images || []).filter((image) => image?.url && !image.blob)
    .map(({ url, name = '', type = '' }) => ({ url, name, type }));
  body.append('milestone', JSON.stringify({ ...milestonePayload({ ...milestone, images }), images, sourceId, isPublished: false }));
  photos.forEach((photo) => body.append('photos', photo.blob || photo, photo.name || 'photo'));
  const response = await fetch('/api/admin/timeline/imports', {
    method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-CSRFToken': csrfToken }, body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || result.error || Object.values(result.fields || {})[0] || `Import failed (${response.status}).`);
    error.status = response.status; error.payload = result; throw error;
  }
  return result;
}
export const updateAdminMilestone = (id, draft, csrfToken) => jsonRequest(`${ADMIN_MILESTONES}/${encodeURIComponent(id)}`, {
  method: 'PATCH', csrfToken, body: milestonePayload(draft),
});
export const deleteAdminMilestone = (id, csrfToken) => jsonRequest(`${ADMIN_MILESTONES}/${encodeURIComponent(id)}`, {
  method: 'DELETE', csrfToken,
});
export const reorderAdminMilestones = (ids, csrfToken) => jsonRequest(`${ADMIN_MILESTONES}/reorder`, {
  method: 'POST', csrfToken, body: { ids },
});
