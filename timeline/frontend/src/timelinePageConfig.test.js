import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneTimelinePageConfig,
  createPageWidget,
  getDefaultTimelinePageConfig,
  loadTimelinePageConfig,
  normalizeTimelinePageConfig,
  saveTimelinePageConfig,
  TIMELINE_PAGE_CONFIG_KEY,
} from './timelinePageConfig.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test('default page config starts vertical with the core page widgets in a useful order', () => {
  const config = getDefaultTimelinePageConfig();
  assert.equal(config.layout, 'vertical');
  assert.deepEqual(config.widgets.map((widget) => widget.type), ['hero', 'intro', 'timeline', 'footer']);
  assert.ok(config.widgets.every((widget) => widget.enabled));
});

test('new text and quote widgets receive editable default content', () => {
  const text = createPageWidget('text', 'text-1');
  const quote = createPageWidget('quote', 'quote-1');
  assert.equal(text.id, 'text-1');
  assert.equal(text.content.title, 'A new section');
  assert.ok(quote.content.quote.length > 0);
  assert.throws(() => createPageWidget('script'), TypeError);
});

test('normalization accepts horizontal mode and retains editable widget order', () => {
  const config = normalizeTimelinePageConfig({
    layout: 'horizontal',
    widgets: [
      { id: 'quote-1', type: 'quote', enabled: true, content: { quote: 'Build together', attribution: 'GRID' } },
      { id: 'text-1', type: 'text', enabled: false, content: { title: 'Notes', body: 'Community updates' } },
    ],
  });
  assert.equal(config.layout, 'horizontal');
  assert.deepEqual(config.widgets.map((widget) => widget.type), ['quote', 'text']);
  assert.equal(config.widgets[0].content.quote, 'Build together');
  assert.equal(config.widgets[1].enabled, false);
});

test('normalization rejects unsafe widget types and duplicate ids', () => {
  const config = normalizeTimelinePageConfig({
    layout: 'sideways',
    widgets: [
      { id: 'same', type: 'text', content: { title: 'First' } },
      { id: 'same', type: 'quote', content: { quote: 'Second' } },
      { id: 'bad', type: 'unknown' },
    ],
  });
  assert.equal(config.layout, 'vertical');
  assert.deepEqual(config.widgets.map((widget) => widget.id), ['same', 'same-2']);
  assert.equal(config.widgets.length, 2);
});

test('normalization limits editable strings and preserves boolean filter settings', () => {
  const config = normalizeTimelinePageConfig({
    widgets: [{
      id: 'timeline', type: 'timeline', content: { showYearFilter: false, showCategoryFilter: true, unexpected: 'ignored' },
    }],
  });
  assert.equal(config.widgets[0].content.showYearFilter, false);
  assert.equal(config.widgets[0].content.showCategoryFilter, true);
  const tooLong = normalizeTimelinePageConfig({
    widgets: [{ id: 'text-1', type: 'text', content: { body: 'x'.repeat(5000) } }],
  });
  assert.equal(tooLong.widgets[0].content.body.length, 4000);
});

test('save and load round-trip through browser-like local storage', () => {
  const storage = memoryStorage();
  const draft = getDefaultTimelinePageConfig();
  draft.layout = 'horizontal';
  draft.widgets.push(createPageWidget('text', 'custom-text'));
  saveTimelinePageConfig(draft, storage);
  const loaded = loadTimelinePageConfig(storage);
  assert.equal(loaded.layout, 'horizontal');
  assert.equal(loaded.widgets.at(-1).id, 'custom-text');
  assert.ok(storage.getItem(TIMELINE_PAGE_CONFIG_KEY));
});

test('bad or unavailable stored settings fall back safely to defaults', () => {
  const invalidJson = memoryStorage({ [TIMELINE_PAGE_CONFIG_KEY]: '{not-json' });
  assert.equal(loadTimelinePageConfig(invalidJson).layout, 'vertical');
  assert.equal(loadTimelinePageConfig({ getItem() { throw new Error('blocked'); } }).widgets.length, 4);
});

test('cloning produces an independent normalized copy', () => {
  const source = getDefaultTimelinePageConfig();
  const copy = cloneTimelinePageConfig(source);
  copy.widgets[0].content.title = 'Draft title';
  assert.notEqual(source.widgets[0].content.title, copy.widgets[0].content.title);
});
