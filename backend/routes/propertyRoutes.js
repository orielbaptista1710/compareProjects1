// routes/propertyRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/protect.js';
import { searchProperties } from '../controllers/searchController.js';
import {
  // Meta / filter options
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
} from '../controllers/propertyController.js';

const router = express.Router();

// ─── Rate limiter — search only ───────────────────────────────────────────────
// 30 searches per IP per minute is generous for real users, painful for bots.
// Skip in test environment so Jest doesn't trip over it.

//Can i reuse this ratelimiter as hook for other seach bar on website - like MianSeachBar n SeachBar oon FilterPanel
//WHERE IS searchLimiter being used
const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many search requests. Please slow down.' },
  // keyGenerator: (req) => {
  //   // Trust proxy header if you're behind nginx/Render/Railway
  //   return req.headers['x-forwarded-for']?.split(',')[0] ?? req.ip;
  // }, // what does it mean and do?? CHECK THIS 
});

// ─────────────────────────────────────────────
// Public helpers

/** Distinct filter values for the FilterPanel dropdowns */
router.get('/filters', getFilterOptions);

/** Localities grouped by residential / commercial — used in footer links */
router.get('/localities-by-type', getPropertiesByType);

/** Distinct localities for a given city — used in filter dropdowns */
router.get('/localities/:city', getLocalitiesByCity); ///need to improve on this -- what do i do for vile parle , vile parle east and vile parle west and Vile Parle/Juhn 
// so im need to consider how to list them on the MainSeachBar(Home Page) and the FilterPanel(Properties Pg)

/** Autocomplete results for the main search bar */
router.get('/location-options', getLocationOptions); //CHECK THIS TOO

// ─────────────────────────────────────────────
// Public – curated / discovery
// ─────────────────────────────────────────────

/** Featured projects — homepage hero section */
router.get('/featured', getFeaturedProperties);

/** Recently added listings — homepage section */
router.get('/recent', getRecentProperties);

/** Full-text search — ExpandableSearchBar -- CAN I use ti somewhere else? */
router.get('/search', searchProperties);

// ───────────────────────────────────────────── 
// Protected – developer CRUD
// (must sit above /:id so Express resolves them first)
// ─────────────────────────────────────────────

router.post('/add',              protect, addProperty);
router.get('/my-properties',     protect, getMyProperties);
router.put('/update/:id',        protect, updateProperty);
router.delete('/delete/:id',     protect, deleteProperty);

// ─────────────────────────────────────────────
// Public – listings & detail
// (generic /:id must come last)
// ─────────────────────────────────────────────

/** Paginated + filtered property listings — /properties page */
router.get('/', getAllApprovedProperties);

/** Related properties for a given listing */
router.get('/related/:id', getRelatedProperties);

/** Single property detail */
router.get('/:id', getPropertyById);

export default router;