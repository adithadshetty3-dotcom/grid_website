export const TIMELINE_PAGE_CONFIG_KEY = 'grid.timeline.page-config.v1';
export const TIMELINE_PAGE_CONFIG_VERSION = 1;

export const PAGE_WIDGET_FIELD_DEFINITIONS = {
  hero: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Main title', type: 'textarea' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'asideLabel', label: 'Side label', type: 'text' },
    { key: 'asideDescription', label: 'Side description', type: 'textarea' },
  ],
  intro: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  timeline: [
    { key: 'showYearFilter', label: 'Show year filter', type: 'toggle' },
    { key: 'showCategoryFilter', label: 'Show category filter', type: 'toggle' },
  ],
  text: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Text', type: 'textarea' },
  ],
  quote: [
    { key: 'quote', label: 'Quote', type: 'textarea' },
    { key: 'attribution', label: 'Attribution', type: 'text' },
  ],
  footer: [
    { key: 'leftLabel', label: 'Left label', type: 'text' },
    { key: 'rightLabel', label: 'Right label', type: 'text' },
  ],
};

const DEFAULT_WIDGETS = [
  {
    id: 'hero',
    type: 'hero',
    enabled: true,
    content: {
      eyebrow: 'GRID / OUR JOURNEY',
      title: 'The story\nso far.',
      description: 'A collection of the moments, ideas and milestones that shape the GRID community.',
      asideLabel: '01 — TIMELINE',
      asideDescription: 'Every milestone is a part of a bigger picture. Explore the journey, one moment at a time.',
    },
  },
  {
    id: 'timeline-intro',
    type: 'intro',
    enabled: true,
    content: {
      eyebrow: 'THE MILESTONES',
      title: 'A journey in progress',
      description: 'Browse by year or explore the moments that made the journey.',
    },
  },
  {
    id: 'timeline',
    type: 'timeline',
    enabled: true,
    content: { showYearFilter: true, showCategoryFilter: true },
  },
  {
    id: 'footer',
    type: 'footer',
    enabled: true,
    content: { leftLabel: 'GRID / KSSEM', rightLabel: 'MORE TO COME ↗' },
  },
];

const WIDGET_DEFAULTS = {
  text: { eyebrow: 'FROM THE GRID COMMUNITY', title: 'A new section', body: 'Add your text here.' },
  quote: { quote: 'Add a short quote or highlight here.', attribution: 'GRID / KSSEM' },
};

const ALLOWED_WIDGET_TYPES = new Set(Object.keys(PAGE_WIDGET_FIELD_DEFINITIONS));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getDefaultTimelinePageConfig() {
  return { version: TIMELINE_PAGE_CONFIG_VERSION, layout: 'vertical', widgets: clone(DEFAULT_WIDGETS) };
}

export function cloneTimelinePageConfig(config) {
  return clone(normalizeTimelinePageConfig(config));
}

export function createPageWidget(type, id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`) {
  if (!Object.hasOwn(WIDGET_DEFAULTS, type)) {
    throw new TypeError(`Unsupported page widget type: ${type}`);
  }
  return { id, type, enabled: true, content: clone(WIDGET_DEFAULTS[type]) };
}

export function normalizeTimelinePageConfig(value) {
  const fallback = getDefaultTimelinePageConfig();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;

  const sourceWidgets = Array.isArray(value.widgets) ? value.widgets : fallback.widgets;
  const seenIds = new Set();
  const widgets = [];

  for (const source of sourceWidgets) {
    if (!source || typeof source !== 'object' || !ALLOWED_WIDGET_TYPES.has(source.type)) continue;
    const type = source.type;
    const rawId = typeof source.id === 'string' && source.id.trim() ? source.id.trim() : `${type}-${widgets.length + 1}`;
    let id = rawId;
    let suffix = 2;
    while (seenIds.has(id)) id = `${rawId}-${suffix++}`;
    seenIds.add(id);

    const defaultWidget = fallback.widgets.find((widget) => widget.type === type) || createPageWidget(type, id);
    const contentDefaults = defaultWidget.content || WIDGET_DEFAULTS[type];
    const rawContent = source.content && typeof source.content === 'object' ? source.content : {};
    const content = {};
    for (const [key, defaultValue] of Object.entries(contentDefaults)) {
      if (typeof defaultValue === 'boolean') {
        content[key] = typeof rawContent[key] === 'boolean' ? rawContent[key] : defaultValue;
      } else {
        content[key] = typeof rawContent[key] === 'string' ? rawContent[key].slice(0, 4000) : defaultValue;
      }
    }
    widgets.push({ id, type, enabled: source.enabled !== false, content });
  }

  return {
    version: TIMELINE_PAGE_CONFIG_VERSION,
    layout: value.layout === 'horizontal' ? 'horizontal' : 'vertical',
    widgets: widgets.length ? widgets : fallback.widgets,
  };
}

export function loadTimelinePageConfig(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    const raw = target?.getItem(TIMELINE_PAGE_CONFIG_KEY);
    return raw ? normalizeTimelinePageConfig(JSON.parse(raw)) : getDefaultTimelinePageConfig();
  } catch {
    return getDefaultTimelinePageConfig();
  }
}

export function saveTimelinePageConfig(config, storage) {
  const target = storage ?? globalThis.localStorage;
  if (!target || typeof target.setItem !== 'function') {
    throw new Error('Local page settings are unavailable in this browser.');
  }
  const normalized = normalizeTimelinePageConfig(config);
  target.setItem(TIMELINE_PAGE_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}
