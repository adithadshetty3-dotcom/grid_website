import { PAGE_WIDGET_FIELD_DEFINITIONS } from './timelinePageConfig.js';

const WIDGET_NAMES = {
  hero: 'Hero / page introduction',
  intro: 'Timeline section heading',
  timeline: 'Milestone timeline',
  text: 'Text section',
  quote: 'Quote / callout',
  footer: 'Closing footer',
};

export default function TimelinePageBuilder({
  config,
  starfieldEnabled,
  starfieldSettingsLoading = false,
  starfieldSettingsError = '',
  onStarfieldChange,
  onLayoutChange,
  onContentChange,
  onEnabledChange,
  onMove,
  onRemove,
  onAdd,
  onSave,
  onCancel,
}) {
  return (
    <section className="page-builder-panel liquid-glass" aria-labelledby="page-builder-title">
      <div className="page-builder-header">
        <div>
          <span className="eyebrow">PAGE BUILDER / LOCAL TEST MODE</span>
          <h2 id="page-builder-title">Arrange your page</h2>
          <p>Change the layout, edit section content, and add or hide widgets. Your draft updates the preview as you edit.</p>
        </div>
        <span className="page-builder-local-tag">LAYOUT: THIS BROWSER</span>
      </div>

      <fieldset className="page-layout-chooser">
        <legend>Timeline orientation</legend>
        <label className={config.layout === 'vertical' ? 'layout-choice is-selected' : 'layout-choice'}>
          <input type="radio" name="timeline-layout" value="vertical" checked={config.layout === 'vertical'} onChange={() => onLayoutChange('vertical')} />
          <span className="layout-choice-icon" aria-hidden="true">↕</span>
          <span><strong>Vertical</strong><small>Scroll down through milestones</small></span>
        </label>
        <label className={config.layout === 'horizontal' ? 'layout-choice is-selected' : 'layout-choice'}>
          <input type="radio" name="timeline-layout" value="horizontal" checked={config.layout === 'horizontal'} onChange={() => onLayoutChange('horizontal')} />
          <span className="layout-choice-icon" aria-hidden="true">↔</span>
          <span><strong>Horizontal</strong><small>Scroll sideways through milestones</small></span>
        </label>
      </fieldset>

      <fieldset className="page-background-settings">
        <legend>Background effects</legend>
        <div className="page-background-setting-row">
          <div>
            <strong>Starfield background</strong>
            <small>Turn the subtle animated stars on or off for everyone viewing the Timeline.</small>
          </div>
          <label className="page-builder-toggle page-background-toggle">
            <input
              type="checkbox"
              aria-label="Enable starfield background for all Timeline visitors"
              checked={Boolean(starfieldEnabled)}
              disabled={starfieldSettingsLoading || Boolean(starfieldSettingsError)}
              onChange={(event) => onStarfieldChange?.(event.target.checked)}
            />
            <span>{starfieldEnabled ? 'On' : 'Off'}</span>
          </label>
        </div>
        {starfieldSettingsLoading && <small className="page-background-status" role="status">Loading the shared setting…</small>}
        {starfieldSettingsError && <small className="page-background-status page-background-error" role="alert">{starfieldSettingsError} Check that the Timeline API is available and pending database migrations are applied, then refresh this page.</small>}
      </fieldset>

      <div className="page-builder-widgets-heading">
        <div><strong>Page widgets</strong><span>Move blocks up or down, edit their content, or hide them from the page.</span></div>
        <span>{config.widgets.length.toString().padStart(2, '0')} BLOCKS</span>
      </div>

      <div className="page-builder-widget-list">
        {config.widgets.map((widget, index) => {
          const fields = PAGE_WIDGET_FIELD_DEFINITIONS[widget.type] || [];
          return (
            <article className={`page-builder-widget ${widget.enabled ? '' : 'is-disabled'}`} key={widget.id}>
              <header className="page-builder-widget-header">
                <div className="page-builder-widget-title">
                  <span className="page-builder-widget-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{WIDGET_NAMES[widget.type] || 'Page widget'}</strong>
                    <small>{widget.enabled ? 'Visible in preview' : 'Hidden from preview'}</small>
                  </div>
                </div>
                <div className="page-builder-widget-actions">
                  <button type="button" onClick={() => onMove(widget.id, -1)} disabled={index === 0} aria-label={`Move ${WIDGET_NAMES[widget.type]} up`}>↑</button>
                  <button type="button" onClick={() => onMove(widget.id, 1)} disabled={index === config.widgets.length - 1} aria-label={`Move ${WIDGET_NAMES[widget.type]} down`}>↓</button>
                  <button type="button" className="page-builder-visibility" onClick={() => onEnabledChange(widget.id, !widget.enabled)} aria-pressed={widget.enabled}>{widget.enabled ? 'Hide' : 'Show'}</button>
                  {(widget.type === 'text' || widget.type === 'quote') && (
                    <button type="button" className="page-builder-remove" onClick={() => onRemove(widget.id)}>Remove</button>
                  )}
                </div>
              </header>

              <div className="page-builder-fields">
                {fields.map((field) => {
                  if (field.type === 'toggle') {
                    return (
                      <label className="page-builder-toggle" key={field.key}>
                        <input type="checkbox" checked={Boolean(widget.content[field.key])} onChange={(event) => onContentChange(widget.id, field.key, event.target.checked)} />
                        <span>{field.label}</span>
                      </label>
                    );
                  }
                  const value = widget.content[field.key] ?? '';
                  return (
                    <label className="page-builder-field" key={field.key}>
                      <span>{field.label}</span>
                      {field.type === 'textarea' ? (
                        <textarea rows={field.key === 'title' ? 2 : 3} value={value} onChange={(event) => onContentChange(widget.id, field.key, event.target.value)} />
                      ) : (
                        <input type="text" value={value} onChange={(event) => onContentChange(widget.id, field.key, event.target.value)} />
                      )}
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="page-builder-add-row">
        <span>Add another block</span>
        <button type="button" onClick={() => onAdd('text')}>＋ Text section</button>
        <button type="button" onClick={() => onAdd('quote')}>＋ Quote / callout</button>
      </div>

      <div className="page-builder-footer">
        <p>Page layout is saved in this browser. The starfield setting is saved site-wide for all Timeline visitors.</p>
        <div>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Discard</button>
          <button type="button" className="btn btn-primary" onClick={onSave}>Save page setup</button>
        </div>
      </div>
    </section>
  );
}
