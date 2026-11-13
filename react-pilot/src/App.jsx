import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TimelinePageBuilder from './TimelinePageBuilder.jsx';
import {
  cloneTimelinePageConfig,
  createPageWidget,
  loadTimelinePageConfig,
  saveTimelinePageConfig,
} from './timelinePageConfig.js';
import './timelineModular.css';
import {
  loadMilestones,
  removeMilestone,
  saveMilestone,
} from './timelineRepository.js';
import { createUniformStarDrift, createUniformStarPositions, getBackgroundProfile, getVisualViewportMetrics, getVisibleCanvasRegion, getZoomPresentation, rescaleParticlePositions, shouldRenderParticle } from './timelineBackground.js';
import {
  CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_PHOTOS,
  MAX_PHOTO_SIZE,
  MAX_TOTAL_PHOTO_SIZE,
  getNewPhotoBytes,
  getStorageErrorMessage,
  getStoredPhotoBytes,
  isSupportedImage,
  validateMilestoneDraft,
} from './timelineValidation.js';

const SITE_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Core Team', href: '/core-team' },
  { label: 'Timeline', href: '/timeline', current: true },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact Us', href: '/contact-us' },
];

function localDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `milestone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(year, month - 1, day));
}

function sortMilestones(items) {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
}

function StoredPhoto({ image, className = '', alt = 'Timeline milestone photograph', loading = 'lazy' }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!image?.blob) {
      setUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(image.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!url) {
    return (
      <div className={`photo-placeholder ${className}`} aria-label="No photograph added">
        <span className="photo-placeholder-mark">G</span>
        <span>GRID / MOMENT</span>
      </div>
    );
  }
  return <img className={className} src={url} alt={alt} loading={loading} decoding="async" fetchPriority={loading === 'eager' ? 'high' : 'auto'} />;
}

function LocalPhotoPreview({ file, onRemove }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="editor-photo liquid-glass">
      {url && <img src={url} alt={`Preview of ${file.name}`} loading="lazy" decoding="async" />}
      <span title={file.name}>{file.name}</span>
      <button type="button" className="icon-button" onClick={onRemove} aria-label={`Remove ${file.name}`}>×</button>
    </div>
  );
}

function MilestoneCard({ milestone, index, onOpen, layout = 'vertical' }) {
  const month = formatDate(milestone.date, { month: 'short' }).toUpperCase();
  const day = formatDate(milestone.date, { day: '2-digit' });
  const year = formatDate(milestone.date, { year: 'numeric' });
  const cover = milestone.images?.[0];

  if (layout === 'horizontal') {
    return (
      <article className="timeline-horizontal-card" style={{ '--row-stagger': `${(index % 6) * 75}ms` }}>
        <div className="timeline-horizontal-marker" aria-hidden="true"><span>{year}</span><i /></div>
        <button type="button" className="milestone-card liquid-glass" onClick={onOpen}>
          <div className="milestone-media">
            <StoredPhoto image={cover} loading="lazy" />
            {milestone.isDemo && <span className="demo-tag">DEMO CONTENT</span>}
          </div>
          <div className="milestone-copy">
            <div className="milestone-meta"><span>{milestone.category}</span><span>{month} {day}</span></div>
            <h3>{milestone.title}</h3>
            <p>{milestone.summary}</p>
            <span className="card-link">Explore milestone <span aria-hidden="true">↗</span></span>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article className="timeline-row" style={{ '--row-stagger': `${(index % 6) * 75}ms` }}>
      <div className="timeline-side timeline-side-left">
        {index % 2 === 0 && (
          <button type="button" className="milestone-card liquid-glass" onClick={onOpen}>
            <div className="milestone-media">
              <StoredPhoto image={cover} loading="lazy" />
              {milestone.isDemo && <span className="demo-tag">DEMO CONTENT</span>}
            </div>
            <div className="milestone-copy">
              <div className="milestone-meta"><span>{milestone.category}</span><span>{month} {day}</span></div>
              <h3>{milestone.title}</h3>
              <p>{milestone.summary}</p>
              <span className="card-link">Explore milestone <span aria-hidden="true">↗</span></span>
            </div>
          </button>
        )}
      </div>
      <div className="timeline-spine" aria-hidden="true">
        <span className="timeline-node" />
        <span className="timeline-date">{formatDate(milestone.date, { month: 'short', year: 'numeric' })}</span>
      </div>
      <div className="timeline-side timeline-side-right">
        {index % 2 !== 0 && (
          <button type="button" className="milestone-card liquid-glass" onClick={onOpen}>
            <div className="milestone-media">
              <StoredPhoto image={cover} loading="lazy" />
              {milestone.isDemo && <span className="demo-tag">DEMO CONTENT</span>}
            </div>
            <div className="milestone-copy">
              <div className="milestone-meta"><span>{milestone.category}</span><span>{month} {day}</span></div>
              <h3>{milestone.title}</h3>
              <p>{milestone.summary}</p>
              <span className="card-link">Explore milestone <span aria-hidden="true">↗</span></span>
            </div>
          </button>
        )}
      </div>
    </article>
  );
}

function MilestoneDetails({ milestone, onClose, onEdit, onDelete, isAdmin, actionError }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!milestone) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [milestone?.id]);

  if (!milestone) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="milestone-dialog liquid-glass" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button ref={closeButtonRef} type="button" className="dialog-close icon-button" onClick={onClose} aria-label="Close milestone details">×</button>
        {milestone.images?.length > 0 && (
          <div className="detail-gallery">
            {milestone.images.map((image, index) => (
              <StoredPhoto key={`${milestone.id}-${image.name}-${index}`} image={image} alt={`${milestone.title} — photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} />
            ))}
          </div>
        )}
        <div className="detail-content">
          <div className="detail-kicker-row">
            {milestone.isDemo && <span className="demo-tag detail-demo-tag">DEMO CONTENT — REPLACE BEFORE PUBLISHING</span>}
            <div className="eyebrow">{milestone.category} <span aria-hidden="true">/</span> {formatDate(milestone.date, { month: 'long', year: 'numeric' })}</div>
          </div>
          <h2 id="detail-title">{milestone.title}</h2>
          <div className="detail-facts liquid-glass">
            <span><strong>Date</strong>{formatDate(milestone.date)}</span>
            {milestone.time && <span><strong>Time</strong>{milestone.time}</span>}
            {milestone.location && <span><strong>Location</strong>{milestone.location}</span>}
          </div>
          {milestone.summary && <p className="detail-summary">{milestone.summary}</p>}
          <div className="detail-description">{milestone.description.split('\n').map((line, index) => <p key={index}>{line || '\u00a0'}</p>)}</div>
          {actionError && <p className="form-error detail-action-error" role="alert">{actionError}</p>}
          {isAdmin && (
            <div className="detail-admin-actions liquid-glass">
              <button type="button" className="btn btn-ghost" onClick={onEdit}>Edit milestone</button>
              <button type="button" className="btn btn-danger" onClick={onDelete}>Delete milestone</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MilestoneEditor({ milestone, onSave, onCancel, onDraftChange, saving, saveError }) {
  const titleInputRef = useRef(null);
  const closeButtonRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const savingRef = useRef(saving);
  cancelRef.current = onCancel;
  savingRef.current = saving;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    // Avoid forcing the mobile keyboard open or scrolling the editor beneath its sticky header.
    // On touch devices, focus the close control; on desktop, focus the first field without scrolling.
    const isTouchLayout = window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouchLayout) {
      closeButtonRef.current?.focus({ preventScroll: true });
    } else {
      titleInputRef.current?.focus({ preventScroll: true });
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !savingRef.current) {
        cancelRef.current?.();
        return;
      }

      if (event.key === 'Tab') {
        const dialog = document.getElementById('milestone-editor');
        const focusable = dialog?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const [draft, setDraft] = useState(() => ({
    title: milestone?.title || '',
    category: milestone?.category || 'Events',
    date: milestone?.date || localDateValue(),
    time: milestone?.time || '',
    location: milestone?.location || '',
    summary: milestone?.summary || '',
    description: milestone?.description || '',
  }));
  const [existingImages, setExistingImages] = useState(milestone?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [formError, setFormError] = useState('');

  const update = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError('');
    onDraftChange?.();
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (existingImages.length + newImages.length + selectedFiles.length > MAX_PHOTOS) {
      setFormError(`You can add up to ${MAX_PHOTOS} photos per milestone.`);
      return;
    }
    const invalidFile = selectedFiles.find((file) => !isSupportedImage(file));
    if (invalidFile) {
      setFormError('Use JPG, PNG, WebP, GIF or AVIF images. SVG and other file types are not accepted.');
      return;
    }
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_PHOTO_SIZE);
    if (oversizedFile) {
      setFormError('Each photo must be 10 MB or smaller.');
      return;
    }
    const currentBytes = getStoredPhotoBytes(existingImages) + getNewPhotoBytes(newImages);
    const selectedBytes = getNewPhotoBytes(selectedFiles);
    if (currentBytes + selectedBytes > MAX_TOTAL_PHOTO_SIZE) {
      setFormError('Keep the combined photo size under 40 MB per milestone.');
      return;
    }
    setFormError('');
    onDraftChange?.();
    setNewImages((current) => [...current, ...selectedFiles]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validateMilestoneDraft(draft, existingImages, newImages);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    onSave({
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      location: draft.location.trim(),
      images: [
        ...existingImages,
        ...newImages.map((file) => ({ blob: file, name: file.name, type: file.type })),
      ],
    });
  };

  return (
    <div className="editor-modal-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel();
    }}>
      <section className="editor-panel editor-dialog liquid-glass" id="milestone-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">TIMELINE ADMIN / PREVIEW</span>
          <h2 id="editor-title">{milestone ? 'Edit milestone' : 'Add a milestone'}</h2>
          <p>Fill in the details. The year and month are generated from the date.</p>
        </div>
        <button ref={closeButtonRef} type="button" className="icon-button" onClick={onCancel} disabled={saving} aria-label="Close editor">×</button>
      </div>

      <form onSubmit={handleSubmit} className="milestone-form">
        <div className="editor-form-scroll">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Milestone title <b>*</b></span>
            <input ref={titleInputRef} value={draft.title} onChange={(event) => update('title', event.target.value)} maxLength={90} placeholder="e.g. Project showcase day" required />
          </label>
          <label className="field">
            <span>Category <b>*</b></span>
            <select value={draft.category} onChange={(event) => update('category', event.target.value)}>
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Date <b>*</b></span>
            <input type="date" value={draft.date} onChange={(event) => update('date', event.target.value)} required />
            <small>Month and year are picked up automatically.</small>
          </label>
          <label className="field">
            <span>Time</span>
            <input type="time" value={draft.time} onChange={(event) => update('time', event.target.value)} />
          </label>
          <label className="field">
            <span>Location</span>
            <input value={draft.location} onChange={(event) => update('location', event.target.value)} maxLength={100} placeholder="Venue or location (optional)" />
          </label>
          <label className="field field-wide">
            <span>Short description <b>*</b></span>
            <input value={draft.summary} onChange={(event) => update('summary', event.target.value)} maxLength={180} placeholder="A one- or two-line introduction for the card" required />
            <small>{draft.summary.length}/180 characters</small>
          </label>
          <label className="field field-wide">
            <span>Full information <b>*</b></span>
            <textarea value={draft.description} onChange={(event) => update('description', event.target.value)} rows={5} maxLength={MAX_DESCRIPTION_LENGTH} placeholder="Add the full milestone story and any useful context..." required />
            <small>{draft.description.length.toLocaleString('en-IN')}/{MAX_DESCRIPTION_LENGTH.toLocaleString('en-IN')} characters</small>
          </label>
        </div>

        <div className="upload-field liquid-glass">
          <div>
            <span className="field-label">Photos</span>
            <p>Up to {MAX_PHOTOS} JPG, PNG, WebP, GIF or AVIF images. 10 MB each; 40 MB combined.</p>
          </div>
          <label className="upload-button">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple onChange={handleImageChange} />
            <span aria-hidden="true">＋</span> Add photos
          </label>
        </div>

        {(existingImages.length > 0 || newImages.length > 0) && (
          <div className="editor-photo-grid">
            {existingImages.map((image, index) => (
              <div className="editor-photo liquid-glass" key={`existing-${image.name}-${index}`}>
                <StoredPhoto image={image} alt={image.name || 'Existing uploaded photo'} />
                <span title={image.name}>{image.name || 'Existing photo'}</span>
                <button type="button" className="icon-button" onClick={() => { setFormError(''); onDraftChange?.(); setExistingImages((items) => items.filter((_, photoIndex) => photoIndex !== index)); }} aria-label="Remove existing photo">×</button>
              </div>
            ))}
            {newImages.map((file, index) => (
              <LocalPhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => { setFormError(''); onDraftChange?.(); setNewImages((items) => items.filter((_, photoIndex) => photoIndex !== index)); }} />
            ))}
          </div>
        )}

        {(formError || saveError) && <p className="form-error" role="alert">{formError || saveError}</p>}
        </div>
        <div className="form-actions editor-form-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : milestone ? 'Save changes' : 'Add to timeline'}</button>
        </div>
      </form>
      </section>
    </div>
  );
}

export default function App() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [activeYear, setActiveYear] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [editorError, setEditorError] = useState('');
  const [lastDeleted, setLastDeleted] = useState(null);

  // This visible switch is strictly for local UI review. It is not authentication.
  // Replace it with the main site's verified admin permission before deployment.
  const [adminPreview, setAdminPreview] = useState(false);
  const [pageConfig, setPageConfig] = useState(() => loadTimelinePageConfig());
  const [pageDraft, setPageDraft] = useState(null);
  const [pageBuilderOpen, setPageBuilderOpen] = useState(false);
  const horizontalTrackRef = useRef(null);
  const shellRef = useRef(null);
  const ambienceRef = useRef(null);

  // Lightweight starfield across the full Timeline document. The phone
  // gradient is painted by the page background; only star density responds
  // to VisualViewport changes during pinch zoom.
  useEffect(() => {
    const shell = shellRef.current;
    const layer = ambienceRef.current;
    const canvas = layer?.querySelector('canvas');
    const context = canvas?.getContext('2d', { alpha: true, desynchronized: true });
    if (!shell || !layer || !canvas || !context) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const deviceMemory = Number(navigator.deviceMemory) || 0;
    const hardwareConcurrency = Number(navigator.hardwareConcurrency) || 0;
    const saveData = Boolean(navigator.connection?.saveData);

    let width = 0;
    let height = 0;
    let profile = null;
    let particles = [];
    let frame = 0;
    let lastFrameAt = 0;
    let previousFrameAt = 0;
    let resizeFrame = 0;
    let zoomFrame = 0;
    let currentViewportMetrics = null;
    let zoomPresentation = getZoomPresentation(1);

    const readZoom = () => getVisualViewportMetrics({
      visualViewport: window.visualViewport || null,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });

    const updateZoomPresentation = () => {
      zoomFrame = 0;
      const viewport = readZoom();
      currentViewportMetrics = viewport;
      zoomPresentation = getZoomPresentation(viewport.scale);
      if (reducedMotion) draw(performance.now(), true);
    };

    const scheduleZoomUpdate = () => {
      if (!zoomFrame) zoomFrame = window.requestAnimationFrame(updateZoomPresentation);
    };

    const makeParticle = (position) => {
      const drift = createUniformStarDrift(profile.driftVelocity);
      return {
        ...position,
        ...drift,
        radius: Math.random() * 0.42 + 0.82,
        alpha: 0.56 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        twinkleRate: 0.00016 + Math.random() * 0.00012,
        zoomRank: Math.random(),
      };
    };

    const resizeDocumentCanvas = () => {
      resizeFrame = 0;
      // Atmosphere and canvas are absolutely positioned across the full
      // Timeline document. They scroll and pinch-zoom with content rather than
      // fighting the browser's visual viewport on mobile.
      const nextWidth = Math.max(1, shell.clientWidth || window.innerWidth || 1);
      const nextHeight = Math.max(1, shell.scrollHeight || shell.clientHeight || window.innerHeight || 1);
      if (Math.abs(nextWidth - width) < 1 && Math.abs(nextHeight - height) < 1 && profile) return;

      const previousWidth = width;
      const previousHeight = height;
      width = nextWidth;
      height = nextHeight;
      profile = getBackgroundProfile({ width, height, deviceMemory, hardwareConcurrency, saveData });

      if (!particles.length || previousWidth <= 0 || previousHeight <= 0) {
        particles = createUniformStarPositions(width, height, profile.particleCount).map(makeParticle);
      } else {
        particles = rescaleParticlePositions(particles, previousWidth, previousHeight, width, height);
        if (particles.length > profile.particleCount) {
          particles = particles.slice(0, profile.particleCount);
        } else if (particles.length < profile.particleCount) {
          const additions = createUniformStarPositions(width, height, profile.particleCount - particles.length);
          particles.push(...additions.map(makeParticle));
        }
      }

      // Low backing-store pixel ratios keep a page-height canvas affordable.
      const maxCanvasPixels = 6_000_000;
      const areaRatioCap = Math.sqrt(maxCanvasPixels / Math.max(1, width * height));
      const ratio = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap, areaRatioCap);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      lastFrameAt = 0;
      previousFrameAt = 0;
      if (reducedMotion) draw(performance.now(), true);
    };

    const scheduleDocumentResize = () => {
      if (!resizeFrame) resizeFrame = window.requestAnimationFrame(resizeDocumentCanvas);
    };

    const draw = (timestamp = performance.now(), force = false) => {
      if (!context || document.hidden || !profile) return;
      const frameInterval = 1000 / profile.framesPerSecond;
      if (!force && !reducedMotion && timestamp - lastFrameAt < frameInterval) return;

      const deltaFrames = previousFrameAt ? Math.min(2.5, Math.max(0.5, (timestamp - previousFrameAt) / 16.667)) : 1;
      previousFrameAt = timestamp;
      lastFrameAt = timestamp;
      const viewport = currentViewportMetrics || readZoom();
      const shellBounds = shell.getBoundingClientRect();
      const shellDocumentTop = shellBounds.top + window.scrollY;
      const visibleRegion = getVisibleCanvasRegion(viewport, shellDocumentTop, height);
      const drawMargin = 40;
      const drawTop = Math.max(0, visibleRegion.top - drawMargin);
      const drawBottom = Math.min(height, visibleRegion.bottom + drawMargin);
      // The full-document canvas keeps its old off-screen pixels until those
      // pixels scroll into view. Clearing only the visible slice limits work.
      context.clearRect(0, drawTop, width, Math.max(0, drawBottom - drawTop));

      if (!reducedMotion) {
        for (const particle of particles) {
          if (!shouldRenderParticle(particle, zoomPresentation.particleDensity)) continue;
          particle.x += particle.vx * deltaFrames;
          particle.y += particle.vy * deltaFrames;
          if (particle.x < -16) particle.x = width + 16;
          if (particle.x > width + 16) particle.x = -16;
          if (particle.y < -16) particle.y = height + 16;
          if (particle.y > height + 16) particle.y = -16;
        }
      }

      for (const particle of particles) {
        if (particle.y < drawTop || particle.y > drawBottom) continue;
        if (!shouldRenderParticle(particle, zoomPresentation.particleDensity)) continue;
        const twinkle = reducedMotion
          ? 0
          : (Math.sin(timestamp * particle.twinkleRate + particle.phase) + 1) / 2;
        const alpha = particle.alpha * (0.88 + twinkle * 0.12);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.fill();
      }
    };

    const animate = (timestamp) => {
      frame = 0;
      if (document.hidden || reducedMotion) return;
      draw(timestamp);
      frame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!reducedMotion && !document.hidden && !frame) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (reducedMotion) {
        draw(performance.now(), true);
      } else {
        startAnimation();
      }
    };

    const visualViewport = window.visualViewport || null;
    const handleZoomChange = () => scheduleZoomUpdate();
    const handleWindowResize = () => { scheduleDocumentResize(); scheduleZoomUpdate(); };
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleDocumentResize)
      : null;
    resizeObserver?.observe(shell);

    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('scroll', handleZoomChange, { passive: true });
    visualViewport?.addEventListener('resize', handleZoomChange, { passive: true });
    visualViewport?.addEventListener('scroll', handleZoomChange, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    const initialViewport = readZoom();
    currentViewportMetrics = initialViewport;
    zoomPresentation = getZoomPresentation(initialViewport.scale);
    resizeDocumentCanvas();
    startAnimation();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (zoomFrame) window.cancelAnimationFrame(zoomFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      visualViewport?.removeEventListener('resize', handleZoomChange);
      visualViewport?.removeEventListener('scroll', handleZoomChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadMilestones()
      .then((items) => { if (active) setMilestones(sortMilestones(items)); })
      .catch((error) => { if (active) setStorageError(error.message || 'Could not load Timeline data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const years = useMemo(() => [...new Set(milestones.map((item) => item.date.slice(0, 4)))].sort(), [milestones]);
  const filteredMilestones = useMemo(() => sortMilestones(milestones).filter((item) => {
    const yearMatches = activeYear === 'all' || item.date.startsWith(activeYear);
    const categoryMatches = activeCategory === 'All' || item.category === activeCategory;
    return yearMatches && categoryMatches;
  }), [milestones, activeYear, activeCategory]);
  const groupedMilestones = useMemo(() => {
    return filteredMilestones.reduce((groups, item) => {
      const year = item.date.slice(0, 4);
      groups[year] ||= [];
      groups[year].push(item);
      return groups;
    }, {});
  }, [filteredMilestones]);
  const activePageConfig = pageDraft || pageConfig;
  const visiblePageWidgets = useMemo(
    () => activePageConfig.widgets.filter((widget) => widget.enabled),
    [activePageConfig],
  );

  useEffect(() => {
    const revealTargets = shellRef.current?.querySelectorAll('.timeline-year-group, .timeline-row') || [];
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((target) => target.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

    revealTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [groupedMilestones]);

  const handleSave = useCallback(async (draft) => {
    setSaving(true);
    setNotice('');
    setStorageError('');
    setEditorError('');
    try {
      const now = new Date().toISOString();
      const saved = {
        ...draft,
        id: editingMilestone?.id || makeId(),
        isDemo: false,
        createdAt: editingMilestone?.createdAt || now,
        updatedAt: now,
      };
      await saveMilestone(saved);
      setMilestones((items) => sortMilestones([...items.filter((item) => item.id !== saved.id), saved]));
      setEditorOpen(false);
      setEditingMilestone(null);
      setSelectedMilestone(null);
      setLastDeleted(null);
      setActiveYear('all');
      setActiveCategory('All');
      setNotice(editingMilestone ? 'Milestone updated.' : 'Milestone added to the timeline.');
    } catch (error) {
      setEditorError(getStorageErrorMessage(error, 'Could not save this milestone.'));
    } finally {
      setSaving(false);
    }
  }, [editingMilestone]);

  const handleDelete = useCallback(async () => {
    if (!selectedMilestone) return;
    const confirmed = window.confirm(`Delete “${selectedMilestone.title}” from the Timeline preview?`);
    if (!confirmed) return;
    try {
      setStorageError('');
      await removeMilestone(selectedMilestone.id);
      setMilestones((items) => items.filter((item) => item.id !== selectedMilestone.id));
      setLastDeleted(selectedMilestone);
      setSelectedMilestone(null);
      setStorageError('');
      setNotice('Milestone deleted from this browser preview.');
    } catch (error) {
      setStorageError(getStorageErrorMessage(error, 'Could not delete this milestone.'));
    }
  }, [selectedMilestone]);

  const handleUndoDelete = useCallback(async () => {
    if (!lastDeleted) return;
    try {
      await saveMilestone(lastDeleted);
      setMilestones((items) => sortMilestones([...items.filter((item) => item.id !== lastDeleted.id), lastDeleted]));
      setLastDeleted(null);
      setActiveYear('all');
      setActiveCategory('All');
      setStorageError('');
      setNotice('Deletion undone. The milestone is back on the timeline.');
    } catch (error) {
      setStorageError(getStorageErrorMessage(error, 'Could not restore this milestone.'));
    }
  }, [lastDeleted]);

  const startEdit = () => {
    setEditingMilestone(selectedMilestone);
    setSelectedMilestone(null);
    setEditorError('');
    setEditorOpen(true);
    setNotice('');
  };

  const startCreate = () => {
    setPageBuilderOpen(false);
    setPageDraft(null);
    setEditingMilestone(null);
    setEditorError('');
    setEditorOpen(true);
    setNotice('');
  };

  const openPageBuilder = () => {
    setPageDraft(cloneTimelinePageConfig(pageConfig));
    setPageBuilderOpen(true);
    setNotice('');
  };

  const updatePageDraft = (updater) => {
    setPageDraft((current) => {
      const base = current || cloneTimelinePageConfig(pageConfig);
      return updater(base);
    });
  };

  const changePageLayout = (layout) => updatePageDraft((config) => ({ ...config, layout }));

  const changeWidgetContent = (widgetId, field, value) => updatePageDraft((config) => ({
    ...config,
    widgets: config.widgets.map((widget) => widget.id === widgetId
      ? { ...widget, content: { ...widget.content, [field]: value } }
      : widget),
  }));

  const changeWidgetEnabled = (widgetId, enabled) => updatePageDraft((config) => ({
    ...config,
    widgets: config.widgets.map((widget) => widget.id === widgetId ? { ...widget, enabled } : widget),
  }));

  const moveWidget = (widgetId, direction) => updatePageDraft((config) => {
    const index = config.widgets.findIndex((widget) => widget.id === widgetId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= config.widgets.length) return config;
    const widgets = [...config.widgets];
    [widgets[index], widgets[nextIndex]] = [widgets[nextIndex], widgets[index]];
    return { ...config, widgets };
  });

  const removeWidget = (widgetId) => updatePageDraft((config) => ({
    ...config,
    widgets: config.widgets.filter((widget) => widget.id !== widgetId),
  }));

  const addWidget = (type) => updatePageDraft((config) => ({
    ...config,
    widgets: [...config.widgets, createPageWidget(type)],
  }));

  const savePageDraft = () => {
    try {
      const saved = saveTimelinePageConfig(pageDraft || pageConfig);
      setPageConfig(saved);
      setPageDraft(null);
      setPageBuilderOpen(false);
      setNotice('Page setup saved in this browser preview.');
      setStorageError('');
    } catch (error) {
      setStorageError(error.message || 'Could not save the page setup in this browser.');
    }
  };

  const discardPageDraft = () => {
    setPageDraft(null);
    setPageBuilderOpen(false);
  };

  const scrollHorizontalTrack = (direction) => {
    horizontalTrackRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <main ref={shellRef} className="timeline-shell">
      <div className="timeline-atmosphere" aria-hidden="true">
        <span className="ambient-glow" />
      </div>
      <div ref={ambienceRef} className="timeline-ambience" aria-hidden="true">
        <canvas className="ambient-network" />
      </div>
      <nav className="timeline-site-nav" aria-label="GRID site navigation">
        {SITE_NAV_ITEMS.map((item) => (
          <a key={item.label} href={item.href} aria-current={item.current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="timeline-container">
        <div className={`timeline-page-widgets timeline-layout-${activePageConfig.layout}`}>
          {visiblePageWidgets.map((widget) => {
            if (widget.type === 'hero') {
              return (
                <header className="timeline-hero" key={widget.id}>
                  <div className="hero-overline"><span className="live-dot" /> {widget.content.eyebrow}</div>
                  <div className="hero-layout">
                    <div>
                      <h1>{widget.content.title.split('\n').map((line, index) => <span className={`hero-title-line ${index > 0 ? 'hero-title-line-accent' : ''}`} key={`${widget.id}-line-${index}`}>{line}</span>)}</h1>
                      <p className="hero-description">{widget.content.description}</p>
                    </div>
                    <div className="hero-aside">
                      <span className="hero-index">{widget.content.asideLabel}</span>
                      <p>{widget.content.asideDescription}</p>
                    </div>
                  </div>
                  <div className="hero-rule"><span>SCROLL TO EXPLORE</span><span className="hero-rule-line" /><span>{milestones.length.toString().padStart(2, '0')} MILESTONES</span></div>
                </header>
              );
            }

            if (widget.type === 'intro') {
              return (
                <section className="timeline-section timeline-intro-widget" key={widget.id} aria-labelledby={`timeline-heading-${widget.id}`}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">{widget.content.eyebrow}</span>
                      <h2 id={`timeline-heading-${widget.id}`}>{widget.content.title}<span className="accent-period">.</span></h2>
                    </div>
                    <p>{widget.content.description}</p>
                  </div>
                </section>
              );
            }

            if (widget.type === 'text') {
              return (
                <section className="page-content-widget" key={widget.id}>
                  {widget.content.eyebrow && <span className="eyebrow">{widget.content.eyebrow}</span>}
                  {widget.content.title && <h2>{widget.content.title}</h2>}
                  {widget.content.body && <p>{widget.content.body}</p>}
                </section>
              );
            }

            if (widget.type === 'quote') {
              return (
                <figure className="page-quote-widget liquid-glass" key={widget.id}>
                  <blockquote>{widget.content.quote}</blockquote>
                  {widget.content.attribution && <figcaption>{widget.content.attribution}</figcaption>}
                </figure>
              );
            }

            if (widget.type === 'timeline') {
              return (
                <section className={`timeline-section timeline-content-widget ${activePageConfig.layout === 'horizontal' ? 'is-horizontal' : 'is-vertical'}`} key={widget.id} aria-label="GRID milestones">
                  {(widget.content.showYearFilter || widget.content.showCategoryFilter) && (
                    <div className={`timeline-filters liquid-glass ${widget.content.showYearFilter ? 'has-year-filter' : ''}`}>
                      {widget.content.showYearFilter && (
                        <div className="year-filter" aria-label="Filter by year">
                          <span className="filter-label">YEAR</span>
                          <button type="button" aria-pressed={activeYear === 'all'} className={activeYear === 'all' ? 'filter-pill active' : 'filter-pill'} onClick={() => setActiveYear('all')}>All</button>
                          {years.map((year) => <button type="button" key={year} aria-pressed={activeYear === year} className={activeYear === year ? 'filter-pill active' : 'filter-pill'} onClick={() => setActiveYear(year)}>{year}</button>)}
                        </div>
                      )}
                      {widget.content.showCategoryFilter && (
                        <label className="category-filter">
                          <span className="filter-label">CATEGORY</span>
                          <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} aria-label="Filter by category">
                            <option>All</option>
                            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  )}

                  {loading ? (
                    <div className="timeline-empty"><span className="loading-mark" /> Loading milestones…</div>
                  ) : filteredMilestones.length === 0 ? (
                    <div className="timeline-empty">
                      <span className="empty-kicker">NO MILESTONES FOUND</span>
                      <h3>{milestones.length ? 'Try another filter.' : 'The first chapter is waiting.'}</h3>
                      <p>{milestones.length ? 'Choose another year or category to see more of the journey.' : 'Once verified milestones are added, they will appear here in chronological order.'}</p>
                      {adminPreview && !milestones.length && <button type="button" className="btn btn-primary" onClick={startCreate}>Add the first milestone</button>}
                    </div>
                  ) : activePageConfig.layout === 'horizontal' ? (
                    <div className="timeline-horizontal-scroller-wrap">
                      <div className="timeline-horizontal-controls">
                        <span>SCROLL TO EXPLORE THE JOURNEY</span>
                        <div>
                          <button type="button" className="timeline-scroll-arrow" onClick={() => scrollHorizontalTrack(-1)} aria-label="Scroll milestones left">←</button>
                          <button type="button" className="timeline-scroll-arrow" onClick={() => scrollHorizontalTrack(1)} aria-label="Scroll milestones right">→</button>
                        </div>
                      </div>
                      <div ref={horizontalTrackRef} className="timeline-horizontal-track" tabIndex={0} role="region" aria-label="Horizontally scrolling GRID milestones">
                        {filteredMilestones.map((item, index) => (
                          <MilestoneCard key={item.id} milestone={item} index={index} layout="horizontal" onOpen={() => setSelectedMilestone(item)} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="timeline-groups">
                      {Object.entries(groupedMilestones).map(([year, items]) => (
                        <section className="timeline-year-group" key={year} aria-labelledby={`year-${widget.id}-${year}`}>
                          <div className="year-heading liquid-glass"><h3 id={`year-${widget.id}-${year}`}>{year}</h3><span>{items.length.toString().padStart(2, '0')} {items.length === 1 ? 'MILESTONE' : 'MILESTONES'}</span></div>
                          <div className="timeline-track">
                            {items.map((item, index) => (
                              <MilestoneCard key={item.id} milestone={item} index={index} onOpen={() => setSelectedMilestone(item)} />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (widget.type === 'footer') {
              return (
                <footer className="timeline-endnote" key={widget.id}>
                  <span>{widget.content.leftLabel}</span>
                  <span>{widget.content.rightLabel.includes('↗') ? <>{widget.content.rightLabel.replace('↗', '')}<i aria-hidden="true">↗</i></> : widget.content.rightLabel}</span>
                </footer>
              );
            }
            return null;
          })}
        </div>
      </div>

      <MilestoneDetails
        milestone={selectedMilestone}
        isAdmin={adminPreview}
        actionError={storageError}
        onClose={() => setSelectedMilestone(null)}
        onEdit={startEdit}
        onDelete={handleDelete}
      />

      <section className="timeline-admin-preview" aria-label="Admin Preview">
        <div className="preview-toolbar liquid-glass">
          <div className="preview-note"><span className="preview-note-dot" /> INTERACTIVE TIMELINE PREVIEW</div>
          <button type="button" className={`admin-toggle ${adminPreview ? 'is-active' : ''}`} onClick={() => {
            setAdminPreview((value) => !value);
            setEditorOpen(false);
            setEditingMilestone(null);
            setPageBuilderOpen(false);
            setPageDraft(null);
          }}>
            <span aria-hidden="true">{adminPreview ? '✓' : '＋'}</span> {adminPreview ? 'Exit admin preview' : 'Admin preview'}
          </button>
        </div>

        {adminPreview && (
          <div className="admin-preview-warning" role="status">
            <strong>Preview mode only.</strong> This switch is not a login system. Before launch, connect it to the main website's authenticated admin permissions and shared API. Page settings and milestone edits in this pilot are saved only in this browser.
          </div>
        )}
        {storageError && <div className="notice notice-error" role="alert">{storageError}</div>}
        {notice && (
          <div className="notice notice-with-action" role="status">
            <span>{notice}</span>
            {lastDeleted && <button type="button" className="notice-undo" onClick={handleUndoDelete}>Undo delete</button>}
          </div>
        )}

        {adminPreview && !editorOpen && (
          <div className="admin-action-row liquid-glass">
            <div><span className="eyebrow">CONTENT MANAGEMENT</span><strong>Manage this Timeline page</strong></div>
            <div className="admin-action-buttons">
              <button type="button" className="btn btn-ghost" onClick={openPageBuilder}>Edit page widgets</button>
              <button type="button" className="btn btn-primary" onClick={startCreate}>＋ Add milestone</button>
            </div>
          </div>
        )}

        {adminPreview && pageBuilderOpen && !editorOpen && (
          <TimelinePageBuilder
            config={pageDraft || pageConfig}
            onLayoutChange={changePageLayout}
            onContentChange={changeWidgetContent}
            onEnabledChange={changeWidgetEnabled}
            onMove={moveWidget}
            onRemove={removeWidget}
            onAdd={addWidget}
            onSave={savePageDraft}
            onCancel={discardPageDraft}
          />
        )}

        {editorOpen && adminPreview && (
          <MilestoneEditor
            key={editingMilestone?.id || 'new-milestone'}
            milestone={editingMilestone}
            saving={saving}
            saveError={editorError}
            onDraftChange={() => setEditorError('')}
            onSave={handleSave}
            onCancel={() => { setEditorOpen(false); setEditingMilestone(null); }}
          />
        )}
      </section>

    </main>
  );
}
