/**
 * Get image URL by type from a media object.
 * Falls back to 'original' if the specified type is not available.
 * Optionally allows a final fallback URL if nothing is found.
 *
 * @param {Object} mediaObject - Object containing media URLs.
 * @param {string} type - Requested type (e.g., 'thumbnail', 'gallery').
 * @param {string|null} fallback - Final fallback if nothing is available.
 * @returns {string|null} - Image URL or fallback.
 */
export const getImageUrlByType = (mediaObject, type, fallback = null) => {
  if (!mediaObject || typeof mediaObject !== 'object') return fallback;

  const url = mediaObject[type];
  if (url) return url;

  // Fallback to 'original'
  return mediaObject.original || fallback;
};
