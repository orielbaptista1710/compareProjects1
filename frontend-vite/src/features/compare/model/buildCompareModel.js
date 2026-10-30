// Builds the whole compare table in one pass so rendering is just mapping
// over precomputed strings. Pure — no React — so it's cheap to memoise and
// easy to test.
import { COMPARE_SECTIONS } from "../config/compareSections";

const EMPTY = "—";

const toCell = (value) => {
  if (value == null) return EMPTY;
  const text = String(value).trim();
  return text === "" ? EMPTY : text;
};

const hasDifferences = (cells) => new Set(cells).size > 1;

// Adds hasDiff: does any row in this section differ? Lets "Only differences"
// mode show "All the same" instead of an empty section.
const withHasDiff = (section) => ({ ...section, hasDiff: section.rows.some((r) => r.isDiff) });

const buildFieldSection = (section, properties) => {
  const rows = [];
  for (const row of section.rows) {
    const cells = properties.map((p) => toCell(row.get(p)));
    if (cells.every((c) => c === EMPTY)) continue;
    rows.push({ id: row.id, label: row.label, kind: row.kind, cells, isDiff: hasDifferences(cells) });
  }
  return rows.length ? withHasDiff({ id: section.id, title: section.title, rows }) : null;
};

// amenities, facilities and security are free-text lists; merge them into
// one list of trimmed names per property.
const amenityNames = (p) =>
  [p.amenities, p.facilities, p.security]
    .flatMap((list) => (Array.isArray(list) ? list : []))
    .filter((a) => typeof a === "string" && a.trim())
    .map((a) => a.trim());

const buildAmenitySection = (properties) => {
  const labels = new Map(); // lowercase key -> first-seen display name
  const sets = properties.map((p) => {
    const keys = new Set();
    for (const name of amenityNames(p)) {
      const key = name.toLowerCase();
      keys.add(key);
      if (!labels.has(key)) labels.set(key, name);
    }
    return keys;
  });
  if (!labels.size) return null;

  const rows = [...labels]
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([key, label]) => {
      const cells = sets.map((s) => s.has(key));
      return { id: `amenity-${key}`, label, kind: "check", cells, isDiff: hasDifferences(cells) };
    });

  return withHasDiff({
    id: "amenities",
    title: "Amenities & Features",
    rows,
    counts: sets.map((s) => s.size),
    total: labels.size,
  });
};

export const buildCompareModel = (properties = []) => {
  const list = Array.isArray(properties) ? properties.filter(Boolean) : [];
  if (!list.length) return [];

  return [
    ...COMPARE_SECTIONS.map((section) => buildFieldSection(section, list)),
    buildAmenitySection(list),
  ].filter(Boolean);
};
