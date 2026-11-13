import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('./TimelineAdmin.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./timeline.css', import.meta.url), 'utf8');
const modularCss = readFileSync(new URL('./timelineModular.css', import.meta.url), 'utf8');

test('starfield defaults off and follows a server-backed admin preference', () => {
  assert.match(app, /useState\(false\);[\s\S]*?activeStarfieldEnabled = starfieldDraft \?\? starfieldEnabled/);
  assert.match(app, /getPublicTimelineSettings\(\)/);
  assert.match(app, /updateAdminTimelineSettings\(/);
  assert.match(app, /if \(!activeStarfieldEnabled\) return undefined;/);
  assert.match(app, /activeStarfieldEnabled && \(/);
  assert.match(app, /onAdminStateChange=\{handleAdminStateChange\}/);
  assert.match(admin, /children\(\{ csrfToken, admin, expireSession \}\)/);
  assert.match(app, /timelineBackground\.js/);
});

test('page layout editor exposes the shared starfield switch only through admin controls', () => {
  const builder = readFileSync(new URL('./TimelinePageBuilder.jsx', import.meta.url), 'utf8');
  assert.match(builder, /Starfield background/);
  assert.match(builder, /onStarfieldChange\?\.\(event\.target\.checked\)/);
  assert.match(app, /starfieldEnabled=\{activeStarfieldEnabled\}/);
  assert.match(app, /onSave=\{\(\) => savePageDraft\(\{ csrfToken, expireSession \}\)\}/);
  assert.match(modularCss, /page-background-settings/);
});

test('milestone photos open a per-milestone keyboard and touch navigable viewer', () => {
  assert.match(app, /detail-gallery-trigger/);
  assert.match(app, /photo-viewer-backdrop/);
  assert.match(app, /viewerIndex \+ 1.*images\.length/);
  assert.match(app, /ArrowRight/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /onTouchStart/);
  assert.match(app, /onTouchEnd/);
  assert.match(app, /createPortal\(/);
  assert.match(css, /object-fit: contain/);
});

test('admin sign-in remains behind a closed panel and uses the subtle entry point', () => {
  assert.match(admin, /className="timeline-admin-entry"/);
  assert.match(admin, /panelOpen && <div className="timeline-admin-panel/);
  assert.match(admin, /onSubmit=\{signIn\}/);
  assert.match(css, /\.timeline-shell \.timeline-admin-entry\s*\{/);
});

test('Timeline navigation uses its dedicated glass navbar classes', () => {
  assert.match(app, /<nav className="timeline-site-nav"/);
  assert.match(app, /timeline-site-nav-brand/);
  assert.match(modularCss, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*backdrop-filter:/s);
  assert.doesNotMatch(app, /className=\{`nav glass/);
  const adminPanelIndex = admin.indexOf('className="timeline-admin-panel');
  const adminEntryIndex = admin.indexOf('className="timeline-admin-entry');
  assert.ok(adminPanelIndex >= 0 && adminEntryIndex > adminPanelIndex, 'Admin entry follows the panel at the bottom of the page');
  assert.match(css, /\.timeline-admin-preview\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /\.timeline-admin-entry\s*\{[^}]*position:\s*static/s);
  assert.doesNotMatch(css, /\.timeline-admin-entry\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /\.timeline-admin-preview\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.timeline-admin-entry\s*\{[^}]*align-self:\s*flex-end/s);
});

test('photo viewer uses an opaque stage and intrinsic image sizing', () => {
  assert.match(css, /\.photo-viewer-stage\s*\{[^}]*background:\s*#050508/s);
  assert.match(css, /\.photo-viewer-stage \.photo-viewer-image\s*\{[^}]*width:\s*auto/);
  assert.match(css, /object-fit:\s*contain/);
});
