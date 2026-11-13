import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createUniformStarDrift,
  createUniformStarPositions,
  getBackgroundProfile,
  getVisualViewportMetrics,
  getZoomPresentation,
  rescaleParticlePositions,
  shouldRenderParticle,
} from './timelineBackground.js';

const seededRandom = (initial = 17) => {
  let seed = initial;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
};

test('low-power phone density scales across the full Timeline document', () => {
  const profile = getBackgroundProfile({ width: 360, height: 4200, deviceMemory: 2, hardwareConcurrency: 4 });
  assert.equal(profile.mobile, true);
  assert.equal(profile.lowPower, true);
  assert.ok(profile.particleCount >= 157 && profile.particleCount <= 221);
  assert.equal(profile.framesPerSecond, 24);
  assert.equal(profile.pixelRatioCap, 0.45);
});

test('normal phone density scales across the full Timeline document', () => {
  const profile = getBackgroundProfile({ width: 390, height: 3200, deviceMemory: 6, hardwareConcurrency: 8 });
  assert.equal(profile.mobile, true);
  assert.equal(profile.lowPower, false);
  assert.ok(profile.particleCount >= 208 && profile.particleCount <= 304);
  assert.equal(profile.framesPerSecond, 30);
  assert.equal(profile.pixelRatioCap, 0.7);
});

test('save-data preference selects the low-power desktop profile', () => {
  const profile = getBackgroundProfile({ width: 1440, height: 3200, saveData: true });
  assert.equal(profile.lowPower, true);
  assert.equal(profile.framesPerSecond, 30);
  assert.equal(profile.pixelRatioCap, 0.55);
  assert.ok(profile.particleCount >= 292 && profile.particleCount <= 427);
});

test('normal desktop density scales across the full Timeline document', () => {
  const profile = getBackgroundProfile({ width: 1440, height: 3200, deviceMemory: 16, hardwareConcurrency: 12 });
  assert.equal(profile.mobile, false);
  assert.equal(profile.lowPower, false);
  assert.ok(profile.particleCount >= 384 && profile.particleCount <= 569);
  assert.equal(profile.framesPerSecond, 45);
  assert.equal(profile.pixelRatioCap, 0.72);
});

test('background profiles contain no connection or line settings', () => {
  const phone = getBackgroundProfile({ width: 390, height: 3200, deviceMemory: 6, hardwareConcurrency: 8 });
  const desktop = getBackgroundProfile({ width: 1440, height: 3200, deviceMemory: 16, hardwareConcurrency: 12 });
  for (const profile of [phone, desktop]) {
    assert.equal('linkDistance' in profile, false);
    assert.equal('lineOpacity' in profile, false);
    assert.equal('lineWidth' in profile, false);
    assert.equal('connectionRefreshMs' in profile, false);
  }
});

test('uniform star positions are randomly jittered but evenly spread across the document', () => {
  const positions = createUniformStarPositions(1200, 3600, 100, seededRandom());
  assert.equal(positions.length, 100);
  assert.ok(positions.every(({ x, y }) => x >= 0 && x < 1200 && y >= 0 && y < 3600));
  assert.ok(positions.some(({ y }) => y < 600));
  assert.ok(positions.some(({ y }) => y > 3000));
  const rowBands = new Map();
  for (const { y } of positions) {
    const band = Math.floor(y / (3600 / 17));
    rowBands.set(band, (rowBands.get(band) || 0) + 1);
  }
  assert.equal(rowBands.size, 17);
  assert.ok(Math.max(...rowBands.values()) - Math.min(...rowBands.values()) <= 1);
  assert.ok(new Set(positions.map(({ x, y }) => `${x.toFixed(4)},${y.toFixed(4)}`)).size > 95);
});

test('uniform star placement safely handles empty counts and invalid dimensions', () => {
  assert.deepEqual(createUniformStarPositions(100, 100, 0), []);
  const single = createUniformStarPositions(0, 0, 1, () => 0.5);
  assert.deepEqual(single, [{ x: 0.5, y: 0.5 }]);
});

test('star drift uses the same speed with independent directions', () => {
  const speeds = [0, 0.25, 0.5, 0.75].map((random) => createUniformStarDrift(0.16, () => random));
  for (const { vx, vy } of speeds) assert.ok(Math.abs(Math.hypot(vx, vy) - 0.16) < 1e-10);
  assert.equal(new Set(speeds.map(({ vx, vy }) => `${vx.toFixed(4)},${vy.toFixed(4)}`)).size, 4);
});

test('uniform star position helper safely handles empty counts and invalid dimensions', () => {
  assert.deepEqual(createUniformStarPositions(100, 100, 0), []);
  const single = createUniformStarPositions(0, 0, 1, () => 0.5);
  assert.deepEqual(single, [{ x: 0.5, y: 0.5 }]);
});

test('star drift remains gentle on phones and desktops', () => {
  const phone = getBackgroundProfile({ width: 390, height: 844, deviceMemory: 6, hardwareConcurrency: 8 });
  const desktop = getBackgroundProfile({ width: 1440, height: 900, deviceMemory: 16, hardwareConcurrency: 12 });
  assert.equal(phone.driftVelocity, 0.12);
  assert.equal(desktop.driftVelocity, 0.16);
  assert.ok(phone.driftVelocity < 0.2 && desktop.driftVelocity < 0.2);
});

test('visual viewport metrics follow the visible area during pinch zoom', () => {
  const metrics = getVisualViewportMetrics({
    visualViewport: { width: 195, height: 360, offsetLeft: 74, offsetTop: 112, scale: 2 },
    innerWidth: 390,
    innerHeight: 780,
  });
  assert.deepEqual(metrics, { left: 74, top: 112, pageLeft: 74, pageTop: 112, width: 195, height: 360, scale: 2 });
});

test('visual viewport metrics safely fall back when the API is unavailable', () => {
  const metrics = getVisualViewportMetrics({ innerWidth: 390, innerHeight: 844 });
  assert.deepEqual(metrics, { left: 0, top: 0, pageLeft: 0, pageTop: 0, width: 390, height: 844, scale: 1 });
});

test('visual viewport metrics ignore invalid dimensions and offsets', () => {
  const metrics = getVisualViewportMetrics({
    visualViewport: { width: 0, height: Number.NaN, offsetLeft: Number.NaN, offsetTop: Number.NaN, scale: 0 },
    innerWidth: 414,
    innerHeight: 896,
  });
  assert.deepEqual(metrics, { left: 0, top: 0, pageLeft: 0, pageTop: 0, width: 414, height: 896, scale: 1 });
});

test('resizing the document canvas preserves star positions and movement state', () => {
  const original = [
    { x: 100, y: 200, vx: 0.1, vy: -0.2, alpha: 0.7 },
    { x: 300, y: 600, vx: -0.1, vy: 0.2, alpha: 0.6 },
  ];
  const resized = rescaleParticlePositions(original, 400, 800, 200, 400);
  assert.equal(resized.length, original.length);
  assert.deepEqual(resized.map(({ x, y }) => ({ x, y })), [{ x: 50, y: 100 }, { x: 150, y: 300 }]);
  assert.equal(resized[0].vx, original[0].vx);
  assert.equal(resized[0].alpha, original[0].alpha);
  assert.notEqual(resized[0], original[0]);
});

test('rescaling uses safe minimum dimensions and keeps finite particle coordinates', () => {
  const resized = rescaleParticlePositions([{ x: 5, y: 10 }], 0, 0, 100, 200);
  assert.deepEqual(resized, [{ x: 500, y: 2000 }]);
});

test('star density decreases smoothly with zoom and never drops below a usable floor', () => {
  const scales = [1, 1.25, 1.5, 2, 3, 4, 6].map(getZoomPresentation);
  for (let index = 1; index < scales.length; index += 1) assert.ok(scales[index].particleDensity < scales[index - 1].particleDensity);
  assert.equal(scales[0].particleDensity, 1);
  assert.ok(scales.at(-1).particleDensity >= 0.24);
});

test('zooming out restores the full star inclusion threshold', () => {
  const zoomed = getZoomPresentation(2.5);
  const restored = getZoomPresentation(1);
  assert.ok(zoomed.particleDensity < restored.particleDensity);
  assert.equal(restored.particleDensity, 1);
  assert.deepEqual(Object.keys(restored).sort(), ['particleDensity', 'scale']);
});

test('stable zoom ranks cull stars without mutating the stored starfield', () => {
  const stars = [
    { x: 10, y: 20, zoomRank: 0.1, alpha: 0.7 },
    { x: 30, y: 40, zoomRank: 0.55, alpha: 0.6 },
    { x: 50, y: 60, zoomRank: 0.92, alpha: 0.5 },
  ];
  const visible = stars.filter((star) => shouldRenderParticle(star, 0.6));
  assert.equal(visible.length, 2);
  assert.deepEqual(visible, stars.slice(0, 2));
  assert.equal(stars[2].x, 50);
  assert.equal(stars[0].alpha, 0.7);
});

test('particle visibility helper clamps thresholds and remains safe for legacy stars', () => {
  assert.equal(shouldRenderParticle({ zoomRank: 0.5 }, 2), true);
  assert.equal(shouldRenderParticle({ zoomRank: 0.5 }, -1), false);
  assert.equal(shouldRenderParticle({ x: 10, y: 20 }, 0), true);
});

test('pinch zoom is inferred from visual viewport width when reported scale is stale', () => {
  const metrics = getVisualViewportMetrics({
    visualViewport: { width: 180, height: 390, offsetLeft: 42, offsetTop: 86, scale: 1 },
    innerWidth: 360,
    innerHeight: 780,
  });
  assert.equal(metrics.scale, 2);
  assert.equal(metrics.left, 42);
  assert.equal(metrics.top, 86);
});

test('reported pinch scale wins when it is greater than the viewport-width estimate', () => {
  const metrics = getVisualViewportMetrics({
    visualViewport: { width: 240, height: 520, offsetLeft: 30, offsetTop: 70, scale: 2.5 },
    innerWidth: 360,
    innerHeight: 780,
  });
  assert.equal(metrics.scale, 2.5);
});

test('visual viewport page coordinates include document scroll when explicit page offsets are unavailable', () => {
  const metrics = getVisualViewportMetrics({
    visualViewport: { width: 360, height: 640, offsetLeft: 12, offsetTop: 24, scale: 1 },
    innerWidth: 360,
    innerHeight: 640,
    scrollX: 120,
    scrollY: 480,
  });
  assert.equal(metrics.pageLeft, 132);
  assert.equal(metrics.pageTop, 504);
});
