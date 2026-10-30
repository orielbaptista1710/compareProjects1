// backend/utils/projectKey.js
//
// Single source of truth for turning a listing's developer/project/location
// into the key used to group BHK variants of the same project onto one card.
// Used by Property's pre('validate') hook and by scripts/backfillProjectKey.js
// (bulk ops like insertMany bypass hooks, so anything that bulk-writes
// properties must call this directly instead of relying on the hook).
import slugify from 'slugify';

/**
 * Returns a slug built from developerName + projectName + locality/city, or
 * null when there isn't enough information to safely group this listing with
 * others (no projectName means we can't tell which project it belongs to).
 */
export function buildProjectKey({ developerName, projectName, city, locality } = {}) {
  if (!developerName || !projectName) return null;

  const localityPart = locality || city;
  if (!localityPart) return null;

  const raw = [developerName, projectName, localityPart].join(' ');
  return slugify(raw, { lower: true, strict: true, trim: true }) || null;
}
