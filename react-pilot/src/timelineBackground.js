/**
 * Small, deterministic helpers for the decorative Timeline star field.
 * Keeps particle density, canvas resolution and frame rate appropriate to
 * the current device without requiring a rendering dependency.
 */
export function getBackgroundProfile({
  width,
  height,
  deviceMemory = 0,
  hardwareConcurrency = 0,
  saveData = false,
}) {
  const mobile = width <= 760;
  const lowPower = Boolean(saveData)
    || (deviceMemory > 0 && deviceMemory <= 2)
    || (hardwareConcurrency > 0 && hardwareConcurrency <= 4);

  // Keep a steady star density across the complete Timeline document rather
  // than filling only the currently visible screen.
  const referenceViewportHeight = mobile ? 800 : 900;
  const pageScreens = Math.max(1, Math.max(1, height) / referenceViewportHeight);
  const minimumPerScreen = mobile ? (lowPower ? 30 : 52) : (lowPower ? 82 : 108);
  const maximumPerScreen = mobile ? (lowPower ? 42 : 76) : (lowPower ? 120 : 160);
  const minimum = Math.ceil(minimumPerScreen * pageScreens);
  const maximum = Math.ceil(maximumPerScreen * pageScreens);
  const divisor = mobile ? (lowPower ? 10667 : 6154) : (lowPower ? 15800 : 12000);
  const pageArea = Math.max(1, width) * Math.max(1, height);
  const particleCount = Math.max(minimum, Math.min(maximum, Math.round(pageArea / divisor)));

  return {
    mobile,
    lowPower,
    particleCount,
    // Keep the lightweight page-canvas backing store and mobile frame caps.
    pixelRatioCap: lowPower ? (mobile ? 0.45 : 0.55) : (mobile ? 0.7 : 0.72),
    framesPerSecond: mobile ? (lowPower ? 24 : 30) : (lowPower ? 30 : 45),
    // A calm, consistent drift speed keeps movement visually uniform.
    driftVelocity: mobile ? 0.12 : 0.16,
  };
}

/**
 * Read the visible viewport in layout-viewport CSS pixels. During pinch zoom,
 * the VisualViewport can shrink and move inside the layout viewport while
 * window.innerWidth/innerHeight may remain unchanged. Keeping these values
 * separate lets the fixed canvas follow the visible screen without rebuilding
 * its star field for every zoom/pan event.
 */
export function getVisualViewportMetrics({
  visualViewport = null,
  innerWidth = 0,
  innerHeight = 0,
  scrollX = 0,
  scrollY = 0,
} = {}) {
  const positive = (value, fallback) => (
    Number.isFinite(value) && value > 0 ? value : Math.max(1, Number(fallback) || 1)
  );
  const width = positive(visualViewport?.width, innerWidth);
  const height = positive(visualViewport?.height, innerHeight);
  const left = Number.isFinite(visualViewport?.offsetLeft) ? visualViewport.offsetLeft : 0;
  const top = Number.isFinite(visualViewport?.offsetTop) ? visualViewport.offsetTop : 0;
  const reportedScale = Number.isFinite(visualViewport?.scale) && visualViewport.scale > 0
    ? visualViewport.scale
    : 1;

  // Chromium/Safari normally report pinch zoom through VisualViewport.scale.
  // Some embedded/mobile browser paths expose a stale scale during the first
  // pinch frames, while visualViewport.width has already contracted. Infer a
  // second estimate from the layout width and use whichever is larger.
  const layoutWidth = positive(innerWidth, width);
  const widthRatio = layoutWidth / width;
  const scale = Math.max(1, reportedScale, Number.isFinite(widthRatio) ? widthRatio : 1);
  const pageLeft = Number.isFinite(visualViewport?.pageLeft)
    ? visualViewport.pageLeft
    : Math.max(0, Number(scrollX) || 0) + left;
  const pageTop = Number.isFinite(visualViewport?.pageTop)
    ? visualViewport.pageTop
    : Math.max(0, Number(scrollY) || 0) + top;

  return { left, top, pageLeft, pageTop, width, height, scale };
}



/**
 * Convert VisualViewport page coordinates into a clipped draw region inside a
 * document-sized canvas. Drawing only the visible slice keeps a long page
 * canvas inexpensive while allowing stars/gradient to zoom and pan with content.
 */
export function getVisibleCanvasRegion(viewport = {}, documentTop = 0, documentHeight = 0) {
  const totalHeight = Math.max(1, Number(documentHeight) || 1);
  const topValue = Number.isFinite(viewport.pageTop) ? viewport.pageTop : 0;
  const viewportHeight = Number.isFinite(viewport.height) && viewport.height > 0
    ? viewport.height
    : totalHeight;
  const top = Math.max(0, Math.min(totalHeight, topValue - (Number(documentTop) || 0)));
  const height = Math.max(0, Math.min(viewportHeight, totalHeight - top));
  return { top, bottom: top + height, height };
}

/**
 * Translate VisualViewport pinch scale into a calm starfield presentation.
 * Stars are progressively thinned while their original positions remain intact,
 * so zooming back out restores the same sky.
 */
export function getZoomPresentation(scale = 1) {
  const safeScale = Number.isFinite(scale) && scale > 0 ? Math.max(1, Math.min(6, scale)) : 1;
  const particleDensity = Math.max(0.24, 1 / Math.pow(safeScale, 0.82));

  return {
    scale: safeScale,
    particleDensity,
  };
}

/**
 * Give each star a stable inclusion rank. At higher pinch zoom, drawing only
 * stars below the density threshold thins the sky evenly without generating a
 * new constellation or making the remaining stars jump.
 */
export function shouldRenderParticle(particle, particleDensity = 1) {
  if (!particle || !Number.isFinite(particle.zoomRank)) return true;
  const threshold = Math.max(0, Math.min(1, Number(particleDensity) || 0));
  return particle.zoomRank <= threshold;
}

/**
 * Preserve the constellation when the visible viewport changes size.
 * This avoids regenerating random stars during browser zoom or address-bar
 * transitions, which previously caused flicker, jumps and empty frames.
 */
export function rescaleParticlePositions(particles, oldWidth, oldHeight, newWidth, newHeight) {
  if (!Array.isArray(particles)) return [];
  const sourceWidth = Math.max(1, Number(oldWidth) || 1);
  const sourceHeight = Math.max(1, Number(oldHeight) || 1);
  const targetWidth = Math.max(1, Number(newWidth) || 1);
  const targetHeight = Math.max(1, Number(newHeight) || 1);
  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;

  return particles.map((particle) => ({
    ...particle,
    x: particle.x * scaleX,
    y: particle.y * scaleY,
  }));
}


/**
 * Scatter stars evenly across the full Timeline document while keeping each
 * position visually random. A stratified layout prevents accidental clumps
 * and empty patches that can happen with unconstrained random placement.
 * `random` is injectable so placement can be tested deterministically.
 */
export function createUniformStarPositions(width, height, count, random = Math.random) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (!safeCount) return [];

  const unitRandom = () => {
    const value = Number(random());
    return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.5;
  };
  const columns = Math.max(1, Math.ceil(Math.sqrt(safeCount * (safeWidth / safeHeight))));
  const rows = Math.ceil(safeCount / columns);
  const starsPerFullRow = Math.floor(safeCount / rows);
  const extraStars = safeCount % rows;
  const positions = [];

  for (let row = 0; row < rows; row += 1) {
    const starsInRow = starsPerFullRow + (row < extraStars ? 1 : 0);
    const cellWidth = safeWidth / starsInRow;
    const cellHeight = safeHeight / rows;
    for (let column = 0; column < starsInRow; column += 1) {
      // Keep a little breathing room at each cell edge; the jitter makes the
      // overall field feel scattered rather than arranged in visible rows.
      const jitterX = 0.02 + unitRandom() * 0.96;
      const jitterY = 0.02 + unitRandom() * 0.96;
      positions.push({
        x: (column + jitterX) * cellWidth,
        y: (row + jitterY) * cellHeight,
      });
    }
  }

  return positions;
}

/**
 * Give every star the same gentle speed while choosing an independent random
 * direction. This keeps the field moving consistently without synchronized paths.
 */
export function createUniformStarDrift(speed, random = Math.random) {
  const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
  const value = Number(random());
  const angle = (Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.5) * Math.PI * 2;
  return {
    vx: Math.cos(angle) * safeSpeed,
    vy: Math.sin(angle) * safeSpeed,
  };
}
