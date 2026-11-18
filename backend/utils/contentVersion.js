// backend/utils/contentVersion.js
//
// A listing's contentVersion goes up by one on every edit that changes it
// (propertyController.updateProperty). A review carries the version the admin
// looked at, and only applies if the listing is still at that version, so an
// admin can't approve content they never saw (docs/review FORM-02).
//
// Listings saved before the field existed have no value: that counts as 0.

/** Mongo filter value matching `version`, including "no value yet" for 0. */
export const versionMatch = (version) => (version === 0 ? { $in: [0, null] } : version);

/** The stored version of a listing (plain object or document). */
export const currentVersion = (listing) => listing?.contentVersion ?? 0;

/**
 * A version sent by the admin UI: a whole number from 0 up, or null when it is
 * missing or malformed (numbers sent as strings are accepted).
 */
export const readVersion = (value) => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
};
