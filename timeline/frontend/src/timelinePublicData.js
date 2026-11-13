import { orderTimelineMilestones } from './timelineAdminApi.js';

export function localMilestoneSourceId(id) {
  return `grid-timeline-pilot:indexeddb:v1:${id}`;
}

/**
 * Merge published server rows with the read-only legacy browser store.
 * An imported local row is suppressed from display only when the server
 * explicitly returns its stable source ID; the IndexedDB row is never changed.
 */
export function mergeTimelineMilestones(localMilestones = [], publishedMilestones = []) {
  const published = publishedMilestones.filter((item) => item?.isPublished === true);
  const publishedSources = new Set(published.map((item) => item.sourceId).filter(Boolean));
  const publishedIds = new Set(published.map((item) => item.id));
  const legacy = localMilestones.filter((item) => (
    !publishedIds.has(item.id)
    && !publishedSources.has(localMilestoneSourceId(item.id))
  ));
  return orderTimelineMilestones([...published, ...legacy]);
}
