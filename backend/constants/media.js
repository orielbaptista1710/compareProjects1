// constants/media.js
//
// Limits and names for files posters upload with a listing (photos, brochure).
// Keep in sync with frontend-vite/src/constants/media.js.

// Tabs in the form's photo section; stored on each gallery photo.
export const PHOTO_CATEGORIES = Object.freeze([
  'exterior',
  'living_room',
  'bedroom',
  'bathroom',
  'kitchen',
  'interior',
  'floor_plan',
  'master_plan',
  'location_map',
  'other',
]);

// What may be uploaded. The browser resizes photos before upload, so these are
// the sizes of the stored files, not of the photo the poster picked.
//   image    — the large photo (longest side about 1600px)
//   thumb    — its small version for cards and lists
//   brochure — one PDF per listing
export const MEDIA_KINDS = Object.freeze({
  image: Object.freeze({ types: ['image/webp', 'image/jpeg'], maxBytes: 1.5 * 1024 * 1024 }),
  thumb: Object.freeze({ types: ['image/webp', 'image/jpeg'], maxBytes: 200 * 1024 }),
  brochure: Object.freeze({ types: ['application/pdf'], maxBytes: 10 * 1024 * 1024 }),
});

export const FILE_EXTENSIONS = Object.freeze({
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf',
});

export const MAX_GALLERY_PHOTOS = 30;
// One request may ask for this many upload links (2 photos × large + thumb).
export const MAX_SIGN_BATCH = 4;
export const UPLOAD_URL_TTL_SECONDS = 300;
