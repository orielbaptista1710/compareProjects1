// backend/utils/changedFields.js
//
// Which fields a poster's edit actually changes. Compared by hand on purpose:
// Mongoose's own change tracking marks a nested path like `area` or
// `coordinates` as modified every time an object is assigned to it, even with
// identical values, so it would report a change on every save.
//
// `input` is the parsed body from parsePropertyInput (already trimmed, numbers
// already numbers), so plain equality is enough for strings and numbers.

// "" / null / undefined are all "not filled in"
const isBlank = (v) => v === undefined || v === null || v === '';

const same = (current, incoming) => {
  if (isBlank(current) && isBlank(incoming)) return true;
  if (incoming instanceof Date) {
    return current instanceof Date && current.getTime() === incoming.getTime();
  }
  if (Array.isArray(incoming)) {
    return (
      Array.isArray(current) &&
      current.length === incoming.length &&
      incoming.every((item, i) => same(current[i], item))
    );
  }
  if (incoming && typeof incoming === 'object') {
    // Only the keys that were sent: a stored `coordinates` also carries source,
    // confidence and geocodedAt, which the form never sends.
    return Object.entries(incoming).every(
      ([key, value]) => value === undefined || same(current?.[key], value)
    );
  }
  return current === incoming;
};

/**
 * @param {object} current  the saved listing as a plain object
 * @param {object} input    the fields the poster sent (undefined = not sent)
 * @returns {string[]} names of the fields whose value differs
 */
export const changedFields = (current, input) =>
  Object.keys(input).filter((key) => input[key] !== undefined && !same(current?.[key], input[key]));
