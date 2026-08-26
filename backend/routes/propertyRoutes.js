// routes/propertyRoutes.js

import express from 'express';
import protect from '../middleware/protect.js';
import { searchProperties } from '../controllers/searchController.js';
import { searchLimiter,addPropertyLimiter, readLimiter,} from '../middleware/rateLimiters.js';
import {
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
} from '../controllers/propertyController.js';

const router = express.Router();

// ── Public – filter meta / dropdowns ──────────────────────────
router.get('/filters', getFilterOptions); //filtervalues for filterpanel dropdowns
router.get('/localities-by-type', getPropertiesByType); // footer
router.get('/location-options', searchLimiter, getLocationOptions);//used in locationSearchBar in MainSerchBar

// ── Public – curated / discovery ──────────────────────────────
router.get('/featured', readLimiter, getFeaturedProperties);//homepage hero
router.get('/recent', readLimiter, getRecentProperties);//Recently added  homepage 
router.get('/search', searchLimiter, searchProperties);//Full-text search — used by ExpandableSearchBar.same limiter can be reused* on any search surface; it's keyed per-IP.

// ── Protected – developer CRUD ────────────────────────────────
router.post('/add', protect, addPropertyLimiter, addProperty);
router.get('/my-properties', protect, getMyProperties);//Fetch the logged-in developer's own properties
router.put('/update/:id', protect, updateProperty);
router.delete('/delete/:id', protect, deleteProperty);

// ── Public – parameterised routes ─────────────────────────────
//parameterised routes are
router.get('/', readLimiter, getAllApprovedProperties);//Paginated + filtered approved listings — properties page
router.get('/localities/:city', getLocalitiesByCity);//FiltePanel dropdowns
router.get('/related/:id', getRelatedProperties);//Related properties in the Property page
router.get('/:id', getPropertyById);//used in propertyPage to show singular property

export default router;

/**
 * /my-properties Fetch the logged-in developer's own properties (all statuses).
 *
 * HOW THE DASHBOARD LINKING WORKS:
 *   - User._id (ObjectId) is stored in the JWT when logging in
 *   - protect.js does User.findById(decoded.id) → req.user._id is an ObjectId
 *   - addProperty stores userId = req.user._id on each Property document
 *   - This query finds all Properties where property.userId === user._id
 *   - DevPropertyList renders the result — no extra linking step needed
 *   - The user._id and property._id are DIFFERENT ObjectIds;
 *     what joins them is property.userId = user._id
 */

