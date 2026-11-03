// Bump PHOTO_VERSION whenever menu photos are replaced in place (same filename),
// so browsers fetch the new file instead of a cached copy.
const PHOTO_VERSION = "4";

export const menuImageUrl = (imagePath) =>
  imagePath ? `/assets/${imagePath}?v=${PHOTO_VERSION}` : null;
