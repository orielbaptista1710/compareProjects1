// backend/services/searchService.js
//
// ATLAS-READY ABSTRACTION
// ─────────────────────────────────────────────────────────────────────────────
// When you move to Atlas Search on M10+, you only touch this file.
// Future migration to Altas Search/ElasticSearch
// Migration checklist (future):
//   1. Add Atlas Search index in the Atlas UI (autocomplete on title/city/locality)
//   2. Replace mongoTextSearch() with atlasSearch() below
//   3. Delete Fuse.js fallback — Atlas handles typos natively
//   4. Remove PropertyTextIndex from Property.js (optional, keep for fallback safety)
//
// Current strategy: Text Search → Regex (anchored) → Fuse.js (capped)
// Atlas strategy:   Atlas Search autocomplete (single pass, no fallbacks needed)
// ─────────────────────────────────────────────────────────────────────────────

import Fuse from 'fuse.js';
import NodeCache from 'node-cache';
import Property from '../models/Property.js';

// ─── Cache ───────────────────────────────────────────────────────────────────
// TTL 120s — long enough to absorb repeated keystrokes, short enough to stay fresh.
// checkperiod 60s — housekeeping sweep, keeps memory stable.
// maxKeys caps memory: every unique query is a key, so a flood of random
// queries would otherwise grow the cache for the whole TTL. When full, set()
// throws ECACHEFULL and runSearch() just serves that result uncached.
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60, useClones: false, maxKeys: 5000 });

function buildCacheKey(query, limit) {
  return `search:${query.toLowerCase()}:${limit}`;
}

// ─── Input sanitisation ───────────────────────────────────────────────────────
// Strip anything that isn't a word character, space, comma, dot, or hyphen.
// Hard-cap at 100 chars to prevent regex DOS.
// A leading "-" makes a word a $text negation ("flat -pune"), so drop those.
export function sanitiseQuery(raw = '') {
  return raw
    .trim()
    .slice(0, 100)
    .replace(/[^\w\s,.\-\p{Script=Devanagari}]/gu, '')
    .replace(/(^|\s)-+/g, '$1')
    .trim();
}

// ─── Regex escape ────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Price parser ─────────────────────────────────────────────────────────────
// Accepts decimals ("1.5 cr"). With no unit, numbers under 1000 are read as
// lakhs ("under 50" = ₹50 lakh) since nobody searches for a ₹50 property.
function parsePrice(num, unit = '') {
  const price = parseFloat(num);
  const u = (unit || '').toLowerCase();
  if (u.startsWith('cr')) return Math.round(price * 10_000_000);
  if (u.startsWith('la') || price < 1000) return Math.round(price * 100_000);
  return Math.round(price);
}

// (?![\d.]) stops the regex from backtracking "500" into "50" to dodge NOT_AREA.
const PRICE_NUM  = String.raw`(\d+(?:\.\d+)?)(?![\d.])`;
const PRICE_UNIT = String.raw`(crores?|cr|lakhs?|lacs?)?`;
// "above 500 sqft" is an area, not a price.
const NOT_AREA   = String.raw`(?!\s*(?:sq|ft|square|acres?|yards?|gaj))`;
const PRICE_UNDER   = new RegExp(String.raw`\b(?:under|below|up\s*to)\s*${PRICE_NUM}\s*${PRICE_UNIT}${NOT_AREA}`);
const PRICE_ABOVE   = new RegExp(String.raw`\b(?:above|over)\s*${PRICE_NUM}\s*${PRICE_UNIT}${NOT_AREA}`);
const PRICE_BETWEEN = new RegExp(String.raw`\bbetween\s*${PRICE_NUM}\s*${PRICE_UNIT}\s*(?:and|to)\s*${PRICE_NUM}\s*${PRICE_UNIT}${NOT_AREA}`);

// Bare numbers and number+unit tokens ("2bhk", "50lakh") are filters; words
// that merely contain a digit ("m3m", "one45") are names and must stay.
const isNumericToken = (w) =>
  /^\d+(?:\.\d+)?(?:bhk|rk|cr|crores?|lakhs?|lacs?|l)?$/.test(w);

// ─── Keyword → stored value maps ─────────────────────────────────────────────
// Values must match the enums in models/propertyType.js and Property.furnishing.
// More specific patterns come first.
const PROPERTY_TYPE_KEYWORDS = [
  [/\bcommercial\s+land\b/, 'Commercial Land'],
  [/\bindustrial\s+building\b/, 'Industrial Building'],
  [/\b(?:warehouses?|godowns?)\b/, 'Industrial Warehouse/Godown'],
  [/\b(?:shops?|showrooms?)\b/, 'Shop/Showroom'],
  [/\boffices?\b/, 'Office Space'],
  [/\b(?:flats?|apartments?)\b/, 'Flats/Apartments'],
  [/\bvillas?\b/, 'Villa'],
  [/\bplots?\b/, 'Plot'],
];

// "unfurnished" contains "furnished", so it has to be checked first.
const FURNISHING_KEYWORDS = [
  [/\bunfurnished\b/, ['Unfurnished']],
  [/\bsemi[\s-]?furnished\b/, ['Semi Furnished']],
  [/\bfully[\s-]?furnished\b/, ['Fully Furnished']],
  [/\bfurnished\b/, ['Furnished', 'Fully Furnished']],
];

// Words that describe filters rather than a place or project name. They are
// kept out of the $text query and out of the location guess, otherwise
// "under" matches every "under construction" description.
const FILTER_WORDS = new Set([
  'under', 'below', 'above', 'over', 'between', 'and', 'to', 'up', 'upto',
  'in', 'at', 'near', 'for', 'sale', 'rent', 'with', 'the',
  'bhk', 'rk', 'rera', 'approved', 'lakh', 'lakhs', 'lac', 'lacs', 'cr', 'crore', 'crores',
  'flat', 'flats', 'apartment', 'apartments', 'villa', 'villas', 'plot', 'plots',
  'shop', 'shops', 'showroom', 'showrooms', 'office', 'offices', 'space',
  'warehouse', 'warehouses', 'godown', 'godowns', 'commercial', 'land', 'industrial', 'building',
  'furnished', 'unfurnished', 'semi', 'fully', 'semi-furnished', 'fully-furnished',
]);

// ─── Field projection (DRY) ──────────────────────────────────────────────────
// Single source of truth for what the search endpoints return.
// Keeps payloads lean; the full property is only fetched on the property page.
// The card only needs one gallery image as a fallback for a missing cover.
const SEARCH_PROJECTION = {
  title: 1, locality: 1, city: 1, state: 1, price: 1,
  coverImage: 1, galleryImages: { $slice: 1 },
  propertyType: 1, bhk: 1, furnishing: 1, reraApproved: 1,
  possessionStatus: 1, area: 1, ageOfProperty: 1, developerName: 1,
  listedBy: 1, // "by <builder>" vs "Posted by Owner/Agent" on the card
};

// ─── Duplicate listings ──────────────────────────────────────────────────────
// Scraped data contains identical copies of the same listing. Over-fetch a
// little and keep the first of each so the dropdown never repeats a card.
function dedupeListings(docs, limit) {
  const seen = new Set();
  const unique = [];
  for (const doc of docs) {
    const key = `${doc.title}|${doc.locality}|${doc.price}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(doc);
    if (unique.length === limit) break;
  }
  return unique;
}

const fetchLimitFor = (limit) => Math.min(limit * 3, 30);

// ─── Filter builder ───────────────────────────────────────────────────────────
// Kept separate so the Atlas migration can reuse the same parsed intent.
// atlasSearch() will receive the same `intent` object and convert it to
// an $search pipeline stage instead of a Mongo filter object.
export function buildSearchIntent(q) {
  const intent = {
    filters: { status: 'approved' },
    locationTerms: [],
    textQuery: '',
    rawQuery: q,
  };

  const lower = q.toLowerCase();

  // Property type (exact enum value, so the compound index can be used)
  const foundType = PROPERTY_TYPE_KEYWORDS.find(([pattern]) => pattern.test(lower));
  if (foundType) intent.filters.propertyType = foundType[1];

  // Furnishing
  const foundFurnishing = FURNISHING_KEYWORDS.find(([pattern]) => pattern.test(lower));
  if (foundFurnishing) intent.filters.furnishing = { $in: foundFurnishing[1] };

  // BHK
  const bhkMatch = lower.match(/(\d+)\s*bhk/);
  if (bhkMatch) intent.filters.bhk = Number(bhkMatch[1]);

  // RERA
  if (/\brera\b/.test(lower)) intent.filters.reraApproved = true;

  // Price ranges — "above X under Y" sets both bounds; "between" wins outright.
  const price = {};
  const priceUnder   = lower.match(PRICE_UNDER);
  const priceAbove   = lower.match(PRICE_ABOVE);
  const priceBetween = lower.match(PRICE_BETWEEN);
  if (priceUnder) price.$lte = parsePrice(priceUnder[1], priceUnder[2]);
  if (priceAbove) price.$gte = parsePrice(priceAbove[1], priceAbove[2]);
  if (priceBetween) {
    // "between 50 and 80 lakh" — the second unit applies to both numbers,
    // unless that inverts the range ("between 50 and 1 cr" = 50 lakh to 1 cr).
    price.$lte = parsePrice(priceBetween[3], priceBetween[4]);
    price.$gte = parsePrice(priceBetween[1], priceBetween[2] || priceBetween[4]);
    if (!priceBetween[2] && price.$gte > price.$lte) {
      price.$gte = parsePrice(priceBetween[1]);
    }
  }
  if (Object.keys(price).length) intent.filters.price = price;

  // Words that aren't filters — a project, place or developer name.
  const nameWords = lower
    .split(/[\s,]+/)
    .filter((w) => w && !isNumericToken(w) && !FILTER_WORDS.has(w));
  intent.textQuery = nameWords.join(' ');

  // Location — prefer explicit "in <place>" pattern, fall back to the first
  // name word. Guard: only use location terms that are ≥ 3 characters to avoid
  // catastrophic regex scans (e.g. loc = "a" matching half the DB with ^a).
  const locationMatch = lower.match(
    /\bin\s+([a-zA-Z\p{Script=Devanagari}\s]+?)(?:\s+(?:under|below|above|over|between|up\s*to)\b|$)/u
  );
  const loc = locationMatch
    ? locationMatch[1].trim()
    : nameWords[0];

  if (loc && loc.length >= 3) {
    intent.locationTerms = [loc];
  }

  return intent;
}

const hasStructuredFilters = (intent) =>
  Object.keys(intent.filters).some((key) => key !== 'status');

// ─── Strategy 1: MongoDB Text Search (primary — uses PropertyTextIndex) ───────
async function mongoTextSearch(intent, limit) {
  // Nothing name-like to search for (e.g. "2 bhk under 50 lakh") — let the
  // filter-based regex strategy handle it.
  if (!intent.textQuery) return [];

  const docs = await Property.find(
    { $text: { $search: intent.textQuery }, ...intent.filters },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .select(SEARCH_PROJECTION)
    .limit(fetchLimitFor(limit))
    .lean();

  return dedupeListings(docs, limit);
}

// ─── Strategy 2: Regex (anchored — uses compound indexes) ────────────────────
// Anchoring with ^ means MongoDB CAN use the index for city/locality lookups.
// Only runs when locationTerms has a term that passed the ≥3-char guard above,
// or when the query parsed into real filters ("2 bhk under 50 lakh").
async function regexSearch(intent, limit) {
  const filters = { ...intent.filters };
  const loc = intent.locationTerms[0];

  // No location and no filters means the query told us nothing — returning
  // { status: 'approved' } here would show arbitrary listings as "matches".
  if (!loc && !hasStructuredFilters(intent)) return [];

  if (loc) {
    const escaped = escapeRegex(loc);
    // ^ anchor = index-eligible on fields with a standard index
    filters.$or = [
      { city:     new RegExp(`^${escaped}`, 'i') },
      { locality: new RegExp(`^${escaped}`, 'i') },
      { state:    new RegExp(`^${escaped}`, 'i') },
      { title:    new RegExp(escaped,       'i') }, // title intentionally unanchored
    ];
  }

  const docs = await Property.find(filters)
    .select(SEARCH_PROJECTION)
    .limit(fetchLimitFor(limit))
    .lean();

  return dedupeListings(docs, limit);
}

// ─── Strategy 3: Fuse.js (typo-tolerant, capped at 300 docs) ─────────────────
// Newest first, so the cap keeps current listings rather than an arbitrary 300.
// Parsed filters still apply, so a fuzzy "best match" never breaks the price,
// BHK or type the user asked for.
async function fuseSearch(intent, limit) {
  const recentApproved = await Property.find(intent.filters)
    .sort({ createdAt: -1 })
    .select(SEARCH_PROJECTION)
    .limit(300) // hard cap — prevents memory spike
    .lean();

  const fuse = new Fuse(recentApproved, {
    keys: [
      { name: 'title',    weight: 0.5 },
      { name: 'city',     weight: 0.3 },
      { name: 'locality', weight: 0.2 },
    ],
    threshold: 0.35,
    includeScore: true,
  });

  return dedupeListings(fuse.search(intent.rawQuery).map(r => r.item), limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// ATLAS SEARCH (future — uncomment when on M10+)
// Replace the entire runSearch() function below with this.
// The intent object stays identical — zero changes to controller or route.
// ─────────────────────────────────────────────────────────────────────────────
/*
async function atlasSearch(intent, limit) {
  const pipeline = [
    {
      $search: {
        index: 'property_search',
        compound: {
          must: [],
          should: [
            {
              autocomplete: {
                query: intent.rawQuery,
                path: 'title',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 5 } },
              },
            },
            {
              autocomplete: {
                query: intent.rawQuery,
                path: 'city',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 3 } },
              },
            },
            {
              autocomplete: {
                query: intent.rawQuery,
                path: 'locality',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 3 } },
              },
            },
          ],
          filter: [
            { equals: { path: 'status', value: 'approved' } },
          ],
        },
      },
    },
    { $addFields: { score: { $meta: 'searchScore' } } },
    { $limit: limit },
    { $project: { ...SEARCH_PROJECTION, galleryImages: { $slice: ['$galleryImages', 1] } } },
  ];

  if (intent.filters.price) {
    pipeline[0].$search.compound.filter.push({
      range: { path: 'price', ...intent.filters.price },
    });
  }

  return Property.aggregate(pipeline).exec();
}

export async function runSearch(rawQuery, limit = 5) {
  const query = sanitiseQuery(rawQuery);
  if (query.length < 2) return { properties: [], fuzzy: false };

  const cacheKey = buildCacheKey(query, limit);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const intent = buildSearchIntent(query);
  const properties = await atlasSearch(intent, Number(limit));
  const result = { properties, fuzzy: false };

  cache.set(cacheKey, result);
  return result;
}
*/

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function runSearch(rawQuery, limit = 5) {
  const query = sanitiseQuery(rawQuery);
  if (query.length < 2) return { properties: [], fuzzy: false };

  const cacheKey = buildCacheKey(query, limit);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const intent = buildSearchIntent(query);
  const n = Number(limit);

  // 1. Text search (primary — weighted index, fast)
  let properties = await mongoTextSearch(intent, n);
  let fuzzy = false;

  // 2. Anchored regex fallback (uses compound status+city index)
  if (properties.length === 0) {
    properties = await regexSearch(intent, n);
  }

  // 3. Fuse.js last resort (typo tolerance, capped at 300 docs)
  if (properties.length === 0) {
    properties = await fuseSearch(intent, n);
    if (properties.length > 0) fuzzy = true;
  }

  const result = { properties, fuzzy };
  try {
    cache.set(cacheKey, result);
  } catch {
    // Cache full (maxKeys) — skip caching this one; it still gets served.
  }
  return result;
}

// Exported for tests / health checks
export { cache as searchCache };
