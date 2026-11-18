// features/developer-dashboard/property-form/draftValues.js
// What goes into a draft, and how two sets of form values are compared.
import { defaultPropertyValues } from "../../../components/DevDashboardPageComponents/SellPropertyFormComponents/propertySchema";

const FIELDS = Object.keys(defaultPropertyValues);

/**
 * Only the fields the form collects. The form's values can also carry whatever a
 * saved listing came with (ids, status, review fields); none of that belongs in
 * localStorage, and a draft read back is trimmed the same way.
 */
export const pickFormFields = (values = {}) =>
  Object.fromEntries(FIELDS.filter((key) => key in values).map((key) => [key, values[key]]));

// "" / null / undefined are the same "empty"; numbers and strings that look the
// same count as equal (an input hands back "900" where a saved listing had 900).
const normalise = (value) => {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(normalise); // strings, or photo objects
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalise(v)]));
  }
  return String(value);
};

/** A stable string for a set of form values, so "did anything change?" is a string compare. */
export const serializeValues = (values = {}) =>
  JSON.stringify(FIELDS.map((key) => normalise(values[key])));
