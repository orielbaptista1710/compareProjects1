// controllers/discoverController.js
import Property from "../models/Property.js";
import { withCache } from "../utils/withCache.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";
import {
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
} from "../models/propertyType.js";

const DISCOVER_CACHE_KEY = "discover:links";
const LINKS_PER_CATEGORY = 20;

// Plural, sentence-case label for each stored propertyType ("Flats in Andheri").
const TYPE_LABELS = {
  "Flats/Apartments": "Flats",
  Villa: "Villas",
  Plot: "Plots",
  "Shop/Showroom": "Shops & showrooms",
  "Industrial Warehouse/Godown": "Warehouses",
  "Office Space": "Office spaces",
  "Commercial Land": "Commercial land",
  "Industrial Building": "Industrial buildings",
};

// Only homes get "2 BHK in X" links; bhk on shops/plots is noise. The link
// sends these types too, because GET /api/properties applies bhk to every type.
const BHK_TYPES = ["Flats/Apartments", "Villa"];

// Order links are interleaved in: "Flats in Mumbai", "Flats in Andheri", "2 BHK in Andheri".
const LINK_KINDS = ["city", "locality", "bhk"];

const normalize = (str = "") =>
  str.toLowerCase().replace(/[-_/]/g, " ").trim();

const isResidential = (type) =>
  RESIDENTIAL_TYPES.some((t) =>
    normalize(type).includes(normalize(t))
  );

const isCommercial = (type) =>
  COMMERCIAL_TYPES.some((t) =>
    normalize(type).includes(normalize(t))
  );

const mapCategory = (type = "") => {
  const t = normalize(type);

  if (isResidential(t)) {
    if (t.includes("plot")) return "plot";
    return "residential";
  }

  if (t.includes("industrial")) return "industrial";

  if (t.includes("shop") || t.includes("showroom")) return "retail";

  if (isCommercial(t)) return "commercial";

  return "commercial";
};

// ─── Aggregation ──────────────────────────────────────────────────────────────
// All grouping, merging and capping runs inside Mongo, so the request only ever
// handles a few hundred small rows in JS, however many listings there are.

const nonEmptyString = { $type: "string", $ne: "" };
const trimmed = (field) => ({ $trim: { input: field } });
const lowerKey = (field) => ({ $toLower: { $trim: { input: field } } });

// Two-step group: first per exact spelling, then per case-insensitive key, so
// "Mumbai"/"mumbai" become one link and we still know each spelling's count.
const mergeSpellings = (keyFields) => [
  {
    $group: {
      _id: { ...keyFields, s: "$name", cs: "$city" },
      n: { $sum: 1 },
    },
  },
  {
    $group: {
      _id: Object.fromEntries(Object.keys(keyFields).map((k) => [k, `$_id.${k}`])),
      count: { $sum: "$n" },
      spellings: { $push: { s: "$_id.s", n: "$n" } },
      citySpellings: { $push: { s: "$_id.cs", n: "$n" } },
    },
  },
];

// Keep only the top LINKS_PER_CATEGORY rows per property type. A category's
// top 20 is always inside the union of its types' top 20s.
const topPerType = [
  { $sort: { count: -1, "_id.c": 1, "_id.k": 1 } },
  { $group: { _id: "$_id.t", top: { $push: "$$ROOT" } } },
  { $project: { top: { $slice: ["$top", LINKS_PER_CATEGORY] } } },
  { $unwind: "$top" },
  { $replaceRoot: { newRoot: "$top" } },
];

const DISCOVER_PIPELINE = [
  {
    $match: {
      status: "approved",
      propertyType: nonEmptyString,
      city: nonEmptyString,
      locality: nonEmptyString,
    },
  },
  {
    $project: {
      _id: 0,
      propertyType: 1,
      bhk: 1,
      city: trimmed("$city"),
      locality: trimmed("$locality"),
      cityKey: lowerKey("$city"),
      locKey: lowerKey("$locality"),
    },
  },
  {
    $facet: {
      city: [
        { $set: { name: "$city" } },
        ...mergeSpellings({ t: "$propertyType", k: "$cityKey" }),
        ...topPerType,
      ],
      // Skip "Flats in Mumbai" twice when a listing's locality is just its city.
      locality: [
        { $match: { $expr: { $ne: ["$locKey", "$cityKey"] } } },
        { $set: { name: "$locality" } },
        ...mergeSpellings({ t: "$propertyType", c: "$cityKey", k: "$locKey" }),
        ...topPerType,
      ],
      // All BHK links are residential, so one global top-N is enough.
      bhk: [
        { $match: { propertyType: { $in: BHK_TYPES }, bhk: { $gt: 0 } } },
        { $set: { name: "$locality" } },
        ...mergeSpellings({ b: "$bhk", c: "$cityKey", k: "$locKey" }),
        { $sort: { count: -1, "_id.c": 1, "_id.k": 1, "_id.b": 1 } },
        { $limit: LINKS_PER_CATEGORY },
      ],
    },
  },
];

// ─── Link building ────────────────────────────────────────────────────────────

// Most-used spelling wins; ties go to the first in code-point order so the
// label never flips between cache rebuilds.
const mainSpelling = (list) =>
  list.reduce((best, x) => (x.n > best.n || (x.n === best.n && x.s < best.s) ? x : best)).s;

// /api/properties matches locality exactly, so send every spelling to keep
// all merged listings reachable. One spelling stays a plain string.
const allSpellings = (list) => {
  const unique = [...new Set(list.map((x) => x.s))].sort();
  return unique.length === 1 ? unique[0] : unique;
};

const typeLabelOf = (t) => TYPE_LABELS[t] ?? t;

const toLinks = ({ city = [], locality = [], bhk = [] }) => {
  const links = [];

  for (const row of city) {
    const name = mainSpelling(row.spellings);
    links.push({
      category: mapCategory(row._id.t),
      kind: "city",
      label: `${typeLabelOf(row._id.t)} in ${name}`,
      params: { propertyType: row._id.t, city: name },
      count: row.count,
    });
  }

  for (const row of locality) {
    const cityName = mainSpelling(row.citySpellings);
    links.push({
      category: mapCategory(row._id.t),
      kind: "locality",
      label: `${typeLabelOf(row._id.t)} in ${mainSpelling(row.spellings)}`,
      cityName,
      params: { propertyType: row._id.t, city: cityName, locality: allSpellings(row.spellings) },
      count: row.count,
    });
  }

  for (const row of bhk) {
    if (!Number.isInteger(row._id.b)) continue;
    const cityName = mainSpelling(row.citySpellings);
    links.push({
      category: "residential",
      kind: "bhk",
      label: `${row._id.b} BHK in ${mainSpelling(row.spellings)}`,
      cityName,
      params: {
        propertyType: BHK_TYPES,
        city: cityName,
        locality: allSpellings(row.spellings),
        bhk: row._id.b,
      },
      count: row.count,
    });
  }

  return links;
};

// Two links with the same text in one tab (the city "Thane" and a locality
// "Thane" in Mumbai) get the city appended to the locality one, so each
// label names exactly one filter.
const disambiguate = (links) => {
  const seen = new Map();
  for (const l of links) seen.set(l.label, (seen.get(l.label) ?? 0) + 1);
  for (const l of links) {
    if (seen.get(l.label) > 1 && l.kind !== "city") l.label = `${l.label}, ${l.cityName}`;
  }
  // Anything still identical after that is dropped (lowest count goes).
  const used = new Set();
  return [...links]
    .sort((a, b) => b.count - a.count)
    .filter((l) => (used.has(l.label) ? false : used.add(l.label)));
};

// Every link's params are copied from a real group of approved listings and use
// the exact filters GET /api/properties applies (propertyType, city, locality,
// bhk), so a footer link always opens the listings it names.
const buildDiscoverData = async () => {
  const [facets] = await Property.aggregate(DISCOVER_PIPELINE);

  const data = {
    residential: [],
    industrial: [],
    commercial: [],
    retail: [],
    plot: [],
  };

  const links = toLinks(facets ?? {});
  const byCount = (a, b) => b.count - a.count || a.label.localeCompare(b.label);

  // City totals always outrank single localities, so a plain sort would fill
  // the list with "Flats in <city>". Take the most-listed of each kind in turn.
  for (const key of Object.keys(data)) {
    const all = disambiguate(links.filter((l) => l.category === key));
    const queues = LINK_KINDS.map((kind) => all.filter((l) => l.kind === kind).sort(byCount));
    const picked = [];
    while (picked.length < LINKS_PER_CATEGORY && queues.some((q) => q.length)) {
      for (const q of queues) {
        if (q.length && picked.length < LINKS_PER_CATEGORY) picked.push(q.shift());
      }
    }
    data[key] = picked.map(({ label, params }) => ({ label, params }));
  }

  return data;
};

export const getDiscover = async (req, res) => {
  try {
    const data = await withCache(DISCOVER_CACHE_KEY, buildDiscoverData, { ttl: 300 });

    res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    logger.error("discover error", safeErrorMeta(err));

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};