import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimelineSiteNavigation } from './timelineSiteNavigation.js';

const parentPaths = [
  '/index.html',
  '/aboutus.html',
  '/team.html',
  null,
  '/FAQ/FAQ.html',
  '/ContactUs.html',
];

test('default navigation uses same-origin paths from the completed static GRID site', () => {
  const items = createTimelineSiteNavigation('', '/timeline/');
  assert.deepEqual(items.map(({ href }) => href), [
    '/index.html',
    '/aboutus.html',
    '/team.html',
    '/timeline/',
    '/FAQ/FAQ.html',
    '/ContactUs.html',
  ]);
  assert.equal(items[3].current, true);
});

test('configured parent URL sends parent pages to that origin and leaves Timeline in its app', () => {
  const items = createTimelineSiteNavigation('https://grid.example/', '/timeline/');
  assert.deepEqual(items.map(({ href }) => href), [
    'https://grid.example/index.html',
    'https://grid.example/aboutus.html',
    'https://grid.example/team.html',
    '/timeline/',
    'https://grid.example/FAQ/FAQ.html',
    'https://grid.example/ContactUs.html',
  ]);
  assert.deepEqual(items.filter((item) => !item.current).map((item) => new URL(item.href).pathname), parentPaths.filter(Boolean));
});


test('parent navigation entries remain disabled until a parent URL is configured', () => {
  const items = createTimelineSiteNavigation('', '/timeline/');
  assert.deepEqual(
    items.filter((item) => !item.current).map((item) => item.disabled),
    [true, true, true, true, true],
  );
  assert.equal(items.find((item) => item.current).disabled, false);
});

test('parent navigation entries become active when the main GRID URL is configured', () => {
  const items = createTimelineSiteNavigation('https://grid.example/', '/timeline/');
  assert.deepEqual(
    items.filter((item) => !item.current).map((item) => item.disabled),
    [false, false, false, false, false],
  );
});

test('published GRID navigation uses the supplied parent-site URLs', () => {
  const items = createTimelineSiteNavigation('https://grid-website-two.vercel.app', '/');
  assert.deepEqual(items.map(({ href }) => href), [
    'https://grid-website-two.vercel.app/index.html',
    'https://grid-website-two.vercel.app/aboutus.html',
    'https://grid-website-two.vercel.app/team.html',
    '/',
    'https://grid-website-two.vercel.app/FAQ/FAQ.html',
    'https://grid-website-two.vercel.app/ContactUs.html',
  ]);
  assert.equal(items[3].current, true);
  assert.ok(items.every((item) => item.current || !item.disabled));
});
