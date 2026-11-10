export const CATEGORIES = ['Events', 'Workshops', 'Achievements', 'Projects', 'Community'];
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_PHOTO_SIZE = 40 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 6000;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

export function isSupportedImage(file) {
  if (!file || typeof file.name !== 'string') return false;
  if (file.type) return ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase());
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

export function getStoredPhotoBytes(images = []) {
  return images.reduce((total, image) => total + (image.blob?.size || 0), 0);
}

export function getNewPhotoBytes(files = []) {
  return files.reduce((total, file) => total + (file.size || 0), 0);
}

function isValidCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateMilestoneDraft(draft, existingImages = [], newImages = []) {
  if (!draft.title?.trim()) return 'Add a title before saving.';
  if (draft.title.trim().length > 90) return 'Keep the title under 90 characters.';
  if (!CATEGORIES.includes(draft.category)) return 'Choose a valid milestone category.';
  if (!isValidCalendarDate(draft.date)) return 'Choose a valid date for this milestone.';
  if (draft.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return 'Enter a valid time.';
  if (!draft.summary?.trim()) return 'Add a short description for the timeline card.';
  if (draft.summary.trim().length > 180) return 'Keep the short description under 180 characters.';
  if ((draft.location || '').trim().length > 100) return 'Keep the location under 100 characters.';
  if (!draft.description?.trim()) return 'Add the full milestone information before saving.';
  if (draft.description.length > MAX_DESCRIPTION_LENGTH) {
    return `Keep the full description under ${MAX_DESCRIPTION_LENGTH.toLocaleString('en-IN')} characters.`;
  }

  const photoCount = existingImages.length + newImages.length;
  if (photoCount > MAX_PHOTOS) return `You can add up to ${MAX_PHOTOS} photos per milestone.`;
  if (newImages.some((file) => !isSupportedImage(file))) {
    return 'Use JPG, PNG, WebP, GIF or AVIF images. SVG and other file types are not accepted.';
  }
  if (newImages.some((file) => file.size > MAX_PHOTO_SIZE)) return 'Each photo must be 10 MB or smaller.';

  const totalPhotoBytes = getStoredPhotoBytes(existingImages) + getNewPhotoBytes(newImages);
  if (totalPhotoBytes > MAX_TOTAL_PHOTO_SIZE) return 'Keep the combined photo size under 40 MB per milestone.';

  return null;
}

export function getStorageErrorMessage(error, fallback) {
  if (error?.name === 'QuotaExceededError') {
    return 'This browser is running low on storage. Remove a few large photos and try again.';
  }
  if (error?.name === 'SecurityError') {
    return 'Browser storage is blocked. Check your browser privacy settings and try again.';
  }
  return error?.message || fallback;
}
