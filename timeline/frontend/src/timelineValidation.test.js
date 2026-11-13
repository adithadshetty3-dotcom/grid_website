import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PHOTO_SIZE,
  MAX_PHOTOS,
  MAX_TOTAL_PHOTO_SIZE,
  getStorageErrorMessage,
  isSupportedImage,
  normalizeTimeValue,
  validateMilestoneDraft,
} from './timelineValidation.js';

const validDraft = {
  title: 'GRID Project Showcase',
  category: 'Projects',
  date: '2025-03-22',
  time: '10:30',
  location: 'KSSEM Campus',
  summary: 'Students shared prototypes and project ideas.',
  description: 'A verified milestone description with useful context.',
};

test('accepts a complete valid milestone', () => {
  assert.equal(validateMilestoneDraft(validDraft), null);
});

test('rejects an impossible calendar date', () => {
  assert.match(validateMilestoneDraft({ ...validDraft, date: '2025-02-30' }), /valid date/i);
});

test('normalizes native, legacy and 12-hour time values to API format', () => {
  assert.equal(normalizeTimeValue('09:30'), '09:30');
  assert.equal(normalizeTimeValue('9:30'), '09:30');
  assert.equal(normalizeTimeValue('9:30 PM'), '21:30');
  assert.equal(normalizeTimeValue('12:15 AM'), '00:15');
  assert.equal(normalizeTimeValue('12:15 PM'), '12:15');
  assert.equal(normalizeTimeValue('18:45:00'), '18:45');
  assert.equal(normalizeTimeValue(''), '');
  assert.equal(normalizeTimeValue('27:75'), null);
});

test('accepts a valid legacy time and still rejects malformed values', () => {
  assert.equal(validateMilestoneDraft({ ...validDraft, time: '9:30 PM' }), null);
  assert.match(validateMilestoneDraft({ ...validDraft, time: '27:75' }), /valid time/i);
});

test('rejects categories outside the supported list', () => {
  assert.match(validateMilestoneDraft({ ...validDraft, category: 'Unverified' }), /category/i);
});

test('requires both a card summary and full description', () => {
  assert.match(validateMilestoneDraft({ ...validDraft, summary: '  ' }), /short description/i);
  assert.match(validateMilestoneDraft({ ...validDraft, description: '  ' }), /full milestone/i);
});

test('enforces the full-description character limit', () => {
  assert.match(validateMilestoneDraft({ ...validDraft, description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1) }), /characters/i);
});

test('accepts supported raster images and rejects SVG', () => {
  assert.equal(isSupportedImage({ name: 'photo.webp', type: 'image/webp' }), true);
  assert.equal(isSupportedImage({ name: 'photo.svg', type: 'image/svg+xml' }), false);
  assert.equal(isSupportedImage({ name: 'photo.png', type: '' }), true);
});

test('enforces the photo count limit', () => {
  const existingImages = Array.from({ length: MAX_PHOTOS }, () => ({ blob: { size: 1 } }));
  assert.match(validateMilestoneDraft(validDraft, existingImages, [{ name: 'extra.png', type: 'image/png', size: 1 }]), /up to 8 photos/i);
});

test('enforces per-photo and combined photo size limits', () => {
  assert.ok(MAX_PHOTO_SIZE > 0 && MAX_TOTAL_PHOTO_SIZE > MAX_PHOTO_SIZE);
  assert.match(validateMilestoneDraft(validDraft, [], [{ name: 'large.jpg', type: 'image/jpeg', size: MAX_PHOTO_SIZE + 1 }]), /10 MB/i);
  const tooLargeTotal = [{ blob: { size: MAX_TOTAL_PHOTO_SIZE } }];
  assert.match(validateMilestoneDraft(validDraft, tooLargeTotal, [{ name: 'small.jpg', type: 'image/jpeg', size: 1 }]), /40 MB/i);
});

test('translates browser storage quota errors into a useful message', () => {
  assert.match(getStorageErrorMessage({ name: 'QuotaExceededError' }, 'fallback'), /running low on storage/i);
});
