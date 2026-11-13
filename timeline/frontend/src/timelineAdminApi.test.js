import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCanonicalMilestoneOrder, createAdminMilestone, deleteAdminMilestone, importLocalMilestone, listAdminMilestones, loginAdmin,
  listPublicMilestones, getPublicTimelineSettings, updateAdminTimelineSettings, logoutAdmin, milestonePayload, orderTimelineMilestones, reorderAdminMilestones,
  restoreAdminSession, updateAdminMilestone,
  normalizeTimelineApiBase, timelineApiPath, timelineImageUrl,
} from './timelineAdminApi.js';

const originalFetch = globalThis.fetch;

function mockFetch(routes) {
  const calls = [];
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    const result = typeof routes === 'function' ? routes(path, options) : routes[path];
    if (!result) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify(result.body), { status: result.status || 200, headers: { 'Content-Type': 'application/json' } });
  };
  return calls;
}

test.afterEach(() => { globalThis.fetch = originalFetch; });

test('Timeline API and managed image paths support a safe same-origin host prefix', () => {
  assert.equal(normalizeTimelineApiBase('/timeline-api/'), '/timeline-api');
  assert.equal(timelineApiPath('/api/auth/session', '/timeline-api/'), '/timeline-api/api/auth/session');
  assert.equal(timelineImageUrl('/api/timeline/images/00000000-0000-4000-8000-000000000001', '/timeline-api'), '/timeline-api/api/timeline/images/00000000-0000-4000-8000-000000000001');
  assert.throws(() => normalizeTimelineApiBase('https://other.example'), /same-origin/);
  assert.throws(() => normalizeTimelineApiBase('//other.example'), /same-origin/);
  assert.throws(() => normalizeTimelineApiBase('/api/../elsewhere'), /same-origin/);
});

test('restores an authenticated session and its session-bound CSRF token without exposing credentials', async () => {
  mockFetch({ '/api/auth/session': { body: { authenticated: true, admin: { id: 'admin-1', username: 'grid-admin' }, csrf_token: 'csrf-memory-only' } } });
  const session = await restoreAdminSession();
  assert.equal(session.authenticated, true);
  assert.equal(session.csrfToken, 'csrf-memory-only');
  assert.deepEqual(session.admin, { id: 'admin-1', username: 'grid-admin' });
});

test('pre-login fetches CSRF and sends credentials without persistence', async () => {
  const calls = mockFetch({
    '/api/auth/csrf': { body: { csrf_token: 'prelogin-token' } },
    '/api/auth/login': { body: { authenticated: true, admin: { id: 'a', username: 'admin' }, csrf_token: 'session-token' } },
  });
  const result = await loginAdmin('admin', 'password');
  assert.equal(result.csrf_token, 'session-token');
  assert.equal(calls[1].options.headers['X-CSRFToken'], 'prelogin-token');
  assert.equal(calls[1].options.credentials, 'same-origin');
  assert.equal(Object.hasOwn(calls[1].options, 'credentialsStorage'), false);
});

test('API payload normalizes valid times and excludes server-owned values', () => {
  const payload = milestonePayload({
    id: 'server-id', createdAt: 'server-time', updatedAt: 'server-time', sortOrder: 7,
    title: ' Test ', category: 'Events', date: '2026-01-02', time: '9:30 PM', summary: ' Summary ', description: ' Body ',
    images: [{ url: 'https://example.org/photo.jpg', name: 'photo.jpg', type: 'image/jpeg' }, { blob: new Blob(['photo']), name: 'local.jpg' }],
    isPublished: true,
  });
  assert.equal(payload.title, 'Test');
  assert.equal(payload.time, '21:30');
  assert.deepEqual(payload.images, [{ url: 'https://example.org/photo.jpg', name: 'photo.jpg', type: 'image/jpeg' }]);
  for (const key of ['id', 'createdAt', 'updatedAt', 'sortOrder']) assert.equal(Object.hasOwn(payload, key), false);
});

test('admin client calls list, create, edit, delete, reorder with CSRF on writes', async () => {
  const calls = mockFetch((path, options) => ({ body: { milestones: [] } }));
  await listAdminMilestones();
  await createAdminMilestone({ title: 'T', category: 'Events', date: '2026-01-01', summary: 'S', description: 'D' }, 'csrf');
  await updateAdminMilestone('server/id', { title: 'T', category: 'Events', date: '2026-01-01', summary: 'S', description: 'D' }, 'csrf');
  await deleteAdminMilestone('id', 'csrf');
  await reorderAdminMilestones(['id'], 'csrf');
  assert.deepEqual(calls.map(({ path, options }) => [options.method || 'GET', path]), [
    ['GET', '/api/admin/timeline/milestones'],
    ['POST', '/api/admin/timeline/milestones'],
    ['PATCH', '/api/admin/timeline/milestones/server%2Fid'],
    ['DELETE', '/api/admin/timeline/milestones/id'],
    ['POST', '/api/admin/timeline/milestones/reorder'],
  ]);
  for (const call of calls.slice(1)) assert.equal(call.options.headers['X-CSRFToken'], 'csrf');
  assert.deepEqual(JSON.parse(calls[4].options.body), { ids: ['id'] });
});

test('logout sends the restored session CSRF token and 401 errors remain detectable', async () => {
  const calls = mockFetch({ '/api/auth/logout': { body: { authenticated: false } } });
  await logoutAdmin('session-csrf');
  assert.equal(calls[0].options.headers['X-CSRFToken'], 'session-csrf');
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'authentication_required' }), { status: 401 });
  await assert.rejects(listAdminMilestones(), (error) => error.status === 401);
});

test('API milestones use server order while legacy records retain chronological fallback', () => {
  const sorted = orderTimelineMilestones([
    { id: 'later', date: '2020-01-01', sortOrder: 2 },
    { id: 'earlier-date', date: '2010-01-01' },
    { id: 'first', date: '2025-01-01', sortOrder: 1 },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ['first', 'later', 'earlier-date']);
  const legacy = orderTimelineMilestones([
    { id: 'b', date: '2025-02-01' }, { id: 'a', date: '2024-02-01' },
  ]);
  assert.deepEqual(legacy.map((item) => item.id), ['a', 'b']);
});

test('manual reorder applies the server canonical ID order and rejects incomplete responses', () => {
  const items = [{ id: 'one', sortOrder: 0 }, { id: 'two', sortOrder: 1 }];
  assert.deepEqual(applyCanonicalMilestoneOrder(items, ['two', 'one']).map(({ id, sortOrder }) => [id, sortOrder]), [['two', 0], ['one', 1]]);
  assert.throws(() => applyCanonicalMilestoneOrder(items, ['two']), /invalid order/);
  assert.throws(() => applyCanonicalMilestoneOrder(items, ['two', 'missing']), /unknown milestone ID/);
});

test('local Blob import sends photos as multipart files and keeps JSON free of Blob data', async () => {
  let call;
  globalThis.fetch = async (path, options) => {
    call = { path, options };
    return new Response(JSON.stringify({ imported: true, milestone: { id: 'server-id' } }), { status: 201 });
  };
  const photo = new Blob(['photo-bytes'], { type: 'image/png' });
  await importLocalMilestone({
    milestone: { id: 'old-id', title: 'Local record', category: 'Events', date: '2025-01-01', summary: 'Summary', description: 'Details', images: [{ blob: photo, name: 'local.png', type: 'image/png' }] },
    sourceId: 'grid-timeline-pilot:indexeddb:v1:old-id',
    photos: [{ blob: photo, name: 'local.png' }],
  }, 'csrf-token');
  assert.equal(call.path, '/api/admin/timeline/imports');
  assert.equal(call.options.headers['X-CSRFToken'], 'csrf-token');
  assert.equal(call.options.credentials, 'same-origin');
  const payload = JSON.parse(call.options.body.get('milestone'));
  assert.equal(payload.id, undefined);
  assert.equal(payload.sourceId, 'grid-timeline-pilot:indexeddb:v1:old-id');
  assert.equal(payload.isPublished, false);
  assert.equal(payload.images.length, 0);
  assert.equal(call.options.body.getAll('photos').length, 1);
  assert.equal(call.options.body.getAll('photos')[0].name, 'local.png');
});

test('public Timeline settings validate the shared starfield preference', async () => {
  const calls = mockFetch({ '/api/timeline/settings': { body: { settings: { starfieldEnabled: true } } } });
  assert.deepEqual(await getPublicTimelineSettings(), { starfieldEnabled: true });
  assert.equal(calls[0].path, '/api/timeline/settings');

  globalThis.fetch = async () => new Response(JSON.stringify({ settings: { starfieldEnabled: 'on' } }), { status: 200 });
  await assert.rejects(getPublicTimelineSettings(), /invalid background settings/);
});

test('admin saves the shared starfield preference with PUT and the session CSRF token', async () => {
  const calls = mockFetch({ '/api/admin/timeline/settings': { body: { settings: { starfieldEnabled: true } } } });
  assert.deepEqual(await updateAdminTimelineSettings({ starfieldEnabled: true }, 'session-csrf'), { starfieldEnabled: true });
  assert.equal(calls[0].path, '/api/admin/timeline/settings');
  assert.equal(calls[0].options.method, 'PUT');
  assert.equal(calls[0].options.headers['X-CSRFToken'], 'session-csrf');
  assert.deepEqual(JSON.parse(calls[0].options.body), { starfieldEnabled: true });
  await assert.rejects(updateAdminTimelineSettings({ starfieldEnabled: 'yes' }, 'csrf'), /boolean/);
});

test('public client fetches published milestones and rejects malformed or draft-bearing responses', async () => {
  const calls = mockFetch({ '/api/timeline/milestones': { body: { milestones: [{ id: 'published', isPublished: true, sortOrder: 0 }] } } });
  assert.equal((await listPublicMilestones())[0].id, 'published');
  assert.equal(calls[0].path, '/api/timeline/milestones');
  globalThis.fetch = async () => new Response(JSON.stringify({ milestones: [{ id: 'draft', isPublished: false }] }), { status: 200 });
  await assert.rejects(listPublicMilestones(), /unpublished milestone list/);
  globalThis.fetch = async () => { throw new Error('network offline'); };
  await assert.rejects(listPublicMilestones(), /network offline/);
});
