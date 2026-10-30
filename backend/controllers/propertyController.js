// controllers/propertyController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from '../models/propertyType.js';
import { COMMON_AMENITIES, COMMON_SECURITY } from '../constants/amenities.js';
import { invalidatePropertyCaches } from '../utils/propertyCache.js';
import { PUBLIC_LIST_FIELDS, PUBLIC_DETAIL_FIELDS } from '../constants/propertyProjections.js';
import { parsePropertyInput } from '../validators/propertyInputValidator.js';
import logger from '../utils/logger.js';
import { safeErrorMeta } from '../utils/safeError.js';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const AREA_BOUNDS = {
  sqft:     { min: 0, max: 10_000 },
  sqmts:    { min: 0, max: 1_000  },
  guntas:   { min: 0, max: 100    },
  hectares: { min: 0, max: 50     },
  acres:    { min: 0, max: 50     },
};

// Sort order for grouped project cards (getAllApprovedProperties). Operates
// on group-level fields produced by the $group stage there — minPrice for
// the two price sorts (a project's "Starting From" price), $max(createdAt)
// for newest/oldest (the most recently added unit in the project).
//
// noPrice (0 if any unit has a price) comes first in the price sorts so
// unpriced projects sort last both ways — Mongo would otherwise put a null
// minPrice ahead of every real price in ascending order.
//
// Every sort ends with lastId ($max(_id) of the group — unique per group),
// so the order is total. Without it, ties (bulk scraper imports share one
// createdAt; many projects share a price) let each page request order the
// tied projects differently, and $skip/$limit then shows a project on two
// pages or on none. ObjectIds grow with insertion, so lastId also keeps
// "newest" meaningful inside a same-timestamp batch.
const GROUP_SORT_MAP = {
  relevance:        { featured: -1, createdAt: -1, lastId: -1 },
  'price-low-high': { noPrice: 1, minPrice: 1,  lastId: -1 },
  'price-high-low': { noPrice: 1, minPrice: -1, lastId: -1 },
  newest:           { createdAt: -1, lastId: -1 },
  oldest:           { createdAt: 1,  lastId: 1 },
};

const DEFAULT_PAGE_LIMIT = 12;
const MAX_PAGE_LIMIT      = 100;
const MAX_PAGE_NUMBER     = 1_000;
const MAX_LIMIT_FEATURED  = 20;
const MAX_LIMIT_RECENT    = 20;
const LOCATION_RESULT_CAP = 8;

// ─────────────────────────────────────────────
// Listing aggregation — BHK-variant grouping
// ─────────────────────────────────────────────

// Same allowlist the flat listing used (.select(PUBLIC_LIST_FIELDS)), plus
// listingType, which is only needed to decide groupability below and is
// never copied into the final per-group output (only fields explicitly named
// in $first/$push make it there), so this doesn't widen what's public.
const AGGREGATION_PROJECTION = {
  ...Object.fromEntries(PUBLIC_LIST_FIELDS.split(' ').filter(Boolean).map((f) => [f, 1])),
  listingType: 1,
};

// A doc only joins a project group when it has a projectKey (i.e. projectName
// is set), isn't a resale listing, and has a real BHK count (plots/commercial
// use bhk 0 or no bhk at all). Everything else is grouped under its own _id,
// i.e. it renders as its own single-unit card — it's never dropped.
const GROUP_KEY_EXPR = {
  $cond: [
    {
      $and: [
        { $ifNull: ['$projectKey', false] },
        { $ne: ['$listingType', 'resale'] },
        { $gt: ['$bhk', 0] },
      ],
    },
    '$projectKey',
    '$_id',
  ],
};

// Per-unit fields shown in a project card's BHK selector. Also carries the
// fields that genuinely vary unit-to-unit within the same project (floor,
// wing, tower, phase, balconies) so the Compare page's DetailsTab still has
// them for whichever unit the shopper added to compare.
const UNIT_PROJECTION = {
  _id:        '$_id',
  slug:       '$slug',
  bhk:        '$bhk',
  area:       '$area',
  price:      '$price',
  bathrooms:  '$bathrooms',
  parkings:   '$parkings',
  facing:     '$facing',
  balconies:  '$balconies',
  floor:      '$floor',
  totalFloors:'$totalFloors',
  floorLabel: '$floorLabel',
  wing:       '$wing',
  tower:      '$tower',
  phase:      '$phase',
  image:      { $ifNull: ['$coverImage.thumbnail', '$coverImage.url'] },
};

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/** Escape special regex characters from user input — prevents ReDoS */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validate + sanitise a free-text search string.
 * Returns the escaped string ready for $regex, or null if invalid.
 */
const sanitiseSearch = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  return escapeRegex(trimmed);
};

/**
 * Parse a query parameter that may arrive as a single string or an array.
 * Express repeats the key for multi-value params: ?bhk=2&bhk=3
 */
const toArray = (value) => (value == null ? [] : [].concat(value));

/** Safely parse an integer from a query param with min/max clamping. */
const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

/** Validate MongoDB ObjectId to avoid CastError leaking into error responses. */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Previously, having both a BHK filter and a search filter active at the same
 * time would silently produce two top-level $or clauses (only the last one wins
 * in MongoDB).  This helper always merges correctly into $and.
 */
const addOrClause = (query, orClause) => {
  if (query.$or) {
    // There's already an $or — move both into $and so both conditions apply
    query.$and = [...(query.$and || []), { $or: query.$or }, { $or: orClause }];
    delete query.$or;
  } else {
    query.$or = orClause;
  }
};


// ─────────────────────────────────────────────
// Public – Filter meta-data
// ─────────────────────────────────────────────

/**
 * GET /api/properties/filters
 * Returns all distinct filter option values for the UI dropdowns.
 */
const getFilterOptions = asyncHandler(async (_req, res) => {
  const base = { status: 'approved' };

  const [
    cities,
    propertyTypeOptions,
    furnishingOptions,
    facingOptions,
    parkingOptions,
    possessionStatusOptions,
    floorLabelOptions,
  ] = await Promise.all([
    Property.distinct('city',             base),
    Property.distinct('propertyType',     base),
    Property.distinct('furnishing',       base),
    Property.distinct('facing',           base),
    Property.distinct('parkings',         base), // parkings is [String] array
    Property.distinct('possessionStatus', base),
    Property.distinct('floorLabel',       base),
  ]);

  const amenitiesOptions = [
    ...new Set([...COMMON_AMENITIES, ...COMMON_SECURITY].map((a) => a.trim())),
  ].sort();

  res.status(200).json({
    cities:                  cities.filter(Boolean).sort(),
    propertyTypeOptions:     propertyTypeOptions.filter(Boolean).sort(),
    furnishingOptions:       furnishingOptions.filter(Boolean).sort(),
    facingOptions:           facingOptions.filter(Boolean).sort(),
    parkingOptions:          parkingOptions.filter(Boolean).sort(),
    possessionStatusOptions: possessionStatusOptions.filter(Boolean).sort(),
    floorLabelOptions:       floorLabelOptions.filter(Boolean).sort(),
    amenitiesOptions,
    areaBounds: AREA_BOUNDS,
  });
});

// ─────────────────────────────────────────────
// Public – Locality helpers
// ─────────────────────────────────────────────

/**
 * GET /api/properties/localities-by-type
 * Distinct localities grouped by residential / commercial — used in footer links.
 */
const getPropertiesByType = asyncHandler(async (_req, res) => {
  const base = { status: 'approved' };

  const [residentialLocalities, commercialLocalities] = await Promise.all([
    Property.distinct('locality', { ...base, propertyType: { $in: RESIDENTIAL_TYPES } }),
    Property.distinct('locality', { ...base, propertyType: { $in: COMMERCIAL_TYPES  } }),
  ]);

  res.json({
    residential: residentialLocalities.filter(Boolean).sort(),
    commercial:  commercialLocalities.filter(Boolean).sort(),
  });
});

/**
 * GET /api/properties/localities/:city
 * All distinct localities for a given city.
 *
 * NOTE on "Vile Parle East / West / Juhu" style sub-areas:
 * The current approach returns all locality strings that match the city.
 * If you want to support hierarchical locality groups (e.g. "Vile Parle" →
 * ["Vile Parle East", "Vile Parle West"]), consider storing a
 * `sub_locality` field and grouping by `locality` in the aggregate.
 * For now, the distinct list covers all variants as-stored.
 */
const getLocalitiesByCity = asyncHandler(async (req, res) => {
  const { city } = req.params;

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    res.status(400);
    throw new Error('A valid city name is required.');
  }

  const safeCity = escapeRegex(city.trim());

  const localities = await Property.distinct('locality', {
    city:   { $regex: new RegExp(`^${safeCity}$`, 'i') },
    status: 'approved',
  });

  res.json({ localities: localities.filter(Boolean).sort() });
});

// ─────────────────────────────────────────────
// Public – Featured & Recent
// ─────────────────────────────────────────────

/**
 * GET /api/properties/featured
 */
const getFeaturedProperties = asyncHandler(async (req, res) => {
  const limit = clampInt(req.query.limit, 3, 1, MAX_LIMIT_FEATURED);

  const query = { featured: true, status: 'approved' };

  if (req.query.city) {
    const safeCity = sanitiseSearch(req.query.city);
    if (safeCity) query.city = { $regex: new RegExp(`^${safeCity}$`, 'i') };
  }

  const properties = await Property.find(query)
    .select(
      'title city locality price bhk furnishing area reraDate coverImage ' +
      'pricePerSqft slug developerName propertyType galleryImages reraNumber ' +
      'possessionStatus description'
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(properties);
});

/**
 * GET /api/properties/recent
 */
const getRecentProperties = asyncHandler(async (req, res) => {
  const limit = clampInt(req.query.limit, 6, 1, MAX_LIMIT_RECENT);

  const query = { status: 'approved' };

  if (req.query.city) {
    const safeCity = sanitiseSearch(req.query.city);
    if (safeCity) query.city = { $regex: new RegExp(`^${safeCity}$`, 'i') };
  }

  const properties = await Property.find(query)
    .select(
      'title city locality price bhk furnishing area coverImage ' +
      'developerName propertyType slug createdAt'
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(properties);
});

// ─────────────────────────────────────────────
// Public – Related Properties
// ─────────────────────────────────────────────

/**
 * GET /api/properties/:id/related
 *
 * FIX: was using `projectName` which doesn't exist in the schema.
 * Now falls back to: same developer (developerName) OR same locality.
 * Same locality is more useful to a buyer than same developer anyway.
 */
const getRelatedProperties = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  // FIX: also ensure the current property is approved when accessed publicly
  const current = await Property.findOne({ _id: id, status: 'approved' }).lean();
  if (!current) {
    res.status(404);
    throw new Error('Property not found.');
  }

  const related = await Property.find({
    _id:    { $ne: id },
    status: 'approved',
    $or: [
      // Same developer first (most relevant for a developer dashboard context)
      { developerName: current.developerName },
      // Same locality as a geographic fallback
      { locality: current.locality, city: current.city },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    // Full public list fields: /compare recommends these and adds them to the
    // compare list, so they must carry everything the compare table reads.
    .select(PUBLIC_LIST_FIELDS)
    .lean();

  res.json(related);
});

/**
 * GET /api/properties/project-units/:id
 *
 * Sibling units of the same project (matched by projectKey, the same key
 * getAllApprovedProperties groups listings by) — powers the "other
 * configurations in this project" switcher on the property detail page.
 * Returns every approved unit sharing that key, INCLUDING the current one
 * (so the frontend can render one consistent tile row with the current
 * unit marked active), sorted cheapest-first. A property with no projectKey
 * (ungrouped — no projectName set, a resale listing, or bhk 0) has no
 * siblings by definition, so this returns an empty array rather than 404ing;
 * the frontend simply doesn't render the switcher in that case.
 */
const getProjectUnits = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  const current = await Property.findOne({ _id: id, status: 'approved' }).select('projectKey').lean();
  if (!current) {
    res.status(404);
    throw new Error('Property not found.');
  }

  if (!current.projectKey) {
    return res.json({ units: [] });
  }

  const units = await Property.find({ projectKey: current.projectKey, status: 'approved' })
    .select('bhk area price slug')
    .sort({ price: 1 })
    .limit(30)
    .lean();

  res.json({ units });
});

// ─────────────────────────────────────────────
// Public – Listings (paginated + filtered)
// ─────────────────────────────────────────────

/**
 * GET /api/properties
 */
const getAllApprovedProperties = asyncHandler(async (req, res) => {
  const page  = clampInt(req.query.page,  1,  1,  MAX_PAGE_NUMBER);
  const limit = clampInt(req.query.limit, DEFAULT_PAGE_LIMIT, 1, MAX_PAGE_LIMIT);
  const skip  = (page - 1) * limit;

  const groupSort = GROUP_SORT_MAP[req.query.sortBy] ?? GROUP_SORT_MAP.relevance;

  // ── Base query ──────────────────────────────
  const query = { status: 'approved' };

  // ── City ─────────────────────────────────────
  if (req.query.city) {
    const safeCity = sanitiseSearch(req.query.city);
    if (safeCity) query.city = { $regex: new RegExp(`^${safeCity}$`, 'i') };
  }

  // ── Array filters ($in) ──────────────────────
  const arrayFilters = [
    'locality', 'propertyType', 'furnishing',
    'facing', 'parkings', 'possessionStatus',
  ];

  for (const key of arrayFilters) {
    const values = toArray(req.query[key]).filter(Boolean);
    if (values.length) query[key] = { $in: values };
  }

  // floorLabel arrives comma-separated or repeated
  if (req.query.floorLabel) {
    const values = toArray(req.query.floorLabel)
      .flatMap((v) => v.split(','))
      .filter(Boolean);
    if (values.length) query.floorLabel = { $in: values };
  }

  // ── Amenities (cross-field OR across amenities + security) ──
  if (req.query.amenities) {
    const values = toArray(req.query.amenities).filter(Boolean);
    if (values.length) {
      query.$and = query.$and ?? [];
      query.$and.push({
        $or: [
          { amenities: { $in: values } },
          { security:  { $in: values } },
        ],
      });
    }
  }

  // ── BHK (supports exact values and "5+" syntax) ──────────────
  if (req.query.bhk) {
    const bhkValues = toArray(req.query.bhk);
    const exact   = [];
    let   minPlus = null;

    for (const v of bhkValues) {
      const match = String(v).match(/^(\d+)\+$/);
      if (match) {
        const n = Number(match[1]);
        if (minPlus === null || n < minPlus) minPlus = n;
      } else {
        const n = Number(v);
        if (!Number.isNaN(n)) exact.push(n);
      }
    }

    let bhkClause = null;
    if (minPlus !== null && exact.length) {
      bhkClause = [{ bhk: { $in: exact } }, { bhk: { $gte: minPlus } }];
    } else if (minPlus !== null) {
      query.bhk = { $gte: minPlus };
    } else if (exact.length) {
      query.bhk = { $in: exact };
    }

    // FIX: use addOrClause so a simultaneous search filter doesn't clobber this
    if (bhkClause) addOrClause(query, bhkClause);
  }

  // ── Area range ───────────────────────────────
  if (req.query.areaMin != null || req.query.areaMax != null) {
    const areaQuery = {};
    const min = parseFloat(req.query.areaMin);
    const max = parseFloat(req.query.areaMax);
    if (!Number.isNaN(min) && min >= 0) areaQuery.$gte = min;
    if (!Number.isNaN(max) && max >= 0) areaQuery.$lte = max;
    if (Object.keys(areaQuery).length) query['area.value'] = areaQuery;
    if (req.query.areaUnit) query['area.unit'] = req.query.areaUnit;
  }

  // ── Price range ──────────────────────────────
  if (req.query.priceMin != null || req.query.priceMax != null) {
    const priceQuery = {};
    const min = parseFloat(req.query.priceMin);
    const max = parseFloat(req.query.priceMax);
    if (!Number.isNaN(min) && min >= 0) priceQuery.$gte = min;
    if (!Number.isNaN(max) && max >= 0) priceQuery.$lte = max;
    if (Object.keys(priceQuery).length) query.price = priceQuery;
  }

  // ── Full-text search ─────────────────────────
  // FIX: uses addOrClause so simultaneous BHK + search filters both apply
  if (req.query.search) {
    const safe = sanitiseSearch(req.query.search);
    if (safe) {
      const regex = { $regex: safe, $options: 'i' };
      addOrClause(query, [
        { title:       regex },
        { description: regex },
        { locality:    regex },
      ]);
    }
  }

  // ── Execute ──────────────────────────────────
  // totalProperties: count of individual matching Property documents, exactly
  // the same `Property.countDocuments(query)` call this endpoint has always
  // used (see the git history prior to BHK-variant grouping). It runs
  // independently of the grouping aggregation below, so grouping multiple
  // BHK variants onto one card can never change what the page header shows —
  // this count doesn't know grouping exists.
  const [totalProperties, [facetResult]] = await Promise.all([
    Property.countDocuments(query),
    Property.aggregate([
      { $match: query },
      { $project: AGGREGATION_PROJECTION },
      { $addFields: { noPrice: { $cond: [{ $gt: ['$price', 0] }, 0, 1] } } },
      // Sort by price before grouping so the $first-based fields below
      // (title, coverImage, slug…) consistently come from the cheapest unit
      // in the project — the frontend defaults to that unit too. noPrice keeps
      // an unpriced unit from being picked as "cheapest". _id breaks price
      // ties so a card can't switch to a different unit between requests.
      { $sort: { noPrice: 1, price: 1, _id: 1 } },
      {
        $group: {
          _id:              GROUP_KEY_EXPR,
          projectKey:       { $first: '$projectKey' },
          title:            { $first: '$title' },
          projectName:      { $first: '$projectName' },
          slug:             { $first: '$slug' },
          developerName:    { $first: '$developerName' },
          developerAvatar:  { $first: '$developerAvatar' },
          description:      { $first: '$description' },
          state:            { $first: '$state' },
          city:             { $first: '$city' },
          locality:         { $first: '$locality' },
          pincode:          { $first: '$pincode' },
          address:          { $first: '$address' },
          landmarks:        { $first: '$landmarks' },
          mapLink:          { $first: '$mapLink' },
          coordinates:      { $first: '$coordinates' },
          coverImage:       { $first: '$coverImage' },
          galleryImages:    { $first: '$galleryImages' },
          possessionStatus: { $first: '$possessionStatus' },
          reraApproved:     { $first: '$reraApproved' },
          reraNumber:       { $first: '$reraNumber' },
          reraDate:         { $first: '$reraDate' },
          amenities:        { $first: '$amenities' },
          facilities:       { $first: '$facilities' },
          security:         { $first: '$security' },
          unitsAvailable:   { $first: '$unitsAvailable' },
          propertyType:     { $first: '$propertyType' },
          propertyGroup:    { $first: '$propertyGroup' },
          emiStarts:        { $first: '$emiStarts' },
          priceNegotiable:  { $first: '$priceNegotiable' },
          furnishing:       { $first: '$furnishing' },
          ageOfProperty:    { $first: '$ageOfProperty' },
          popularityScore:  { $first: '$metadata.analytics.popularityScore' },
          featured:         { $max: '$featured' },
          createdAt:        { $max: '$createdAt' },
          lastId:           { $max: '$_id' }, // tiebreaker for GROUP_SORT_MAP; not returned
          noPrice:          { $min: '$noPrice' }, // price-sort key for GROUP_SORT_MAP; not returned
          minPrice:         { $min: '$price' },
          maxPrice:         { $max: '$price' },
          bhkList:          { $addToSet: '$bhk' },
          units:            { $push: UNIT_PROJECTION },
        },
      },
      // Grouping happens once above; $facet reuses that single grouped set
      // for both the paginated card data and the project-count branch below,
      // rather than grouping twice.
      {
        $facet: {
          data:  [{ $sort: groupSort }, { $skip: skip }, { $limit: limit }],
          count: [{ $count: 'n' }],
        },
      },
    ]),
  ]);

  const totalProjects = facetResult?.count?.[0]?.n ?? 0;
  // eslint-disable-next-line no-unused-vars -- lastId/noPrice are only sort keys, dropped here
  const data = (facetResult?.data ?? []).map(({ bhkList, units, popularityScore, lastId, noPrice, ...group }) => ({
    ...group,
    bhkList: [...new Set(bhkList)].filter((v) => v != null).sort((a, b) => a - b),
    units: [...units].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)),
    // Reshaped back into metadata.analytics.* — frontend/src/utils/compareScoring.js
    // and the card's "popularity" signal both read it from that nested path.
    metadata: { analytics: { popularityScore: popularityScore ?? 0 } },
  }));

  res.json({
    data,
    totalProperties,
    totalProjects,
    page,
    totalPages: Math.ceil(totalProjects / limit),
  });
});

// ─────────────────────────────────────────────
// Public – Location autocomplete
// ─────────────────────────────────────────────

/**
 * GET /api/properties/location-options?q=&city=
 * Powers the main search-bar autocomplete.
 * The same endpoint is usable for MainSearchBar and FilterPanel —
 * just pass city= to narrow results when already on a city page.
 */
const getLocationOptions = asyncHandler(async (req, res) => {
  const { q, city } = req.query;
  const safe = sanitiseSearch(q);

  if (!safe) return res.json([]);

  const regex = new RegExp(safe, 'i');

  const match = {
    status: 'approved',
    $or: [{ locality: regex }, { city: regex }, { pincode: regex }],
  };

  if (city) {
    const safeCity = sanitiseSearch(city);
    if (safeCity) match.city = { $regex: new RegExp(`^${safeCity}$`, 'i') };
  }

  const results = await Property.aggregate([
    { $match: match },
    {
      $group: {
        _id: { city: '$city', locality: '$locality', pincode: '$pincode' },
      },
    },
    { $limit: LOCATION_RESULT_CAP },
  ]);

  res.json(
    results.map(({ _id }) => ({
      label:    _id.locality ? `${_id.locality}, ${_id.city}` : _id.city,
      city:     _id.city,
      locality: _id.locality ?? null,
      pincode:  _id.pincode  ?? null,
      type:     _id.locality ? 'locality' : 'city',
    }))
  );
});

// ─────────────────────────────────────────────
// Public – Single property
// ─────────────────────────────────────────────

/**
 * GET /api/properties/:id
 *
 * FIX: restrict public access to approved properties only.
 * Previously a caller who knew the _id of a pending/rejected property
 * could retrieve all its data.
 */
const getPropertyById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  const property = await Property.findOne({
    _id:    req.params.id,
    status: 'approved',
  }).select(PUBLIC_DETAIL_FIELDS).lean();

  if (!property) {
    res.status(404);
    throw new Error('Property not found.');
  }

  res.json(property);
});

// ───────────────────────────────────────────── 
// Protected – Developer CRUD
// ─────────────────────────────────────────────
 
/**
 * POST /api/properties/add  [protected]
 *
 * DASHBOARD FIX:
 *   - req.user._id is a real ObjectId from User.findById() in protect.js
 *   - It is stored as userId on the property document
 *   - getMyProperties queries { userId: req.user._id }
 *   - Both sides are ObjectId → MongoDB matches correctly
 *   - DevPropertyList calls GET /api/properties/my-properties (protected) NOT
 *     GET /api/properties (public, approved-only) — this is correct
 *
 * Server-managed fields stripped from client payload:
 *   geo           — recomputed by pre('validate') from coordinates
 *   propertyGroup — recomputed by pre('validate') from propertyType
 *   status        — always set to 'pending' on create
 *   userId        — always taken from req.user, never from client
 *   slug          — generated by pre('save') from title
 */

// Developers may only set the fields allowlisted in validators/propertyInputValidator.js.
// Everything else (userId, status, featured, metadata.*, owner/broker contact,
// review fields…) is dropped — the edit form sends the whole saved property back.
// Responds 400 and returns null when the body has invalid fields.
const parseDeveloperInput = (req, res) => {
  const { data, error } = parsePropertyInput(req.body);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return null;
  }
  return data;
};

const addProperty = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    res.status(401);
    throw new Error('Not authorised.');
  }

  const safeBody = parseDeveloperInput(req, res);
  if (!safeBody) return;

  const property = await Property.create({
    ...safeBody,
    userId: req.user._id, // ObjectId from protect middleware
    status: 'pending',
  }).catch((err) => {
    // Field names only — values can be personal data (SEC-14).
    logger.warn('[addProperty] create failed', safeErrorMeta(err));
    throw err;
  })

  res.status(201).json({
    success: true,
    message: 'Property submitted for admin approval.',
    property,
  });
});

/**
 * GET /api/properties/my-properties  [protected]
 *
 * DASHBOARD FIX — how this links users to their properties:
 *   User collection:     { _id: ObjectId("abc123"), email, password, ... }
 *   Property collection: { _id: ObjectId("xyz789"), userId: ObjectId("abc123"), ... }
 *
 *   When a developer submits a property, addProperty sets userId = req.user._id.
 *   This creates the link: property.userId === user._id.
 *
 *   getMyProperties queries Property.find({ userId: req.user._id }).
 *   Because protect.js does User.findById(decoded.id), req.user._id is an
 *   ObjectId (not a string), so the query matches correctly.
 *
 *   DevPropertyList receives the result and renders it — no other linking needed.
 *   The _id values between collections are different (property._id ≠ user._id).
 *   What links them is property.userId = user._id.
 */
const getMyProperties = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    res.status(401);
    throw new Error('Not authorised.');
  }

  const properties = await Property.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(properties);
});

/**
 * PUT /api/properties/update/:id  [protected]
 *
 * FIX: replaced findOneAndUpdate with fetch-then-save so that:
 *   1. pre('validate') runs → propertyGroup and geo are recomputed
 *   2. pre('save') runs → slug is regenerated if title changed
 *   3. runValidators: true on findOneAndUpdate does NOT trigger these hooks
 */
const updateProperty = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  if (!req.user?._id) {
    res.status(401);
    throw new Error('Not authorised.');
  }

  // Ownership check — only the submitting developer can update
  const property = await Property.findOne({
    _id:    req.params.id,
    userId: req.user._id,
  });

  if (!property) {
    res.status(404);
    throw new Error('Property not found or you do not have permission to edit it.');
  }

  const safeBody = parseDeveloperInput(req, res);
  if (!safeBody) return;

  // Apply updates to the document instance
  Object.assign(property, safeBody);

  // Re-submit for admin approval when the developer edits
  // (optional — remove this line if edits should not reset status)
  property.status = 'pending';

  // .save() triggers pre('validate') → propertyGroup + geo recomputed
  //         triggers pre('save')     → slug regenerated if title changed
  await property.save();
  invalidatePropertyCaches();

  res.json(property);
});

/**
 * DELETE /api/properties/delete/:id  [protected]
 */
const deleteProperty = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  if (!req.user?._id) {
    res.status(401);
    throw new Error('Not authorised.');
  }

  const property = await Property.findOneAndDelete({
    _id:    req.params.id,
    userId: req.user._id, // ownership enforced at DB level
  });

  if (!property) {
    res.status(404);
    throw new Error('Property not found or you do not have permission to delete it.');
  }
  invalidatePropertyCaches();

  res.json({ message: 'Property deleted successfully.' });
});

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────

export {
  getFilterOptions,
  getPropertiesByType,
  getLocalitiesByCity,
  getLocationOptions,
  getFeaturedProperties,
  getRecentProperties,
  getRelatedProperties,
  getProjectUnits,
  getAllApprovedProperties,
  getPropertyById,
  addProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
};