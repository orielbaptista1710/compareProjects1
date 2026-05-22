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

/** Escape special regex characters from user input */
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
 * Parse a query parameter that may arrive as a single string or an array
 * (Express repeats the key for multi-value params).
 */
const toArray = (value) => (value == null ? [] : [].concat(value));

/**
 * Safely parse an integer from a query param with clamping.
 */
const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

/** Validate MongoDB ObjectId to avoid CastError in downstream queries */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
    Property.distinct('city',            base),
    Property.distinct('propertyType',    base),
    Property.distinct('furnishing',      base),
    Property.distinct('facing',          base),
    Property.distinct('parkings',        base),
    Property.distinct('possessionStatus',base),
    Property.distinct('floorLabel',      base),
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
 * All distinct localities for a given city (used in filter dropdowns).
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
 * Returns featured + approved properties, optionally filtered by city.
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
 * Returns the most recently created approved properties, optionally by city.
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
      'developerName propertyType slug bhkType createdAt'
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
 * Returns properties from the same project or the same developer (fallback).
 */
const getRelatedProperties = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  const current = await Property.findById(id).lean();
  if (!current) {
    res.status(404);
    throw new Error('Property not found.');
  }

  const related = await Property.find({
    _id:    { $ne: id },
    status: 'approved',
    $or: [
      { projectName: current.projectName },
      { userId:      current.userId      },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('title price bhk area coverImage createdAt developerName slug')
    .lean();

  res.json(related);
});

// ─────────────────────────────────────────────
// Public – Listings (paginated + filtered)
// ─────────────────────────────────────────────

/**
 * GET /api/properties
 * Full-featured paginated listing with every supported filter.
 */
const getAllApprovedProperties = asyncHandler(async (req, res) => {
  const page  = clampInt(req.query.page,  1,  1,  MAX_PAGE_NUMBER);
  const limit = clampInt(req.query.limit, DEFAULT_PAGE_LIMIT, 1, MAX_PAGE_LIMIT);
  const skip  = (page - 1) * limit;

  const sortBy = SORT_MAP[req.query.sortBy] ?? SORT_MAP.relevance;

  // ── Base query ──────────────────────────────
  const query = { status: 'approved', bhk: { $ne: 0 } };

  // ── Scalar string filters ────────────────────
  if (req.query.city) {
    const safeCity = sanitiseSearch(req.query.city);
    if (safeCity) query.city = { $regex: new RegExp(`^${safeCity}$`, 'i') };
  }

  // ── Array filters ($in) ──────────────────────
  const arrayFilters = [
    'locality', 'propertyType', 'furnishing',
    'facing', 'parkings', 'possessionStatus',
  ];

  arrayFilters.forEach((key) => {
    const values = toArray(req.query[key]).filter(Boolean);
    if (values.length) query[key] = { $in: values };
  });

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

    bhkValues.forEach((v) => {
      const match = String(v).match(/^(\d+)\+$/);
      if (match) {
        const n = Number(match[1]);
        if (minPlus === null || n < minPlus) minPlus = n;
      } else {
        const n = Number(v);
        if (!Number.isNaN(n)) exact.push(n);
      }
    });

    if (minPlus !== null && exact.length) {
      query.$or = [{ bhk: { $in: exact } }, { bhk: { $gte: minPlus } }];
    } else if (minPlus !== null) {
      query.bhk = { $gte: minPlus };
    } else if (exact.length) {
      query.bhk = { $in: exact };
    }
  }

  // ── Area range ───────────────────────────────
  if (req.query.areaMin != null || req.query.areaMax != null) {
    const areaQuery = {};
    const min = parseFloat(req.query.areaMin);
    const max = parseFloat(req.query.areaMax);
    if (!Number.isNaN(min) && min >= 0)  areaQuery.$gte = min;
    if (!Number.isNaN(max) && max >= 0)  areaQuery.$lte = max;
    if (Object.keys(areaQuery).length) {
      query['area.value'] = areaQuery;
    }
    // Optionally filter by unit when both bounds + unit are supplied
    if (req.query.areaUnit) {
      query['area.unit'] = req.query.areaUnit;
    }
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

  // ── Full-text search (title / description / locality) ─────────
  if (req.query.search) {
    const safe = sanitiseSearch(req.query.search);
    if (safe) {
      const regex = { $regex: safe, $options: 'i' };
      const searchOr = [
        { title:       regex },
        { description: regex },
        { locality:    regex },
      ];
      // Merge with any existing $or (e.g. from BHK filter)
      if (query.$or) {
        query.$and = query.$and ?? [];
        query.$and.push({ $or: query.$or  });
        query.$and.push({ $or: searchOr  });
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
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
    { $group: { _id: { city: '$city', locality: '$locality', pincode: '$pincode' } } },
    { $limit: LOCATION_RESULT_CAP },
  ]);

  res.json(
    results.map(({ _id }) => ({
      label:    _id.locality ? `${_id.locality}, ${_id.city}` : _id.city,
      city:     _id.city,
      locality: _id.locality  ?? null,
      pincode:  _id.pincode   ?? null,
      type:     _id.locality  ? 'locality' : 'city',
    }))
  );
});

// ─────────────────────────────────────────────
// Public – Single property
// ─────────────────────────────────────────────

/**
 * GET /api/properties/:id
 */
const getPropertyById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  const property = await Property.findById(req.params.id).lean();

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
 */
const addProperty = asyncHandler(async (req, res) => {
  // Strip any fields that must not be set by the client
  const { geo, propertyGroup, status, userId: _uid, ...safeBody } = req.body;

  const property = await Property.create({
    ...safeBody,
    userId: req.user._id,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Property submitted for admin approval.',
    property,
  });
});

/**
 * GET /api/properties/my-properties  [protected]
 */
const getMyProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(properties);
});

/**
 * PUT /api/properties/update/:id  [protected]
 */
const updateProperty = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  // Strip immutable / server-managed fields from the payload
  const { geo, propertyGroup, status, userId: _uid, ...safeBody } = req.body;

  const property = await Property.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    safeBody,
    { new: true, runValidators: true }
  );

  if (!property) {
    res.status(404);
    throw new Error('Property not found or you do not have permission to edit it.');
  }

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

  const property = await Property.findOneAndDelete({
    _id:    req.params.id,
    userId: req.user._id,
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
  // Meta
  getFilterOptions,
  getPropertiesByType,
  getLocalitiesByCity,
  getLocationOptions,

  // Public reads
  getFeaturedProperties,
  getRecentProperties,
  getRelatedProperties,
  getAllApprovedProperties,
  getPropertyById,

  // Auth-protected CRUD
  addProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
};