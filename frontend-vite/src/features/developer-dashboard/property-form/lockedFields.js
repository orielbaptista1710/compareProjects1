// lockedFields.js
// Which location fields an approved listing can no longer change. Mirrors the
// API (lockedChanges in propertyController.js): only a field that already has a
// value is locked, so one that was never filled in stays editable.
import { LOCKED_AFTER_APPROVAL } from "../../../constants/listingRules";

const LOCATION_FIELDS = ["state", "city", "locality", "pincode", "address"];

const hasPin = (coordinates) => coordinates?.lat != null && coordinates?.lng != null;
const hasText = (value) => value != null && String(value).trim() !== "";

/** @returns {string[]} the locked location fields (and "coordinates" for a saved pin) */
export const lockedFieldsOf = (saved = {}) =>
  LOCKED_AFTER_APPROVAL.filter((field) => {
    if (field === "coordinates") return hasPin(saved.coordinates);
    return LOCATION_FIELDS.includes(field) && hasText(saved[field]);
  });
