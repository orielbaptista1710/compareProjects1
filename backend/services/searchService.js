//backend/services/searchService.js
//
// ATLAS-READY ABSTRACTION
// ─────────────────────────────────────────────────────────────────────────────
// When you move to Atlas Search on M10+, you only touch this file.
//
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
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60, useClones: false });

function buildCacheKey(query, limit) {
  return `search:${query.toLowerCase()}:${limit}`;
}

// ─── Input sanitisation ───────────────────────────────────────────────────────
// Strip anything that isn't a word character, space, comma, dot, or hyphen.
// Hard-cap at 100 chars to prevent regex DOS.
export function sanitiseQuery(raw = '') {
  return raw
    .trim()
    .slice(0, 100)
    .replace(/[^\w\s,.\-\u0900-\u097F]/g, '') // keep Devanagari for Indian city names
    .trim();
}

// ─── Regex escape ────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Price parser ─────────────────────────────────────────────────────────────
function parsePrice(num, unit = '') {
  let price = parseInt(num, 10);
  const u = unit.toLowerCase();
  if (u.includes('lakh')) price *= 100_000;
  if (u.includes('cr') || u.includes('crore')) price *= 10_000_000;
  return price;
}

// ─── Filter builder ───────────────────────────────────────────────────────────
// Kept separate so the Atlas migration can reuse the same parsed intent.
// atlasSearch() will receive the same `intent` object and convert it to
// an $search pipeline stage instead of a Mongo filter object.
export function buildSearchIntent(q) {
  const intent = {
    filters: { status: 'approved' },
    locationTerms: [],
    rawQuery: q,
  };

  const lower = q.toLowerCase();

  // Property type
  const propertyTypes = [
    'Flats/Apartments', 'Villa', 'Plot', 'Shop/Showroom',
    'Industrial Warehouse', 'Retail', 'Office Space',
  ];
  const foundType = propertyTypes.find(t => lower.includes(t.toLowerCase()));
  if (foundType) intent.filters.propertyType = new RegExp(foundType, 'i');

  // Furnishing
  const furnishingKeywords = ['Fully Furnished', 'Semi Furnished', 'Furnished', 'Unfurnished'];
  const foundFurnishing = furnishingKeywords.find(f => lower.includes(f.toLowerCase()));
  if (foundFurnishing) intent.filters.furnishing = { $in: [new RegExp(foundFurnishing, 'i')] };

  // BHK
  const bhkMatch = lower.match(/(\d+)\s*bhk/);
  if (bhkMatch) intent.filters.bhk = Number(bhkMatch[1]);

  // RERA
  if (lower.includes('rera')) intent.filters.reraApproved = true;

  // Price ranges
  const priceUnder   = lower.match(/under\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  const priceAbove   = lower.match(/above\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  const priceBetween = lower.match(/between\s*(\d+)\s*(lakh|lakhs|cr|crore)?\s*and\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  if (priceUnder)   intent.filters.price = { $lte: parsePrice(priceUnder[1],   priceUnder[2]) };
  if (priceAbove)   intent.filters.price = { $gte: parsePrice(priceAbove[1],   priceAbove[2]) };
  if (priceBetween) intent.filters.price = {
    $gte: parsePrice(priceBetween[1], priceBetween[2]),
    $lte: parsePrice(priceBetween[3], priceBetween[4]),
  };

  // Location — prefer explicit "in <place>" pattern, fall back to first word
  const locationMatch = lower.match(/in ([a-zA-Z\u0900-\u097F\s]+?)(?:\s+under|\s+above|\s+between|$)/);
  const loc = locationMatch
    ? locationMatch[1].trim()
    : lower.split(' ')[0];

  intent.locationTerms = [loc];
  return intent;
}

// ─── Strategy 1: MongoDB Text Search (primary — uses PropertyTextIndex) ───────
async function mongoTextSearch(intent, limit) {
  const baseFilters = { ...intent.filters };
  delete baseFilters.$or; // text search doesn't use $or location filter

  const docs = await Property.find(
    { $text: { $search: intent.rawQuery }, ...baseFilters },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .select('title locality city state price coverImage galleryImages propertyType bhk furnishing reraApproved possessionStatus area ageOfProperty developerName')
    .limit(limit)
    .lean();

  return docs;
}

// ─── Strategy 2: Regex (anchored — uses compound indexes) ────────────────────
// Anchoring with ^ means MongoDB CAN use the index for city/locality lookups.
async function regexSearch(intent, limit) {
  const filters = { ...intent.filters };
  const loc = intent.locationTerms[0];

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

  return Property.find(filters)
    .select('title locality city state price coverImage galleryImages propertyType bhk furnishing reraApproved possessionStatus area ageOfProperty developerName')
    .limit(limit)
    .lean();
}

// ─── Strategy 3: Fuse.js (typo-tolerant, capped at 300 docs) ─────────────────
async function fuseSearch(rawQuery, limit) {
  const allApproved = await Property.find({ status: 'approved' })
    .select('title city locality propertyType bhk price coverImage possessionStatus area ageOfProperty developerName') // minimal projection
    .limit(300) // hard cap — prevents memory spike
    .lean();

  const fuse = new Fuse(allApproved, {
    keys: [
      { name: 'title',        weight: 0.5 },
      { name: 'city',         weight: 0.3 },
      { name: 'locality',     weight: 0.2 },
    ],
    threshold: 0.35,
    includeScore: true,
  });

  return fuse
    .search(rawQuery)
    .slice(0, limit)
    .map(r => r.item);
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
        index: 'property_search', // create this in Atlas UI
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
    {
      $project: {
        title: 1, locality: 1, city: 1, state: 1, price: 1,
        coverImage: 1, propertyType: 1, bhk: 1, furnishing: 1,
        reraApproved: 1, possessionStatus: 1, area: 1,
        ageOfProperty: 1, developerName: 1,
      },
    },
  ];

  // Add price filter if present
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

  let properties = [];
  let fuzzy = false;

  // 1. Text search (primary — weighted index, fast)
  properties = await mongoTextSearch(intent, n);

  // 2. Anchored regex fallback (uses compound status+city index)
  if (properties.length === 0) {
    properties = await regexSearch(intent, n);
  }

  // 3. Fuse.js last resort (typo tolerance, capped at 300 docs)
  if (properties.length === 0) {
    properties = await fuseSearch(query, n);
    if (properties.length > 0) fuzzy = true;
  }

  const result = { properties, fuzzy };
  cache.set(cacheKey, result);
  return result;
}

// Exported for tests / health checks
export { cache as searchCache };