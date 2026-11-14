import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const [app, builder, admin, css, baseCss, main] = await Promise.all([
  readFile(path.join(here, 'App.jsx'), 'utf8'),
  readFile(path.join(here, 'TimelinePageBuilder.jsx'), 'utf8'),
  readFile(path.join(here, 'TimelineAdmin.jsx'), 'utf8'),
  readFile(path.join(here, 'timelineModular.css'), 'utf8'),
  readFile(path.join(here, 'timeline.css'), 'utf8'),
  readFile(path.join(here, 'main.jsx'), 'utf8'),
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



test('Timeline has a namespaced GRID glass navbar with accessible desktop and mobile navigation', () => {
  assert.match(app, /<nav\s+className=\{`timeline-site-nav/);
  assert.match(app, /aria-label="GRID site navigation"/);
  assert.match(app, /className="timeline-site-nav-brand"[^>]*>GRID<\/a>/);
  assert.match(app, /className="timeline-site-nav-toggle"/);
  assert.match(app, /aria-expanded=\{mobileNavOpen\}/);
  assert.match(app, /aria-controls="timeline-site-nav-links"/);
  assert.match(app, /id="timeline-site-nav-links"/);
  assert.match(app, /createTimelineSiteNavigation\(/);
  assert.ok(
    app.indexOf('<nav') < app.indexOf('<div className="timeline-container">'),
    'Navigation should remain outside the centered content container',
  );
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*position:\s*fixed[^}]*top:\s*var\(--space-2, 1rem\)[^}]*max-width:\s*1040px/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav\s*\{[^}]*padding:\s*var\(--space-1, 0\.5rem\) var\(--space-3, 1\.5rem\)[^}]*border-radius:\s*var\(--radius-lg, 20px\)[^}]*background:\s*var\(--glass-fill, rgba\(255, 255, 255, 0\.035\)\)[^}]*backdrop-filter:\s*blur\(20px\)/s);
  assert.match(css, /timeline-site-nav-brand\s*\{[^}]*font-family:\s*'JetBrains Mono', monospace/);
  assert.match(css, /timeline-site-nav-links\s*\{[^}]*gap:\s*var\(--space-4, 2rem\)/);
  assert.match(css, /\.timeline-shell \.timeline-site-nav-links a\[aria-current="page"\]/);
  const activeNavRule = css.match(/\.timeline-shell \.timeline-site-nav-links a:hover,[\s\S]*?\.timeline-site-nav-links a\[aria-current="page"\]\s*\{[^}]*\}/)?.[0] || '';
  assert.match(activeNavRule, /color:\s*var\(--text-primary, #f2efea\)/);
  assert.doesNotMatch(activeNavRule, /background|border/);
  assert.match(css, /timeline-site-nav-header\s*\{\s*display:\s*contents/s);
  assert.match(css, /timeline-site-nav-toggle\s*\{\s*display:\s*none/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?timeline-site-nav-toggle\s*\{[^}]*display:\s*inline-flex/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?timeline-site-nav-links\.is-open\s*\{[^}]*display:\s*flex/s);
  assert.doesNotMatch(css, /(^|[\s,])\.(?:nav|glass)(?:[\s.#:[,{])/m);
  assert.doesNotMatch(baseCss, /\.timeline-shell \.nav\s*\{/);
});

test('standalone Timeline document fills the viewport with a dark, margin-free canvas', async () => {
  const documentCss = await readFile(path.join(here, 'index.css'), 'utf8');
  const documentHtml = await readFile(path.join(here, '..', 'index.html'), 'utf8');
  assert.match(main, /import '\.\/index\.css';/);
  assert.match(documentCss, /html,[\s\S]*body,[\s\S]*#root\s*\{[^}]*width:\s*100%[^}]*margin:\s*0/s);
  assert.match(documentCss, /html,[\s\S]*body\s*\{[^}]*background:\s*#0a0a0c/s);
  assert.match(documentCss, /body\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-x:\s*clip/s);
  assert.doesNotMatch(documentCss, /width:\s*1126px|border-inline/);
  assert.match(documentHtml, /rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/);
  assert.match(documentHtml, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
  assert.match(baseCss, /\.timeline-shell\s*\{[^}]*background:\s*var\(--bg-void\)/s);
});

test('milestone cards get a restrained red hover and keyboard focus glow without motion under reduced-motion', () => {
  assert.match(baseCss, /\.milestone-card:hover\s*\{[^}]*border-color:\s*rgba\(216,30,63,\.72\)[^}]*box-shadow:[^}]*rgba\(216,30,63,\.16\)/s);
  assert.match(baseCss, /\.milestone-card:focus-visible\s*\{[^}]*box-shadow:[^}]*rgba\(216,30,63,\.16\)/s);
  assert.match(baseCss, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.milestone-card:hover,[\s\S]*?\.milestone-card:focus-visible\s*\{[^}]*transform:\s*none/s);
  assert.doesNotMatch(baseCss, /\.year-filter:hover[^}]*box-shadow:\s*[^;]*rgba\(216,30,63/);
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

test('authenticated Timeline admin section follows public content and owns page settings', () => {
  const widgetIndex = app.indexOf('<div className={`timeline-page-widgets');
  const detailsIndex = app.indexOf('<MilestoneDetails');
  const adminStart = app.indexOf('<TimelineAdmin');
  const adminEnd = app.indexOf('</TimelineAdmin>', adminStart);
  assert.ok(widgetIndex >= 0 && widgetIndex < detailsIndex, 'Timeline widgets precede the detail dialog');
  assert.ok(detailsIndex < adminStart, 'the detail dialog precedes the final admin section');
  assert.ok(adminStart < adminEnd && adminEnd < app.indexOf('</main>', adminEnd), 'Admin section is inside the Timeline shell');
  // Session 050 adds a ref for controlled scroll-into-view when the discreet
  // fixed sign-in entry opens the existing admin panel.
  assert.match(admin, /return <section ref=\{panelRef\} className="timeline-admin-preview" aria-label="Timeline administration">/);
  assert.match(admin, /className="timeline-admin-entry"/);
  assert.match(admin, /\{panelOpen && <div className="timeline-admin-panel liquid-glass">/);
  assert.match(admin, /restoreAdminSession\(\)/);
  assert.match(admin, /typeof children === 'function' \? children\(\{ csrfToken, admin, expireSession \}\) : children/);
  assert.match(app.slice(adminStart, adminEnd), /<TimelinePageBuilder/);
  assert.match(app, /<MilestoneDetails[\s\S]*?isAdmin=\{false\}/);
  assert.match(admin, /!admin \? <form className="timeline-admin-login"/);
  assert.match(admin, /typeof children === 'function' \? children\(\{ csrfToken, admin, expireSession \}\) : children/);
  assert.match(baseCss, /\.timeline-shell \.timeline-admin-preview\s*\{[^}]*width:\s*min\(1120px, calc\(100% - 48px\)\)/s);
  assert.match(baseCss, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-admin-preview\s*\{[^}]*max-width:\s*620px/s);
});

test('Timeline section spacing uses the shared GRID rhythm at desktop and mobile', () => {
  assert.match(css, /\.timeline-shell \.timeline-page-widgets\s*\{[^}]*gap:\s*clamp\(24px, 3\.5vw, 40px\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.timeline-page-widgets\s*\{[^}]*gap:\s*var\(--space-3, 24px\)/s);
  assert.match(baseCss, /\.timeline-shell \.timeline-section\s*\{\s*padding:\s*var\(--space-4\) 0 var\(--space-2\)/s);
  assert.match(baseCss, /\.timeline-shell \.timeline-year-group \+ \.timeline-year-group\s*\{\s*margin-top:\s*var\(--space-5\)/s);
  assert.match(css, /\.timeline-shell \.timeline-site-nav-links\s*\{[\s\S]*?gap:\s*var\(--space-4, 2rem\)/s);
  assert.match(baseCss, /\.timeline-shell\s*\{[^}]*padding:\s*clamp\(7\.25rem, 10vw, 8\.5rem\)/s);
  assert.match(css, /\.timeline-shell \.timeline-filters\s*\{[\s\S]*?margin:\s*var\(--space-2, 16px\) 0 var\(--space-3, 24px\)/s);
});

test('mobile GRID navigation keeps the brand and hamburger in one row with a dropdown', () => {
  const mobileNav = css.slice(css.indexOf('@media (max-width: 760px)'));
  const mobilePage = baseCss.slice(baseCss.indexOf('@media (max-width: 760px)'));
  const navRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(navRule, /flex-direction:\s*row/);
  assert.match(navRule, /padding:\s*0\.75rem 1\.25rem/);
  assert.match(navRule, /border-radius:\s*var\(--radius-lg, 20px\)/);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav-header\s*\{[^}]*display:\s*contents/s);
  const toggleRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav-toggle\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(toggleRule, /display:\s*inline-flex/);
  assert.match(toggleRule, /padding:\s*5px/);
  const dropdownRule = mobileNav.match(/\.timeline-shell \.timeline-site-nav-links\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(dropdownRule, /display:\s*none/);
  assert.match(dropdownRule, /position:\s*absolute/);
  assert.match(dropdownRule, /top:\s*calc\(100% \+ 12px\)/);
  assert.match(mobileNav, /\.timeline-shell \.timeline-site-nav-links\.is-open\s*\{[^}]*display:\s*flex/s);
  assert.match(mobilePage, /\.timeline-shell\s*\{[^}]*padding:\s*max\(7\.5rem, calc\(env\(safe-area-inset-top\) \+ 6\.5rem\)\)/s);
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
    // The lightbox is portalled to document.body to escape the glass dialog's
    // fixed-position containing block; only its own viewer classes are global.
    const isTimelineScoped = selector.startsWith('.timeline-shell');
    const isBodyPortalScoped = /^\.photo-viewer-(?:backdrop|dialog|header|counter|close|stage|image|controls)(?:\b|[.#\s,:])/.test(selector);
    assert.ok(isTimelineScoped || isBodyPortalScoped, `Unscoped base selector: ${selector}`);
  }
});


test('page builder separates local layout storage from the shared starfield preference', () => {
  assert.match(builder, /<fieldset className="page-background-settings">/);
  assert.match(builder, /<strong>Starfield background<\/strong>/);
  assert.match(builder, /aria-label=\"Enable starfield background for all Timeline visitors\"/);
  assert.match(builder, /checked=\{Boolean\(starfieldEnabled\)\}/);
  assert.match(builder, /onStarfieldChange\?\.\(event.target.checked\)/);
  assert.match(app, /updateAdminTimelineSettings/);
  assert.match(app, /saveTimelinePageConfig\(pageDraft \|\| pageConfig\)/);
  assert.match(css, /page-background-settings/);
});


test('Timeline imports scoped GRID tokens before its page-specific stylesheet', () => {
  const sharedIndex = main.indexOf("import './timelineDesignTokens.css';");
  const timelineIndex = main.indexOf("import './timeline.css';");
  assert.ok(sharedIndex >= 0 && timelineIndex > sharedIndex);
  assert.match(css, /\.timeline-shell \.page-background-settings/);
});


test('Timeline can hide its standalone navigation and build assets for a host mount path', async () => {
  const vite = await readFile(path.join(here, '..', 'vite.config.js'), 'utf8');
  assert.match(app, /VITE_TIMELINE_SHOW_STANDALONE_NAV !== 'false'/);
  assert.match(app, /SHOW_STANDALONE_TIMELINE_NAV && \(/);
  assert.match(app, /timeline-shell-hosted/);
  assert.match(vite, /base: env\.VITE_TIMELINE_BASE \|\| '\/'/);
});
