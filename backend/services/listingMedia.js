// services/listingMedia.js
//
// Checks the photo and brochure links on a listing before it is saved.
//
// The browser uploads straight to storage, so by the time a listing arrives it
// only carries links. A link the listing didn't already have must:
//   1. point at our storage (not any other site),
//   2. sit in the poster's own folder (not someone else's upload),
//   3. exist, with an allowed type and size for what it is used as.
// Links the listing already had are left alone, so older listings with
// Cloudinary photos can still be edited.
//
// Does nothing while media storage is off (services/mediaStorage.js).
import { MEDIA_KINDS } from '../constants/media.js';
import { headObject, isMediaStorageEnabled, keyFromPublicUrl, ownerKeyPrefix } from './mediaStorage.js';

/** Every stored-file link on a listing, with what kind of file it must be. */
export const mediaRefs = (listing = {}) =>
  [
    ['image', listing.coverImage?.url],
    ['thumb', listing.coverImage?.thumbnail],
    ...(listing.galleryImages ?? []).flatMap((img) => [['image', img?.url], ['thumb', img?.thumbnail]]),
    ...(listing.floorPlans ?? []).map((plan) => ['image', plan?.imageUrl]),
    ...(listing.mediaFiles ?? []).flatMap((file) => [['image', file?.src], ['thumb', file?.thumbnail]]),
    ...(listing.virtualTours ?? []).map((tour) => ['thumb', tour?.thumbnail]),
    ['brochure', listing.brochure?.url],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([kind, url]) => ({ kind, url }));

const fail = (status, message) => ({ status, message });

/**
 * @param {object} data      validated listing fields being saved
 * @param {object} owner     req.listingOwner
 * @param {object} [existing] the saved listing (plain object) when editing
 * @returns {Promise<null | { status: number, message: string }>} null when fine
 */
export const verifyListingMedia = async (data, owner, existing = null) => {
  if (!isMediaStorageEnabled()) return null;

  const known = new Set(mediaRefs(existing ?? {}).map((ref) => ref.url));
  const prefix = ownerKeyPrefix(owner);
  const toCheck = new Map(); // key → kind

  for (const { kind, url } of mediaRefs(data)) {
    if (known.has(url)) continue;
    const key = keyFromPublicUrl(url);
    if (!key || !key.startsWith(prefix)) {
      return fail(400, 'Photos and documents must be uploaded from the listing form.');
    }
    toCheck.set(key, kind);
  }

  let stored;
  try {
    stored = await Promise.all([...toCheck].map(async ([key, kind]) => ({ kind, file: await headObject(key) })));
  } catch {
    return fail(503, "We couldn't check your uploaded files just now. Please try again in a minute.");
  }

  for (const { kind, file } of stored) {
    if (!file) {
      return fail(400, "One of your files didn't finish uploading. Remove it and add it again.");
    }
    const rule = MEDIA_KINDS[kind];
    if (!rule.types.includes(file.contentType) || !(file.size > 0 && file.size <= rule.maxBytes)) {
      return fail(400, 'One of your files is too large or not an allowed type. Remove it and add it again.');
    }
  }
  return null;
};
