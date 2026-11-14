import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const navCss = readFileSync(new URL('./timelineModular.css', import.meta.url), 'utf8');
const pageCss = readFileSync(new URL('./timeline.css', import.meta.url), 'utf8');
const navSource = readFileSync(new URL('./timelineSiteNavigation.js', import.meta.url), 'utf8');

test('mobile GRID navigation is collapsed behind an accessible hamburger button', () => {
  assert.match(app, /const \[mobileNavOpen, setMobileNavOpen\] = useState\(false\)/);
  assert.match(app, /aria-expanded=\{mobileNavOpen\}/);
  assert.match(app, /aria-controls="timeline-site-nav-links"/);
  assert.match(app, /setMobileNavOpen\(\(open\) => !open\)/);
  assert.match(navCss, /\.timeline-site-nav-links\.is-open\s*\{\s*display:\s*flex/s);
  assert.match(navCss, /\.timeline-site-nav-toggle\s*\{\s*display:\s*inline-flex/s);
});

test('mobile navbar metrics match the shared GRID styling and dropdown behavior', () => {
  const mobileNav = navCss.slice(navCss.indexOf('@media (max-width: 760px)'));
  const navRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(navRule, /top:\s*var\(--space-2, 1rem\)/);
  assert.match(navRule, /width:\s*calc\(100% - 2rem\)/);
  assert.match(navRule, /padding:\s*0\.75rem 1\.25rem/);
  assert.match(navRule, /border-radius:\s*var\(--radius-lg, 20px\)/);

  const toggleRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav-toggle\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(toggleRule, /padding:\s*5px/);
  assert.match(app, /width="22" height="22"/);

  const dropdownRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav-links\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(dropdownRule, /display:\s*none/);
  assert.match(dropdownRule, /position:\s*absolute/);
  assert.match(dropdownRule, /top:\s*calc\(100% \+ 12px\)/);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav-links\.is-open\s*\{[^}]*display:\s*flex/s);
  assert.match(navSource, /Meet the Team/);
  assert.match(navSource, /FAQs/);
});

test('year and category filters stay in normal page flow', () => {
  const filters = pageCss.match(/\.timeline-shell \.timeline-filters\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(filters, /position:\s*relative/);
  assert.doesNotMatch(filters, /position:\s*sticky/);
});

test('event gallery preserves full photos and cannot flex-shrink into a strip', () => {
  const gallery = pageCss.match(/\.timeline-shell \.detail-gallery\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(gallery, /flex:\s*0 0 auto/);
  assert.match(gallery, /overflow-y:\s*auto/);
  const imageRule = pageCss.match(/\.timeline-shell \.detail-gallery img,[\s\S]*?\.detail-gallery \.photo-placeholder\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(imageRule, /object-fit:\s*contain/);
  assert.match(pageCss, /\.timeline-shell \.detail-gallery-trigger img,[\s\S]*?object-fit:\s*contain/s);
});
