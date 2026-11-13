import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const [admin, app, css] = await Promise.all([
  readFile(path.join(here, 'TimelineAdmin.jsx'), 'utf8'),
  readFile(path.join(here, 'App.jsx'), 'utf8'),
  readFile(path.join(here, 'timeline.css'), 'utf8'),
]);

test('admin editing controls render only after backend session confirmation', () => {
  assert.match(admin, /restoreAdminSession\(\)/);
  assert.match(admin, /!admin \? <form className="timeline-admin-login"/);
  assert.match(admin, /typeof children === 'function' \? children\(\{ csrfToken, admin, expireSession \}\) : children/);
  assert.match(app, /isAdmin=\{false\}/);
  assert.doesNotMatch(admin, /localStorage|sessionStorage/);
});

test('responsive admin layout remains scoped and adapts forms and milestone actions on phones', () => {
  const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
  for (const selector of selectors.filter((item) => item.includes('timeline-admin'))) {
    assert.match(selector, /\.timeline-shell/);
  }
  assert.match(css, /\.timeline-shell \.timeline-admin-tools\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(140px, \.35fr\) auto/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-admin-tools\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-admin-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-admin-item-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
});

test('public Timeline remains on existing browser content and never fetches admin drafts', () => {
  assert.match(app, /loadMilestones\(\)/);
  assert.match(admin, /listAdminMilestones\(\)/);
  assert.doesNotMatch(app, /listAdminMilestones\(/);
});

test('authenticated admin reuses the original full MilestoneEditor and its upload behavior', () => {
  assert.match(app, /function MilestoneEditor\(/);
  assert.match(app, /className="editor-panel editor-dialog liquid-glass"/);
  assert.match(app, /className="editor-form-scroll"/);
  assert.match(app, /className="upload-field liquid-glass"/);
  assert.match(app, /className="editor-photo-grid"/);
  assert.match(app, /className="form-actions editor-form-footer"/);
  assert.match(app, /multiple onChange=\{handleImageChange\}/);
  assert.match(app, /<TimelineAdmin[\s\S]*?MilestoneEditorComponent=\{MilestoneEditor\}/);
  assert.match(admin, /<MilestoneEditorComponent/);
});

test('existing browser records are reviewed read-only and imported only by explicit admin action', async () => {
  const repository = await readFile(path.join(here, 'timelineRepository.js'), 'utf8');
  assert.match(repository, /export async function inspectLocalMilestones/);
  assert.match(repository, /database\.transaction\(STORE_NAME, 'readonly'\)/);
  assert.match(repository, /export function countLocalMilestonePhotos/);
  assert.match(admin, /Review local data/);
  assert.match(admin, /Import selected as drafts/);
  assert.match(admin, /Original browser records and photos were kept/);
  assert.doesNotMatch(admin, /removeMilestone\(|saveMilestone\(/);
});

test('editor portal escapes the glass dashboard containing block and tracks the visual viewport', () => {
  assert.match(app, /import \{ createPortal \} from 'react-dom'/);
  assert.match(app, /createPortal\([\s\S]*?document\.body/);
  assert.match(app, /visualViewport\?\.height[\s\S]*?visualViewport\?\.offsetTop/);
  assert.match(css, /\.timeline-shell\.timeline-editor-portal\s*\{[^}]*isolation:\s*auto/s);
  assert.match(css, /\.timeline-shell\.timeline-editor-portal \.editor-modal-backdrop\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /@media \(max-height: 500px\) and \(orientation: landscape\)[\s\S]*?\.timeline-shell\.timeline-editor-portal \.editor-dialog/s);
  assert.match(css, /\.timeline-shell \.editor-form-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.timeline-shell \.form-actions\s*\{[^}]*flex:\s*0 0 auto/s);
});

test('public app merges local fallback with published API data and admin mutations refresh public state', () => {
  assert.match(app, /loadMilestones\(\{ seedWhenEmpty: false \}\)/);
  assert.match(app, /listPublicMilestones\(\)/);
  assert.match(app, /mergeTimelineMilestones\(localMilestones, publishedMilestones\)/);
  assert.match(admin, /onPublicMilestonesChange\?\.\(\)/);
  assert.match(admin, /await refreshAfterMutation\(\)/);
  assert.match(admin, /DRAFT — HIDDEN PUBLICLY/);
  assert.match(admin, /draft\. Publish it to show it on the public Timeline/);
  assert.match(app, /URL\.createObjectURL\(image\.blob\)/);
  assert.match(app, /src=\{timelineImageUrl\(image\.url\)\}/);
});
