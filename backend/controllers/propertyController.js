// controllers/propertyController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from '../models/propertyType.js';
import { COMMON_AMENITIES, COMMON_SECURITY } from '../constants/amenities.js';

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

const SORT_MAP = {
  relevance:        { featured: -1, createdAt: -1 },
  'price-low-high': { price: 1 },
  'price-high-low': { price: -1 },
  newest:           { createdAt: -1 },
  oldest:           { createdAt: 1  },
};

const DEFAULT_PAGE_LIMIT = 12;
const MAX_PAGE_LIMIT      = 100;
const MAX_PAGE_NUMBER     = 1_000;
const MAX_LIMIT_FEATURED  = 20;
const MAX_LIMIT_RECENT    = 20;
const LOCATION_RESULT_CAP = 8;

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

/**
 * FIX — normalise the area sub-document from the frontend payload.
 * The SellPropertyForm sends { areaValue, areaUnit } as flat fields.
 * The submit transform in usePropertyForm assembles { area: { value, unit } }
 * before sending, but we defensively handle both shapes here so a bad client
 * can't silently drop the area data.
 */
const normaliseArea = (body) => {
  if (body.area?.value != null) return body.area; // already nested — correct
  if (body.areaValue != null) {
    return { value: Number(body.areaValue), unit: body.areaUnit || 'sqft' };
  }
  return undefined;
};

/**
 * FIX — normalise coordinates to ensure both fields are numbers, not strings.
 * Mongoose's pre('validate') hook recomputes geo from coordinates,
 * so this being numbers is critical.
 */
const normaliseCoordinates = (raw) => {
  if (!raw) return undefined;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (isNaN(lat) || isNaN(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
};

// ─────────────────────────────────────────────
// Public – Filter meta-data
// ─────────────────────────────────────────────

/**
 * GET /api/properties/filters
 * Returns all distinct filter option values for the UI dropdowns.
 */
const getFilterOptions = asyncHandler(async (_req, res) => {
  const base = { status: 'approved', bhk: { $ne: 0 } };

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
    .select('title price bhk area coverImage createdAt developerName slug propertyType locality')
    .lean();

  res.json(related);
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

  const sortBy = SORT_MAP[req.query.sortBy] ?? SORT_MAP.relevance;

  // ── Base query ──────────────────────────────
  const query = { status: 'approved', bhk: { $ne: 0 } };

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

  // ── Execute in parallel ──────────────────────
  const [totalMatched, properties] = await Promise.all([
    Property.countDocuments(query),
    Property.find(query).sort(sortBy).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    properties,
    totalMatched,
    page,
    totalPages: Math.ceil(totalMatched / limit),
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
  }).lean();

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
const addProperty = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    res.status(401);
    throw new Error('Not authorised.');
  }

  // Strip server-managed fields — clients must not set these
  const {
    geo,
    propertyGroup,
    status,
    slug,
    userId: _uid,
    ...safeBody
  } = req.body;

  // Normalise area — handles both flat (areaValue/areaUnit) and nested shapes
  const area = normaliseArea(safeBody);
  if (area) {
    safeBody.area = area;
    delete safeBody.areaValue;
    delete safeBody.areaUnit;
  }

  // Normalise coordinates — ensure numbers, reject out-of-range values
  if (safeBody.coordinates) {
    const coords = normaliseCoordinates(safeBody.coordinates);
    if (!coords) delete safeBody.coordinates; // invalid coords — drop silently
    else safeBody.coordinates = coords;
  }

  // Ensure pincode is always a string (matches schema regex /^\d{6}$/)
  if (safeBody.pincode != null) {
    safeBody.pincode = String(safeBody.pincode).trim();
  }

  console.log('[addProperty] safeBody reaching Mongoose:', JSON.stringify(safeBody, null, 2));
  const property = await Property.create({
    ...safeBody,
    userId: req.user._id, // ObjectId from protect middleware
    status: 'pending',
  }).catch((err) => {
    console.error('[addProperty] Mongoose ValidationError:');
    if(err.errors){
      Object.entries(err.errors).forEach(([field, e]) => {
        console.error(`  ${field}: ${e.message} (value: ${JSON.stringify(e.value)})`);
    });
  }else{
    console.error(err.message);
    }
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

  // Strip server-managed fields
  const {
    geo,
    propertyGroup,
    status,
    slug,
    userId: _uid,
    ...safeBody
  } = req.body;

  // Same normalisations as addProperty
  const area = normaliseArea(safeBody);
  if (area) {
    safeBody.area = area;
    delete safeBody.areaValue;
    delete safeBody.areaUnit;
  }

  if (safeBody.coordinates) {
    const coords = normaliseCoordinates(safeBody.coordinates);
    if (!coords) delete safeBody.coordinates;
    else safeBody.coordinates = coords;
  }

  if (safeBody.pincode != null) {
    safeBody.pincode = String(safeBody.pincode).trim();
  }

  // Apply updates to the document instance
  Object.assign(property, safeBody);

  // Re-submit for admin approval when the developer edits
  // (optional — remove this line if edits should not reset status)
  property.status = 'pending';

  // .save() triggers pre('validate') → propertyGroup + geo recomputed
  //         triggers pre('save')     → slug regenerated if title changed
  await property.save();

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
  getAllApprovedProperties,
  getPropertyById,
  addProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
};