import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const [app, builder, css, baseCss] = await Promise.all([
  readFile(path.join(here, 'App.jsx'), 'utf8'),
  readFile(path.join(here, 'TimelinePageBuilder.jsx'), 'utf8'),
  readFile(path.join(here, 'timelineModular.css'), 'utf8'),
  readFile(path.join(here, 'timeline.css'), 'utf8'),
]);

test('Timeline page is rendered from ordered, enabled page widgets', () => {
  assert.match(app, /visiblePageWidgets\.map\(\(widget\) =>/);
  assert.match(app, /widget\.type === 'hero'/);
  assert.match(app, /widget\.type === 'intro'/);
  assert.match(app, /widget\.type === 'timeline'/);
  assert.match(app, /widget\.type === 'text'/);
  assert.match(app, /widget\.type === 'quote'/);
  assert.match(app, /widget\.type === 'footer'/);
  assert.match(app, /activePageConfig\.widgets\.filter\(\(widget\) => widget\.enabled\)/);
});

test('admin preview can edit, reorder, hide, add and remove page widgets', () => {
  assert.match(app, /<TimelinePageBuilder/);
  assert.match(app, /onContentChange=\{changeWidgetContent\}/);
  assert.match(app, /onEnabledChange=\{changeWidgetEnabled\}/);
  assert.match(app, /onMove=\{moveWidget\}/);
  assert.match(app, /onRemove=\{removeWidget\}/);
  assert.match(app, /onAdd=\{addWidget\}/);
  assert.match(builder, /Move .* up/);
  assert.match(builder, /Move .* down/);
  assert.match(builder, /onEnabledChange\(widget\.id, !widget\.enabled\)/);
  assert.match(builder, /onAdd\('text'\)/);
  assert.match(builder, /onAdd\('quote'\)/);
  assert.match(builder, /onRemove\(widget\.id\)/);
});

test('admin can choose and save vertical or horizontal orientation', () => {
  assert.match(builder, /value="vertical"/);
  assert.match(builder, /value="horizontal"/);
  assert.match(app, /onLayoutChange=\{changePageLayout\}/);
  assert.match(app, /activePageConfig\.layout === 'horizontal'/);
  assert.match(app, /saveTimelinePageConfig\(pageDraft \|\| pageConfig\)/);
  assert.match(app, /localStorage|loadTimelinePageConfig/);
});

test('horizontal mode renders one chronological swipeable rail with keyboard focus and arrow controls', () => {
  assert.match(app, /className="timeline-horizontal-track" tabIndex=\{0\}/);
  assert.match(app, /aria-label="Horizontally scrolling GRID milestones"/);
  assert.match(app, /scrollHorizontalTrack\(-1\)/);
  assert.match(app, /scrollHorizontalTrack\(1\)/);
  assert.match(app, /filteredMilestones\.map\(\(item, index\) =>/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
});

test('category dropdown uses compact, responsive sizing and consistent spacing', () => {
  assert.match(css, /\.timeline-shell \.timeline-filters \.category-filter select\s*\{[^}]*height:\s*46px/s);
  assert.match(css, /\.timeline-shell \.timeline-filters \.category-filter\s*\{[^}]*gap:\s*14px/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-filters\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /max-width:\s*calc\(100% - 128px\)/);
});



test('plain text navigation exposes the main GRID sections from the Timeline page', () => {
  assert.match(app, /<nav className="timeline-site-nav" aria-label="GRID site navigation">/);
  assert.ok(
    app.indexOf('<nav className="timeline-site-nav"') < app.indexOf('<div className="timeline-container">'),
    'Navigation should be outside the centered content container so it can sit at the page corner',
  );
  for (const href of ['/', '/about-us', '/core-team', '/timeline', '/faq', '/contact-us']) {
    assert.ok(app.includes(`href: '${href}'`), `Missing navigation destination ${href}`);
  }
  assert.match(app, /aria-current=\{item\.current \? 'page' : undefined\}/);
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*top:\s*clamp\(/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*left:\s*clamp\(/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav a\s*\{[^}]*font:\s*500 0\.88rem/s);
  assert.match(css, /text-shadow:\s*0 0 7px rgba\(255, 255, 255, 0\.13\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-site-nav\s*\{[^}]*top:\s*12px/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-site-nav a\s*\{[^}]*font-size:\s*0\.82rem/s);
  assert.doesNotMatch(css, /\.timeline-site-nav a\s*\{[^}]*background:/s);
});

test('mobile uses a consistent charcoal background while the document star canvas stays visible', () => {
  assert.doesNotMatch(app, /syncAtmosphereToVisualViewport/);
  assert.doesNotMatch(app, /atmosphere\.style\.(left|top|width|height)/);
  assert.match(app, /visualViewport\?\.addEventListener\('resize', handleZoomChange/);
  assert.match(app, /visualViewport\?\.addEventListener\('scroll', handleZoomChange/);
  const mobileStart = baseCss.indexOf('/* Keep the mobile page base consistently charcoal');
  assert.ok(mobileStart >= 0, 'mobile-only background rules are present');
  const mobileBackground = baseCss.slice(mobileStart);
  assert.match(mobileBackground, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell\s*\{[^}]*background-color:\s*var\(--bg-void\)/s);
  assert.match(mobileBackground, /\.timeline-shell\s*\{[^}]*background-image:\s*none/s);
  assert.doesNotMatch(mobileBackground, /\.timeline-shell::before|(?:radial|linear)-gradient/);
  assert.match(mobileBackground, /\.timeline-shell \.ambient-glow\s*\{\s*display:\s*none/s);
  const desktopBackground = baseCss.slice(0, mobileStart);
  assert.match(desktopBackground, /\.timeline-shell \.timeline-atmosphere\s*\{[^}]*position:\s*absolute/s);
  assert.match(desktopBackground, /\.timeline-shell \.timeline-ambience\s*\{[^}]*position:\s*absolute/s);
  assert.match(desktopBackground, /\.timeline-shell \.ambient-glow::before\s*\{[^}]*background:[\s\S]*?rgba\(216,30,63,\.24\)/s);
  assert.match(desktopBackground, /animation:\s*tl-gradient-breathe 32s ease-in-out infinite/);
  assert.match(app, /<div ref=\{ambienceRef\} className="timeline-ambience"[\s\S]*?<canvas className="ambient-network" \/>/);
});

test('Admin Preview is the final Timeline section after the page widgets', () => {
  const widgetIndex = app.indexOf('<div className={`timeline-page-widgets');
  const detailsIndex = app.indexOf('<MilestoneDetails');
  const adminStart = app.indexOf('<section className="timeline-admin-preview"');
  const adminEnd = app.indexOf('</section>', adminStart);
  const mainEnd = app.indexOf('</main>', adminEnd);
  assert.ok(widgetIndex >= 0 && widgetIndex < detailsIndex, 'Timeline widgets precede the detail dialog');
  assert.ok(detailsIndex < adminStart, 'the detail dialog precedes the final admin section');
  assert.ok(adminStart < adminEnd && adminEnd < mainEnd, 'Admin Preview is inside the Timeline shell');
  assert.match(app.slice(adminStart, adminEnd), /className="preview-toolbar liquid-glass"/);
  assert.match(app.slice(adminStart, adminEnd), /className=\{`admin-toggle/);
  assert.match(app.slice(adminStart, adminEnd), /<TimelinePageBuilder/);
  assert.match(app.slice(adminStart, adminEnd), /<MilestoneEditor/);
  assert.match(baseCss, /\.timeline-shell \.timeline-admin-preview\s*\{[^}]*width:\s*min\(1120px, calc\(100% - 48px\)\)/s);
  assert.match(baseCss, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-admin-preview\s*\{[^}]*max-width:\s*620px/s);
});

test('Timeline section spacing uses the shared GRID rhythm at desktop and mobile', () => {
  assert.match(css, /\.timeline-shell \.timeline-page-widgets\s*\{[^}]*gap:\s*clamp\(24px, 3\.5vw, 40px\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-page-widgets\s*\{[^}]*gap:\s*var\(--space-3, 24px\)/s);
  assert.match(baseCss, /\.timeline-shell \.timeline-section\s*\{\s*padding:\s*var\(--space-4\) 0 var\(--space-2\)/s);
  assert.match(baseCss, /\.timeline-shell \.timeline-year-group \+ \.timeline-year-group\s*\{\s*margin-top:\s*var\(--space-5\)/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[\s\S]*?gap:\s*var\(--space-1, 8px\) var\(--space-3, 24px\)/s);
  assert.match(css, /\.timeline-shell \.timeline-filters\s*\{[\s\S]*?margin:\s*var\(--space-2, 16px\) 0 var\(--space-3, 24px\)/s);
});

test('mobile navigation stays on one line and scrolls horizontally instead of overlapping page content', () => {
  const mobileNav = css.slice(css.indexOf('@media (max-width: 760px)'));
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav a\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav a\s*\{[^}]*flex:\s*0 0 auto/s);
});

test('category select uses a custom inset arrow with safe right-side spacing', () => {
  assert.match(css, /-webkit-appearance:\s*none/);
  assert.match(css, /appearance:\s*none/);
  assert.match(css, /padding:\s*0 54px 0 14px/);
  assert.match(css, /background-position:\s*right 18px center/);
  assert.match(css, /background-size:\s*16px 16px/);
});

test('all new presentation selectors remain scoped to Timeline', () => {
  const selectors = css.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('.'));
  for (const selector of selectors) {
    assert.ok(selector.startsWith('.timeline-shell'), `Unscoped selector: ${selector}`);
  }
});


test('mobile atmosphere overrides remain scoped to the Timeline root', () => {
  const selectors = baseCss.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('.'));
  for (const selector of selectors) {
    assert.ok(selector.startsWith('.timeline-shell'), `Unscoped base selector: ${selector}`);
  }
});
