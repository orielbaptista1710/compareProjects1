// backend/services/locationSearchService.js
import Property from "../models/Property.js";
import { createCache } from "../utils/withCache.js";

const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100; // same cap as sanitiseQuery in searchService.js
export const LOCATION_CACHE_MAX_KEYS = 2000;

// Own cache: keys are user-typed text, so they mustn't fill the shared cache.
const withLocationCache = createCache({ name: "location-search", maxKeys: LOCATION_CACHE_MAX_KEYS });

// Matches a trailing directional word so "Andheri East" -> "Andheri".
// Extend this list if your data uses compound directions (e.g. "North West").
const DIRECTIONAL_SUFFIX = /\s+(east|west|north|south|central)$/i;
const getBaseLocality = (locality) => locality.replace(DIRECTIONAL_SUFFIX, "").trim();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const rankResults = (results, query) => {
  const q = query.toLowerCase();
  return results
    .map((r) => {
      const label = r.label.toLowerCase();
      let score = 0;
      if (label === q) score += 100;
      else if (label.startsWith(q)) score += 50;
      else score += 10;
      if (r.type === "city") score += 5;
      if (r.type === "locality-group") score += 3; // surface the "all areas" option slightly above its members
      return { ...r, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    // eslint-disable-next-line no-unused-vars -- destructuring strips _score off before returning
    .map(({ _score, ...r }) => r);
};

/**
 * Groups raw locality docs (one per distinct locality string) by their
 * base name, so "Andheri East" + "Andheri West" become:
 *   - two individual entries
 *   - one "Andheri — All areas" entry covering both, only when there's
 *     more than one variant sharing that base.
 */
const buildLocalityResults = (localityDocs) => {
  const groups = new Map(); // key: `${base}|${city}` -> { base, city, members: [{locality, count}] }

  localityDocs.forEach(({ _id, count }) => {
    const base = getBaseLocality(_id.locality);
    const key = `${base}|${_id.city}`;
    if (!groups.has(key)) groups.set(key, { base, city: _id.city, members: [] });
    groups.get(key).members.push({ locality: _id.locality, count });
  });

  const results = [];
  groups.forEach(({ base, city, members }) => {
    members.forEach((m) => {
      results.push({
        type: "locality",
        label: `${m.locality}, ${city}`,
        city,
        localities: [m.locality],
      });
    });

    if (members.length > 1) {
      results.push({
        type: "locality-group",
        label: `${base} — All areas, ${city}`,
        city,
        localities: members.map((m) => m.locality),
        areaCount: members.length,
      });
    }
  });

  return results;
};

const searchLocationsRaw = async (query) => {
  const safe = escapeRegex(query.trim());
  const pattern = new RegExp(safe, "i");

  // TODO(scale): once city/locality counts grow, replace distinct/aggregate
  // with a dedicated Location collection + text index.
  const [cityMatches, localityDocs] = await Promise.all([
    Property.distinct("city", { status: "approved", city: pattern }),
    Property.aggregate([
      { $match: { status: "approved", locality: pattern } },
      { $group: { _id: { locality: "$locality", city: "$city" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }, // wider net than MAX_RESULTS since grouping can collapse entries
    ]),
  ]);

  const results = [
    ...cityMatches.map((city) => ({ type: "city", label: city, city, localities: [] })),
    ...buildLocalityResults(localityDocs),
  ];

  return rankResults(results, query).slice(0, MAX_RESULTS);
};

export const searchLocations = async (query) => {
  // Trim first, then cap (same order as sanitiseQuery), so leading spaces
  // don't eat into the length budget.
  // Control characters (a null byte makes the Mongo regex throw, a 500) can't
  // be part of a place name, so turn them into spaces (a tab or newline between
  // two words must still separate them); trim below tidies the edges.
  // eslint-disable-next-line no-control-regex -- replacing them is the point
  const clean = typeof query === "string" ? query.replace(/[\u0000-\u001f\u007f]/g, " ") : "";
  const trimmed = clean.trim().slice(0, MAX_QUERY_LENGTH).trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const cacheKey = `location-search:${trimmed.toLowerCase()}`;
  return withLocationCache(cacheKey, () => searchLocationsRaw(trimmed), { ttl: 300 });
};