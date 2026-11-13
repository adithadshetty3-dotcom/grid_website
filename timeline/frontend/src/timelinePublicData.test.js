import test from 'node:test';
import assert from 'node:assert/strict';
import { localMilestoneSourceId, mergeTimelineMilestones } from './timelinePublicData.js';

function milestone(id, date, extra = {}) {
  return { id, title: id, date, summary: '', description: '', images: [], ...extra };
}

test('merges published server milestones and legacy local rows without mutating either source', () => {
  const blob = new Blob(['legacy-photo']);
  const local = [milestone('legacy-only', '2019-02-03', { images: [{ blob, name: 'old.png' }] })];
  const published = [milestone('server-id', '2026-01-02', { isPublished: true, sortOrder: 0, createdAt: 'created', updatedAt: 'updated' })];
  const merged = mergeTimelineMilestones(local, published);
  assert.deepEqual(merged.map((item) => item.id), ['server-id', 'legacy-only']);
  assert.equal(local[0].images[0].blob, blob);
  assert.equal(published[0].createdAt, 'created');
});

test('drafts stay hidden, imported local copies use canonical server rows, and legacy-only rows remain visible', () => {
  const sourceId = localMilestoneSourceId('local-7');
  const local = [
    milestone('local-7', '2020-01-01', { images: [{ blob: new Blob(['old']), name: 'old.jpg' }] }),
    milestone('unimported-local', '2021-01-01'),
  ];
  const published = [
    milestone('canonical-server-7', '2020-01-01', { isPublished: true, sortOrder: 0, sourceId, images: [{ url: '/api/timeline/images/photo-id', name: 'new.jpg', type: 'image/jpeg' }] }),
    milestone('draft', '2022-01-01', { isPublished: false, sortOrder: 1 }),
  ];
  const merged = mergeTimelineMilestones(local, published);
  assert.deepEqual(merged.map((item) => item.id), ['canonical-server-7', 'unimported-local']);
  assert.equal(merged[0].images[0].url, '/api/timeline/images/photo-id');
  assert.equal(local.length, 2);
  assert.equal(local[0].images[0].blob.size, 3);
});

test('server sortOrder is preserved for server records and local-only records use chronological order', () => {
  const merged = mergeTimelineMilestones(
    [milestone('local-late', '2018-01-01'), milestone('local-early', '2017-01-01')],
    [milestone('server-second', '2010-01-01', { isPublished: true, sortOrder: 1 }), milestone('server-first', '2020-01-01', { isPublished: true, sortOrder: 0 })],
  );
  assert.deepEqual(merged.map((item) => item.id), ['server-first', 'server-second', 'local-early', 'local-late']);
});
