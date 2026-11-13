import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const css = await readFile(path.join(here, 'timeline.css'), 'utf8');
const app = await readFile(path.join(here, 'App.jsx'), 'utf8');
const main = await readFile(path.join(here, 'main.jsx'), 'utf8');


test('background atmosphere and star canvas span the Timeline document instead of fixed viewport layers', () => {
  assert.match(css, /\.timeline-shell \.timeline-atmosphere\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.timeline-shell \.timeline-ambience\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.timeline-shell \.ambient-glow\s*\{[^}]*background:\s*#0A0A0C/s);
  assert.match(css, /@keyframes tl-gradient-breathe/);
  assert.match(css, /@keyframes tl-gradient-countercycle/);
  assert.match(app, /className="ambient-glow"/);
  assert.doesNotMatch(css, /\.timeline-shell \.timeline-(?:atmosphere|ambience)\s*\{[^}]*position:\s*fixed/s);
  assert.doesNotMatch(css, /tl-ambient-drift/);
});

test('stars stay white and do not react to cursor movement', () => {
  assert.match(app, /rgba\(255, 255, 255, \$\{alpha\}\)/);
  assert.doesNotMatch(app, /HIGHLIGHT_DURATION|HOVER_RADIUS|highlightUntil|handlePointerMove|pointermove/);
});

test('starfield uses small circle marks without motion trails', () => {
  assert.match(app, /context\.arc\(particle\.x, particle\.y, particle\.radius/);
  assert.doesNotMatch(app, /particle\.x - particle\.vx \* 25|rgba\(242, 239, 234, 0\.10\)/);
  assert.doesNotMatch(css, /(^|[;\s])filter:\s*blur\(\d{2,}px\)/);
});

test('background gradient slowly breathes between charcoal and official crimson', () => {
  assert.match(css, /background:\s*#0A0A0C/);
  assert.match(css, /@keyframes tl-gradient-breathe/);
  assert.match(css, /@keyframes tl-gradient-countercycle/);
  assert.match(css, /animation:\s*tl-gradient-breathe 32s ease-in-out infinite/);
  assert.match(css, /rgba\(216,30,63,\.24\)/);
  assert.match(css, /rgba\(122,15,34,\.19\)/);
  assert.match(css, /opacity:\s*\.82/);
  assert.match(css, /rgba\(216,30,63,\.055\)/);
  assert.match(css, /animation:\s*tl-gradient-countercycle 42s ease-in-out infinite/);
  assert.match(css, /at 0% 68%/);
  assert.match(css, /at 100% 92%/);
  assert.doesNotMatch(css, /ellipse 118% 122%/);
  assert.doesNotMatch(css, /at 48% 14%/);
});

test('background frame rate, pixel ratio and particle density adapt to device capability', () => {
  assert.match(app, /getBackgroundProfile/);
  assert.match(app, /requestAnimationFrame\(animate\)/);
  assert.match(app, /document\.hidden/);
  assert.match(app, /context\.setTransform\(ratio, 0, 0, ratio, 0, 0\)/);
  assert.match(css, /content-visibility:\s*auto/);
});

test('ambient motion has a reduced-motion fallback', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /tl-gradient-breathe/);
  assert.match(app, /prefers-reduced-motion/);
  assert.match(app, /if \(reducedMotion\) draw\(performance\.now\(\), true\)/);
});

test('liquid-glass surfaces use shared GRID glass tokens and layered reflections', () => {
  assert.match(css, /\.timeline-shell \.liquid-glass\s*\{/);
  assert.match(css, /backdrop-filter:\s*blur\(12px\) saturate\(112%\)/);
  assert.match(css, /var\(--glass-border\)/);
  assert.match(css, /rgba\(255,255,255,\.045\)/);
  assert.doesNotMatch(css, /rgba\(216,30,63,\.22\) 72%/);
});

test('action controls use the owner radius; only chips use capsule geometry', () => {
  assert.match(css, /--tl-control-height:\s*44px/);
  assert.match(css, /--tl-button-radius:\s*var\(--radius-sm\)/);
  assert.match(css, /--tl-pill-radius:\s*999px/);
  assert.match(css, /\.timeline-shell \.btn,[\s\S]*?\.timeline-shell \.filter-pill,[\s\S]*?border-radius:\s*var\(--tl-button-radius\)/);
  assert.match(css, /\.timeline-shell \.filter-pill\s*\{[^}]*border-radius:\s*var\(--tl-pill-radius\)/s);
  assert.match(css, /\.form-actions \.btn\s*\{[^}]*flex:\s*0 1 auto/s);
});

test('responsive breakpoints cover desktop, tablet and narrow phones', () => {
  for (const width of [900, 760, 430, 360]) {
    assert.match(css, new RegExp(`@media \\(max-width: ${width}px\\)`));
  }
  assert.match(css, /grid-template-columns:\s*minmax\(0,1fr\)/);
});

test('editor keeps a stable header, isolated scroll viewport and non-overlapping action footer', () => {
  assert.match(css, /\.timeline-shell \.editor-dialog\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /\.timeline-shell \.milestone-form\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.timeline-shell \.editor-form-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.timeline-shell \.form-actions\s*\{[^}]*position:\s*relative/s);
  assert.doesNotMatch(css.match(/\.timeline-shell \.form-actions\s*\{[^}]*\}/s)?.[0] || '', /position:\s*sticky/);
  const scrollStart = app.indexOf('<div className=\"editor-form-scroll\">');
  const footerStart = app.indexOf('<div className=\"form-actions editor-form-footer\">');
  const scrollClose = app.lastIndexOf('</div>', footerStart);
  assert.ok(scrollStart >= 0 && footerStart > scrollStart && scrollClose > scrollStart, 'footer follows the scrollable editor content');
  assert.match(css, /\.timeline-shell \.editor-dialog\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.editor-form-scroll > \.upload-field[\s\S]*?flex:\s*0 0 auto/);
  assert.match(css, /\.editor-form-scroll > \.form-grid[\s\S]*?width:\s*100%/);
  assert.match(css, /\.editor-form-scroll > \.editor-photo-grid[\s\S]*?flex:\s*0 0 auto/);
  assert.match(css, /\.editor-form-scroll::-webkit-scrollbar-thumb[\s\S]*?background:\s*rgba\(122,15,34/);
  assert.match(css, /\.timeline-shell \.form-actions[\s\S]*?background:\s*rgba\(18,18,21,\.985\)/);
});

test('page-specific CSS selectors are all scoped under the Timeline root', () => {
  const selectorLines = css.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('.'));
  for (const selectorLine of selectorLines) {
    // The photo viewer is deliberately portalled to document.body so fixed
    // positioning is not trapped by the milestone glass dialog. Its dedicated
    // .photo-viewer-* selectors are the only intentional page-level exception.
    const isTimelineScoped = selectorLine.startsWith('.timeline-shell');
    const isBodyPortalScoped = /^\.photo-viewer-(?:backdrop|dialog|header|counter|close|stage|image|controls)(?:\b|[.#\s,:])/.test(selectorLine);
    assert.ok(isTimelineScoped || isBodyPortalScoped, `Unscoped selector: ${selectorLine}`);
  }
  assert.doesNotMatch(css, /(^|\n)\s*(?:body|html|:root|\.nav|\.footer)\s*\{/m);
});

test('Timeline uses the official GRID palette without purple or unrelated accent hues', () => {
  assert.match(css, /var\(--bg-void\)/);
  assert.match(css, /var\(--accent\)/);
  assert.match(css, /var\(--text-primary\)/);
  assert.match(css, /var\(--text-muted\)/);
  assert.doesNotMatch(css, /112\s*,\s*52\s*,\s*126|91\s*,\s*22\s*,\s*77|purple|violet|#e52a4b|#b71635/i);
});


test('event detail metadata wraps instead of sharing one crowded line', () => {
  assert.match(app, /className="detail-kicker-row"/);
  assert.match(css, /\.timeline-shell \.detail-kicker-row\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.timeline-shell \.detail-content h2\s*\{[^}]*text-wrap:\s*pretty/s);
});

test('phone dialogs use viewport-sized layouts with independently scrolling content', () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.timeline-shell \.editor-dialog\s*\{[^}]*height:\s*100%/s);
  assert.match(css, /\.timeline-shell \.editor-form-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.timeline-shell \.form-actions\s*\{[^}]*position:\s*relative/s);
  assert.match(css, /\.timeline-shell \.detail-content\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /min-width:\s*0/);
  assert.doesNotMatch(css.slice(0, css.indexOf('/* ---------- Restrained animated GRID particle background ---------- */')), /overflow:\s*clip/);
});

test('mobile backdrop interactions support click/tap rather than mouse-only events', () => {
  assert.doesNotMatch(app, /onMouseDown=/);
  assert.match(app, /onClick=\{\(event\) => \{/);
});

test('glass panels stay neutral and translucent instead of forcing crimson fills', () => {
  assert.match(css, /background:\s*linear-gradient\(145deg, rgba\(255,255,255,\.045\)/);
  assert.match(css, /background:\s*rgba\(18,18,21,\.94\)/);
  assert.doesNotMatch(css, /rgba\(216,30,63,\.2\) 72%/);
});

test('Timeline-scoped GRID tokens load before Timeline-specific styling', () => {
  const sharedIndex = main.indexOf("import './timelineDesignTokens.css';");
  const timelineIndex = main.indexOf("import './timeline.css';");
  assert.ok(sharedIndex >= 0, 'Timeline-scoped GRID design tokens are present');
  assert.ok(timelineIndex > sharedIndex, 'Timeline CSS is imported after its scoped tokens');
});

test('shared typography is inherited instead of introducing another font system', () => {
  assert.match(css, /var\(--font-display\)/);
  assert.match(css, /var\(--font-body\)/);
  assert.doesNotMatch(css, /font-family:\s*['"](?:Helvetica|Arial|Roboto|Poppins)/i);
});


test('reveal observers are scoped to the Timeline root for safe integration', () => {
  assert.match(app, /const shellRef = useRef\(null\)/);
  assert.match(app, /shellRef\.current\?\.querySelectorAll\('\.timeline-year-group, \.timeline-row'\)/);
  assert.match(app, /<main ref=\{shellRef\} className=\{`timeline-shell[\s\S]*?SHOW_STANDALONE_TIMELINE_NAV[\s\S]*?`\}>/);
});

test('glass treatment is reused selectively on year, fact and admin surfaces', () => {
  assert.match(app, /className=\"year-heading liquid-glass\"/);
  assert.match(app, /className=\"detail-facts liquid-glass\"/);
  assert.match(app, /className=\"detail-admin-actions liquid-glass\"/);
  assert.match(css, /\.timeline-shell \.liquid-glass\s*\{/);
});


test('stars are random small white dots with gentle movement across the document', () => {
  assert.match(app, /createUniformStarPositions\(width, height, profile\.particleCount\)/);
  assert.match(app, /createUniformStarDrift\(profile\.driftVelocity\)/);
  assert.match(app, /\.\.\.drift/);
  assert.match(app, /rgba\(255, 255, 255, \$\{alpha\}\)/);
  assert.doesNotMatch(app, /createEvenStarPositions|applyHoverHighlight|HIGHLIGHT_DURATION/);
  assert.match(css, /animation:\s*tl-gradient-breathe 32s ease-in-out infinite/);
  assert.match(app, /particles = rescaleParticlePositions\(particles, previousWidth, previousHeight, width, height\)/);
});

test('milestone cards use a restrained crimson hover glow while resting neutrally', () => {
  const cardRule = css.match(/\.timeline-shell \.milestone-card\s*\{[^}]*\}/s)?.[0] || '';
  const hoverRule = css.match(/\.timeline-shell \.milestone-card:hover\s*\{[^}]*\}/s)?.[0] || '';
  assert.match(cardRule, /border:\s*1px solid rgba\(216,30,63,\.30\)/);
  assert.match(cardRule, /box-shadow:\s*0 16px 38px rgba\(0,0,0,\.34\)/);
  const cardShadow = cardRule.match(/box-shadow:\s*([^;]+)/)?.[1] || '';
  const hoverShadow = hoverRule.match(/box-shadow:\s*([^;]+)/)?.[1] || '';
  assert.doesNotMatch(cardShadow, /rgba\(216,30,63/);
  assert.doesNotMatch(css, /--tl-shadow-red/);
  assert.match(hoverShadow, /0 18px 42px rgba\(0,0,0,\.4\)/);
  assert.match(hoverShadow, /0 0 22px rgba\(216,30,63,\.16\)/);
  assert.doesNotMatch(cardShadow, /rgba\(216,30,63/);
});


test('decorative surfaces use restrained blur and avoid a full-screen SVG turbulence layer', () => {
  assert.match(css, /backdrop-filter:\s*blur\(12px\) saturate\(112%\)/);
  assert.match(css, /backdrop-filter:\s*blur\(8px\) saturate\(108%\)/);
  assert.match(css, /backdrop-filter:\s*blur\(4px\) saturate\(106%\)/);
  assert.doesNotMatch(css, /feTurbulence|mix-blend-mode/);
  assert.doesNotMatch(app, /ambient-grain/);
});

test('timeline photos use lazy loading and asynchronous decoding', () => {
  assert.match(app, /function StoredPhoto\([^)]*loading = 'lazy'/);
  assert.match(app, /loading=\{loading\} decoding="async"/);
  assert.match(app, /loading=\{index === 0 \? 'eager' : 'lazy'\}/);
});

test('mobile pinch zoom updates star presentation without moving or resizing background layers', () => {
  assert.match(app, /visualViewport: window\.visualViewport \|\| null/);
  assert.match(app, /visualViewport\?\.addEventListener\('resize', handleZoomChange/);
  assert.match(app, /visualViewport\?\.addEventListener\('scroll', handleZoomChange/);
  assert.match(app, /zoomPresentation = getZoomPresentation\(viewport\.scale\)/);
  assert.match(app, /const resizeObserver = typeof ResizeObserver !== 'undefined'/);
  assert.match(app, /resizeObserver\?\.observe\(shell\)/);
  assert.match(app, /shell\.scrollHeight/);
  assert.doesNotMatch(app, /setVisualViewportBounds|element\.style\.left|element\.style\.top/);
  assert.doesNotMatch(app, /backingResizeTimer|handleVisualViewportResize|handleVisualViewportScroll/);
  assert.match(app, /visualViewport\?\.removeEventListener\('resize', handleZoomChange/);
  assert.match(app, /visualViewport\?\.removeEventListener\('scroll', handleZoomChange/);
});

test('stars render as simple white circles without cursor trails or red hover effects', () => {
  assert.match(app, /context\.arc\(particle\.x, particle\.y, particle\.radius/);
  assert.match(app, /rgba\(255, 255, 255, \$\{alpha\}\)/);
  assert.doesNotMatch(app, /pointermove|pointerleave|context\.shadowBlur|highlightUntil|particle\.bright/);
});

test('ambient crimson gradient is stronger and cycles faster without replacing the charcoal base', () => {
  assert.match(css, /background:\s*#0A0A0C/);
  assert.match(css, /animation:\s*tl-gradient-breathe 32s ease-in-out infinite/);
  assert.match(css, /animation:\s*tl-gradient-countercycle 42s ease-in-out infinite/);
  assert.match(css, /rgba\(216,30,63,\.24\)/);
  assert.match(css, /rgba\(122,15,34,\.19\)/);
});


test('starfield does not contain connection-line rendering or network helpers', async () => {
  const background = await readFile(path.join(here, 'timelineBackground.js'), 'utf8');
  assert.doesNotMatch(app, /getNearbyParticlePairs|getConnectionLineAlpha|connectionPairs|connectionRefreshMs|lineWidth|lineTo\(/);
  assert.doesNotMatch(app, /rgba\(190, 0, 36/);
  assert.doesNotMatch(background, /getNearbyParticlePairs|getConnectionLineAlpha|linkDistance|lineOpacity|lineWidth|connectionRefreshMs/);
});

test('uniform star positions and movement survive page-resize changes', () => {
  assert.match(app, /createUniformStarPositions\(width, height, profile\.particleCount\)/);
  assert.match(app, /particles = rescaleParticlePositions\(particles, previousWidth, previousHeight, width, height\)/);
});


test('atmosphere and stars share document-space positioning so scrolling and pinch-zoom cannot detach the gradient', () => {
  assert.match(app, /className="timeline-atmosphere"/);
  assert.match(app, /className="timeline-ambience"/);
  assert.match(css, /\.timeline-shell \.timeline-atmosphere\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.timeline-shell \.timeline-ambience\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.timeline-shell \.timeline-ambience\s*\{[^}]*height:\s*100%/s);
  assert.match(app, /const nextHeight = Math\.max\(1, shell\.scrollHeight/);
  assert.match(app, /const initialViewport = readZoom\(\)/);
  assert.doesNotMatch(app, /setVisualViewportBounds|visualViewport\.offsetLeft|visualViewport\.offsetTop/);
});

test('pinch zoom simplifies only the star drawing and preserves the full document constellation', () => {
  assert.match(app, /zoomPresentation = getZoomPresentation\(viewport\.scale\)/);
  assert.match(app, /zoomRank:\s*Math\.random\(\)/);
  assert.match(app, /shouldRenderParticle\(particle, zoomPresentation\.particleDensity\)/);
  assert.match(app, /zoomPresentation\.particleDensity/);
  assert.doesNotMatch(app, /networkOpacity|connectionsVisible|connectionPairs/);
  assert.match(app, /particles = rescaleParticlePositions\(particles, previousWidth, previousHeight, width, height\)/);
});

test('zoom presentation reads VisualViewport scale but never mutates layer offsets', () => {
  assert.match(app, /getVisualViewportMetrics/);
  assert.match(app, /getZoomPresentation/);
  assert.match(app, /const initialViewport = readZoom\(\)/);
  assert.match(app, /const handleZoomChange = \(\) => scheduleZoomUpdate\(\)/);
  assert.doesNotMatch(app, /\.style\.(?:left|top)\s*=/);
});

test('pinch zoom has a layout-width fallback when VisualViewport scale is stale', async () => {
  assert.match(app, /scrollX: window\.scrollX/);
  assert.match(app, /scrollY: window\.scrollY/);
  assert.match(app, /getVisualViewportMetrics/);
  assert.match(await readFile(path.join(here, 'timelineBackground.js'), 'utf8'), /const widthRatio = layoutWidth \/ width/);
});

test('all decorative stars are independent small white circles with no red lines', async () => {
  const background = await readFile(path.join(here, 'timelineBackground.js'), 'utf8');
  assert.match(app, /createUniformStarPositions/);
  assert.match(app, /createUniformStarDrift/);
  assert.match(app, /context\.arc\(particle\.x, particle\.y, particle\.radius/);
  assert.match(app, /rgba\(255, 255, 255, \$\{alpha\}\)/);
  assert.doesNotMatch(background, /linkDistance|lineOpacity|connectionRefreshMs/);
  assert.doesNotMatch(app, /lineTo\(|strokeStyle|connectionPairs|getNearbyParticlePairs/);
});

test('document-height canvas is sized from Timeline content and responds to content growth', () => {
  assert.match(app, /const nextWidth = Math\.max\(1, shell\.clientWidth/);
  assert.match(app, /const nextHeight = Math\.max\(1, shell\.scrollHeight/);
  assert.match(app, /new ResizeObserver\(scheduleDocumentResize\)/);
  assert.match(app, /canvas\.height = Math\.max\(1, Math\.round\(height \* ratio\)\)/);
  assert.match(css, /\.timeline-shell \.timeline-ambience\s*\{[^}]*height:\s*100%/s);
});
