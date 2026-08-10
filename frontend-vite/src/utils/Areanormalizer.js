// /**
//  * areaNormalizer - not currently in use 
//  *
//  * Cleans dirty area data coming from the database or property imports
//  * before it is used in filter queries or sent to the frontend.
//  *
//  * Problems observed in the data:
//  *   - maxArea stored as a string range e.g. "330 - 575"
//  *   - minArea = 0 when a real lower bound exists inside a string max
//  *   - unit = "sqyard" which is outside the schema enum
//  *   - minArea === maxArea (likely a data-entry mistake, treat as exact)
//  */

// /* ─────────────────────────────────────────
//    Allowed units + a mapping for known aliases
// ───────────────────────────────────────── */
// const VALID_UNITS = new Set(["sqft", "sqmts", "guntas", "hectares", "acres"]);

// const UNIT_ALIASES = {
//   sqyard:      "sqmts",   // closest reasonable mapping
//   "sq yard":   "sqmts",
//   "sq.yard":   "sqmts",
//   "sq ft":     "sqft",
//   "sq.ft":     "sqft",
//   sqfeet:      "sqft",
//   "sq meter":  "sqmts",
//   "sq metre":  "sqmts",
//   sqmeter:     "sqmts",
//   sqmetre:     "sqmts",
//   gunta:       "guntas",
//   hectare:     "hectares",
//   acre:        "acres",
// };

// /**
//  * Resolve a raw unit string to a valid enum value.
//  * Falls back to "sqft" if unknown.
//  */
// const resolveUnit = (raw) => {
//   if (!raw) return "sqft";
//   const lower = String(raw).trim().toLowerCase();
//   if (VALID_UNITS.has(lower)) return lower;
//   if (UNIT_ALIASES[lower])    return UNIT_ALIASES[lower];
//   console.warn(`[areaNormalizer] Unknown unit "${raw}", defaulting to sqft`);
//   return "sqft";
// };

// /**
//  * Parse a value that may be:
//  *   - a number        → 1100
//  *   - a numeric string → "1100"
//  *   - a range string  → "330 - 575"  (returns { lo: 330, hi: 575 })
//  *   - null / undefined → null
//  *
//  * Returns { lo: number, hi: number } always.
//  */
// const parseAreaValue = (raw) => {
//   if (raw == null || raw === "") return null;

//   const str = String(raw).trim();

//   // Range pattern: "330 - 575" or "330-575" or "330 to 575"
//   const rangeMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/i);
//   if (rangeMatch) {
//     return { lo: parseFloat(rangeMatch[1]), hi: parseFloat(rangeMatch[2]) };
//   }

//   const n = parseFloat(str);
//   if (!isNaN(n)) return { lo: n, hi: n };

//   console.warn(`[areaNormalizer] Unparseable area value: "${raw}"`);
//   return null;
// };

// /**
//  * normalizeAreaDoc
//  *
//  * Takes a raw MongoDB document's area field (or the minArea/maxArea
//  * top-level fields from legacy imports) and returns a clean
//  * { minArea, maxArea, unit } object safe to store or query with.
//  *
//  * @param {object} doc - raw document (may have area.value, minArea, maxArea, unit)
//  * @returns {{ minArea: number, maxArea: number, unit: string } | null}
//  */
// const normalizeAreaDoc = (doc) => {
//   if (!doc) return null;

//   const unit = resolveUnit(doc.unit ?? doc.area?.unit);

//   // Try top-level minArea/maxArea first (legacy import shape)
//   const rawMin = doc.minArea ?? doc.area?.value ?? null;
//   const rawMax = doc.maxArea ?? doc.area?.value ?? null;

//   const parsedMin = parseAreaValue(rawMin);
//   const parsedMax = parseAreaValue(rawMax);

//   if (!parsedMin && !parsedMax) return null;

//   // If maxArea was a range string "330 - 575", use its bounds
//   let minArea = parsedMin?.lo ?? 0;
//   let maxArea = parsedMax?.hi ?? parsedMax?.lo ?? minArea;

//   // If the range was entirely inside maxArea string (minArea was 0 / absent)
//   if (parsedMax && parsedMax.lo !== parsedMax.hi) {
//     minArea = parsedMax.lo;
//     maxArea = parsedMax.hi;
//   }

//   // Guard: ensure min <= max
//   if (minArea > maxArea) {
//     [minArea, maxArea] = [maxArea, minArea];
//   }

//   return { minArea, maxArea, unit };
// };

// /**
//  * buildAreaQuery
//  *
//  * Builds a Mongoose query fragment for area filtering.
//  * Handles unit mismatch by only matching same-unit documents —
//  * cross-unit conversion is intentionally out of scope to avoid
//  * precision errors across incompatible units (sqft vs acres).
//  *
//  * @param {object} params - { areaMin, areaMax, areaUnit }
//  * @returns {object} Mongoose query fragment, or {} if no area params
//  */
// const buildAreaQuery = ({ areaMin, areaMax, areaUnit } = {}) => {
//   if (!areaMin && !areaMax) return {};

//   const unit  = resolveUnit(areaUnit);
//   const query = { "area.unit": unit };

//   const min = areaMin != null ? Number(areaMin) : null;
//   const max = areaMax != null ? Number(areaMax) : null;

//   if (!isNaN(min) && min > 0) {
//     query["area.value"] = { ...query["area.value"], $gte: min };
//   }
//   if (!isNaN(max) && max > 0) {
//     query["area.value"] = { ...query["area.value"], $lte: max };
//   }

//   return query;
// };

// /**
//  * sanitizePropertyAreaBeforeSave
//  *
//  * Call this in your Mongoose pre-save hook or before bulk-inserting
//  * scraped/imported properties to ensure area data is always clean.
//  *
//  * Usage in your Property model:
//  *
//  *   PropertySchema.pre("save", function (next) {
//  *     const cleaned = sanitizePropertyAreaBeforeSave(this);
//  *     if (cleaned) {
//  *       this.area = { value: cleaned.minArea, unit: cleaned.unit };
//  *       // if you store minArea/maxArea separately:
//  *       this.minArea = cleaned.minArea;
//  *       this.maxArea = cleaned.maxArea;
//  *     }
//  *     next();
//  *   });
//  */
// const sanitizePropertyAreaBeforeSave = (doc) => {
//   return normalizeAreaDoc(doc);
// };

// module.exports = {
//   resolveUnit,
//   parseAreaValue,
//   normalizeAreaDoc,
//   buildAreaQuery,
//   sanitizePropertyAreaBeforeSave,
// };