// backend/services/locationSearchService.js
import Property from "../models/Property.js";
import { withCache } from "../utils/withCache.js";

const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;

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
        // eslint-disable-next-line no-unused-vars -- destructuring to strip _score off before returning CHECK THIS 
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
    Property.distinct("city", { city: pattern }),
    Property.aggregate([
      { $match: { locality: pattern } },
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
  const trimmed = (query || "").trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const cacheKey = `location-search:${trimmed.toLowerCase()}`;
  return withCache(cacheKey, () => searchLocationsRaw(trimmed), { ttl: 300 });
};