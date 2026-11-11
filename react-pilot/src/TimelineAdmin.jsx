import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from './timelineValidation.js';
import { uploadAdminImage } from './timelineAdminApi.js';
import { countLocalMilestonePhotos, inspectLocalMilestones } from './timelineRepository.js';
import {
  applyCanonicalMilestoneOrder, createAdminMilestone, deleteAdminMilestone, listAdminMilestones, loginAdmin,
  importLocalMilestone, logoutAdmin, orderTimelineMilestones, reorderAdminMilestones, restoreAdminSession,
  updateAdminMilestone,
} from './timelineAdminApi.js';

const emptyDraft = () => ({ title: '', category: CATEGORIES[0], date: '', time: '', location: '', summary: '', description: '', images: [], isPublished: false });

export default function TimelineAdmin({ children, MilestoneEditorComponent, onPublicMilestonesChange }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [localReview, setLocalReview] = useState(null);
  const [localReviewError, setLocalReviewError] = useState('');
  const [selectedLocalIds, setSelectedLocalIds] = useState([]);
  const [importing, setImporting] = useState(false);

  const expireSession = useCallback((error) => {
    if (error?.status === 401) {
      setAdmin(null); setCsrfToken(''); setMilestones([]); setEditor(null);
      setAuthError('Your Timeline admin session expired. Sign in again to continue.');
    }
  }, []);

  const refreshMilestones = useCallback(async () => {
    setListLoading(true); setListError('');
    try {
      const result = await listAdminMilestones();
      if (!Array.isArray(result.milestones)) throw new Error('The Timeline API returned an unexpected milestone list.');
      setMilestones(orderTimelineMilestones(result.milestones));
    } catch (error) { expireSession(error); setListError(error.message || 'Could not load milestones.'); }
    finally { setListLoading(false); }
  }, [expireSession]);

  const refreshAfterMutation = useCallback(async () => {
    await refreshMilestones();
    try {
      await onPublicMilestonesChange?.();
    } catch (error) {
      setActionError(`The change was saved, but the public Timeline could not refresh: ${error.message || 'network error'}`);
    }
  }, [onPublicMilestonesChange, refreshMilestones]);

  useEffect(() => {
    let active = true;
    restoreAdminSession().then((result) => {
      if (!active) return;
      if (result.authenticated) { setAdmin(result.admin); setCsrfToken(result.csrfToken); }
    }).catch((error) => { if (active) setAuthError(error.message || 'Could not check the admin session.'); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (admin) refreshMilestones(); }, [admin, refreshMilestones]);

  const visible = useMemo(() => milestones.filter((item) => {
    const matchesSearch = `${item.title} ${item.summary} ${item.category} ${item.date}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || (status === 'published' ? item.isPublished : !item.isPublished);
    return matchesSearch && matchesStatus;
  }), [milestones, query, status]);

  const signIn = async (event) => {
    event.preventDefault(); setAuthLoading(true); setAuthError('');
    try {
      const result = await loginAdmin(username, password);
      setAdmin(result.admin); setCsrfToken(result.csrf_token); setPassword('');
    } catch (error) { setAuthError(error.status === 401 ? 'The username or password was not accepted.' : error.message || 'Sign in failed.'); }
    finally { setAuthLoading(false); }
  };

  const signOut = async () => {
    setAuthLoading(true); setAuthError('');
    try { await logoutAdmin(csrfToken); setAdmin(null); setCsrfToken(''); setMilestones([]); setEditor(null); setNotice('Signed out.'); }
    catch (error) { expireSession(error); setAuthError(error.message || 'Could not sign out.'); }
    finally { setAuthLoading(false); }
  };

  const save = async (draft) => {
    setBusy(true); setActionError(''); setNotice('');
    try {
      const images = [];
      for (const image of draft.images || []) {
        if (image?.url && !image.blob) images.push(image);
        else if (image?.blob) {
          const file = image.blob instanceof File
            ? image.blob
            : new File([image.blob], image.name || 'photo', { type: image.type || image.blob.type || '' });
          images.push(await uploadAdminImage(file, csrfToken));
        }
      }
      const apiDraft = { ...draft, images, isPublished: Boolean(editor?.isPublished), isDemo: Boolean(draft.isDemo) };
      const result = editor?.id
        ? await updateAdminMilestone(editor.id, apiDraft, csrfToken)
        : await createAdminMilestone(apiDraft, csrfToken);
      if (!result.milestone?.id || !result.milestone?.createdAt || !result.milestone?.updatedAt) throw new Error('The Timeline API response is missing canonical milestone values.');
      setMilestones((items) => orderTimelineMilestones([...items.filter((item) => item.id !== result.milestone.id), result.milestone]));
      setEditor(null);
      setNotice(editor?.id ? 'Milestone updated.' : result.milestone.isPublished ? 'Milestone published.' : 'Milestone saved as a draft. Publish it to show it on the public Timeline.');
      await refreshAfterMutation();
    } catch (error) { expireSession(error); setActionError(error.message || 'Could not save milestone.'); }
    finally { setBusy(false); }
  };

  const togglePublished = async (item) => {
    setBusy(true); setActionError('');
    try {
      const result = await updateAdminMilestone(item.id, { ...item, isPublished: !item.isPublished }, csrfToken);
      setMilestones((items) => orderTimelineMilestones(items.map((entry) => entry.id === item.id ? result.milestone : entry)));
      setNotice(result.milestone.isPublished ? 'Milestone published.' : 'Milestone moved to drafts.');
      await refreshAfterMutation();
    } catch (error) { expireSession(error); setActionError(error.message || 'Could not change publication.'); }
    finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}” permanently from the Timeline?`)) return;
    setBusy(true); setActionError('');
    try { await deleteAdminMilestone(item.id, csrfToken); setMilestones((items) => items.filter((entry) => entry.id !== item.id)); setNotice('Milestone deleted.'); await refreshAfterMutation(); }
    catch (error) { expireSession(error); setActionError(error.message || 'Could not delete milestone.'); }
    finally { setBusy(false); }
  };

  const move = async (item, direction) => {
    const index = milestones.findIndex((entry) => entry.id === item.id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= milestones.length) return;
    const reordered = [...milestones]; [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setBusy(true); setActionError('');
    try {
      const result = await reorderAdminMilestones(reordered.map((entry) => entry.id), csrfToken);
      setMilestones(applyCanonicalMilestoneOrder(milestones, result.ids));
      setNotice('Timeline order updated.');
      await refreshAfterMutation();
    } catch (error) { expireSession(error); setActionError(error.message || 'Could not reorder milestones.'); }
    finally { setBusy(false); }
  };

  const reviewLocalData = async () => {
    setLocalReviewError('');
    try {
      const records = await inspectLocalMilestones();
      setLocalReview(records);
      const imported = new Set(milestones.map((item) => item.sourceId).filter(Boolean));
      setSelectedLocalIds(records.filter((item) => !imported.has(`grid-timeline-pilot:indexeddb:v1:${item.id}`)).map((item) => String(item.id)));
    } catch (error) {
      setLocalReviewError(error.message || 'Could not inspect browser Timeline records.');
    }
  };

  const importSelectedLocalData = async () => {
    if (!localReview || !selectedLocalIds.length) return;
    setImporting(true); setLocalReviewError(''); setNotice('');
    const selected = localReview.filter((item) => selectedLocalIds.includes(String(item.id)));
    let importedCount = 0;
    let alreadyImportedCount = 0;
    try {
      for (const milestone of selected) {
        const photos = (milestone.images || []).filter((image) => image?.blob);
        const result = await importLocalMilestone({
          milestone,
          sourceId: `grid-timeline-pilot:indexeddb:v1:${milestone.id}`,
          photos,
        }, csrfToken);
        if (result.imported) importedCount += 1;
        else if (result.alreadyImported) alreadyImportedCount += 1;
      }
      await refreshMilestones();
      try { await onPublicMilestonesChange?.(); }
      catch (error) { setLocalReviewError(`Imported successfully, but the public Timeline could not refresh: ${error.message || 'network error'}`); }
      setNotice(`${importedCount} imported as drafts${alreadyImportedCount ? ` · ${alreadyImportedCount} already imported` : ''}. Original browser records and photos were kept.`);
      setSelectedLocalIds([]);
    } catch (error) {
      expireSession(error);
      setLocalReviewError(`${error.message || 'Import stopped.'} Completed records can be safely retried.`);
    } finally { setImporting(false); }
  };

  return <section className="timeline-admin-preview" aria-label="Timeline administration">
    <div className="preview-toolbar liquid-glass">
      <div className="preview-note"><span className="preview-note-dot" /> TIMELINE ADMINISTRATION</div>
      <button type="button" className="admin-toggle" aria-expanded={panelOpen} onClick={() => setPanelOpen((open) => !open)}>{panelOpen ? 'Close admin' : 'Admin sign in'}</button>
    </div>
    {panelOpen && <div className="timeline-admin-panel liquid-glass">
      {authLoading && !admin ? <p role="status">Checking Timeline admin session…</p> : !admin ? <form className="timeline-admin-login" onSubmit={signIn}>
        <div><span className="eyebrow">RESTRICTED ACCESS</span><h2>Timeline admin</h2><p>Sign in with an account provisioned for the Timeline API.</p></div>
        <label className="field">Username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label className="field">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {(authError || (authLoading && 'Signing in…')) && <p role="alert" className="form-error">{authLoading ? 'Signing in…' : authError}</p>}
        <button className="btn btn-primary" disabled={authLoading}>{authLoading ? 'Signing in…' : 'Sign in'}</button>
      </form> : <>
        <div className="timeline-admin-heading"><div><span className="eyebrow">SIGNED IN AS {admin.username}</span><h2>Milestone management</h2><p>Changes are saved to the Timeline API. Draft milestones stay private; publish a milestone to show it on the public Timeline.</p></div><button type="button" className="btn btn-ghost" disabled={authLoading} onClick={signOut}>{authLoading ? 'Signing out…' : 'Sign out'}</button></div>
        <div className="timeline-admin-stats"><div><strong>{milestones.length}</strong><span>Total milestones</span></div><div><strong>{milestones.filter((item) => item.isPublished).length}</strong><span>Published</span></div><div><strong>{milestones.filter((item) => !item.isPublished).length}</strong><span>Drafts</span></div></div>
        {notice && <p className="notice" role="status">{notice}</p>}{(listError || actionError) && <p className="notice notice-error" role="alert">{actionError || listError}</p>}
        <section className="timeline-local-import" aria-label="Review existing browser Timeline data">
          <div><h3>Existing browser milestones</h3><p>Review local records before importing. Import creates drafts and keeps the IndexedDB records and photos unchanged.</p></div>
          <button className="btn btn-ghost" type="button" onClick={reviewLocalData} disabled={importing}>Review local data</button>
          {localReviewError && <p className="notice notice-error" role="alert">{localReviewError}</p>}
          {localReview && <div className="timeline-local-review">
            <p><strong>{localReview.length}</strong> local milestones · <strong>{countLocalMilestonePhotos(localReview)}</strong> Blob photos</p>
            {!localReview.length ? <p>No existing browser milestones were found.</p> : <ul>{localReview.map((item) => {
              const sourceId = `grid-timeline-pilot:indexeddb:v1:${item.id}`;
              const alreadyImported = milestones.some((entry) => entry.sourceId === sourceId);
              return <li key={String(item.id)}><label><input type="checkbox" checked={!alreadyImported && selectedLocalIds.includes(String(item.id))} disabled={alreadyImported || importing} onChange={(event) => setSelectedLocalIds((ids) => event.target.checked ? [...ids, String(item.id)] : ids.filter((id) => id !== String(item.id)))} /><span>{item.title || 'Untitled milestone'} · {item.date || 'No date'} · {(item.images || []).length} photos ({(item.images || []).filter((image) => image?.blob).length} local files){alreadyImported ? ' · already imported' : ''}</span></label></li>;
            })}</ul>}
            <button className="btn btn-primary" type="button" disabled={importing || !selectedLocalIds.length} onClick={importSelectedLocalData}>{importing ? 'Importing…' : `Import selected as drafts (${selectedLocalIds.length})`}</button>
          </div>}
        </section>
        <div className="timeline-admin-tools"><label className="field">Search milestones<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, summary, category…" /></label><label className="field">Show<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select></label><button className="btn btn-primary" onClick={() => { setActionError(''); setEditor(emptyDraft()); }} disabled={busy}>＋ Create milestone</button></div>
        {editor && MilestoneEditorComponent && (
          <MilestoneEditorComponent
            key={editor.id || 'new-api-milestone'}
            milestone={editor.id ? editor : null}
            saving={busy}
            saveError={actionError}
            onDraftChange={() => setActionError('')}
            onCancel={() => setEditor(null)}
            onSave={save}
          />
        )}
        {listLoading ? <p className="timeline-admin-state" role="status">Loading milestones…</p> : !milestones.length ? <div className="timeline-admin-state"><h3>No server milestones yet</h3><p>The existing browser Timeline remains intact. No local records or photos were imported.</p><button className="btn btn-primary" onClick={() => setEditor(emptyDraft())}>Create first milestone</button></div> : !visible.length ? <p className="timeline-admin-state">No milestones match these filters.</p> : <ol className="timeline-admin-list">{visible.map((item) => <li key={item.id} className="timeline-admin-item liquid-glass"><div className="timeline-admin-item-copy"><span className="eyebrow">{item.category} · {item.date} · {item.isPublished ? 'PUBLISHED' : 'DRAFT — HIDDEN PUBLICLY'}</span><h3>{item.title}</h3><p>{item.summary}</p></div><div className="timeline-admin-item-actions"><button className="btn btn-ghost" disabled={busy || milestones.indexOf(item) === 0} onClick={() => move(item, -1)} aria-label={`Move ${item.title} earlier`}>↑</button><button className="btn btn-ghost" disabled={busy || milestones.indexOf(item) === milestones.length - 1} onClick={() => move(item, 1)} aria-label={`Move ${item.title} later`}>↓</button><button className="btn btn-ghost" disabled={busy} onClick={() => { setActionError(''); setEditor(item); }}>Edit</button><button className="btn btn-ghost" disabled={busy} onClick={() => togglePublished(item)}>{item.isPublished ? 'Unpublish' : 'Publish'}</button><button className="btn btn-danger" disabled={busy} onClick={() => remove(item)}>Delete</button></div></li>)}</ol>}
        {children}
      </>}
    </div>}
  </section>;
}
