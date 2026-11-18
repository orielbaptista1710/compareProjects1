//controllers/adminController.js
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import * as propertyService from '../services/propertyAdminService.js';
import logger from '../utils/logger.js';
import { LISTED_BY, LISTING_STATUS } from '../constants/roles.js';
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from '../models/propertyType.js';
import { readReason } from '../utils/readReason.js';
import { readVersion } from '../utils/contentVersion.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// The same list the model enforces, so the admin filter can't accept a type
// no listing can have (or miss one it can).
const VALID_TYPES = [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES];
// "" = all statuses
const VALID_STATUSES = [...Object.values(LISTING_STATUS), ""];

//PROPERTIES SHOW THAT ARE APPROVE, REJECTED N PENDING 
// GET /api/admin/properties - here are all the properties that are not approved/approved/pending for the admin to review
export const getProperties = asyncHandler(async (req, res) => {

  const { page, limit, status, propertyType, search, city, locality, sortBy, imageFilter, listedBy } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
  return res.status(400).json({ message: "Invalid status filter" });
  }

  if (propertyType && !VALID_TYPES.includes(propertyType)) {
  return res.status(400).json({ message: "Invalid property type" });
  }

  if (listedBy && !Object.values(LISTED_BY).includes(listedBy)) {
    return res.status(400).json({ message: "Invalid listedBy filter" });
  }

  // Debug level: printed locally, dropped in production (logger level is info there).
  logger.debug("✅ getProperties hit");
  logger.debug("📦 query params", { query: req.query });

  const result = await propertyService.fetchProperties({
    page,
    limit,
    status,
    propertyType,
    city, 
    locality, 
    search,
    sortBy,
    imageFilter,
    listedBy,
  });

  res.json(result);
});

// GET /api/admin/properties/counts - how many listings are in each status, for
// the pending badge on the admin tab. Cached for a few seconds in the service.
export const getStatusCounts = asyncHandler(async (req, res) => {
  res.json(await propertyService.fetchStatusCounts());
});

// GET /api/admin/cities
export const getCities = asyncHandler(async (req, res) => {
  const cities = await propertyService.fetchCities();
  res.json(cities);
});

// GET /api/admin/localities
export const getLocalities = asyncHandler(async (req, res) => {
  const { city, q } = req.query;
  const localities = await propertyService.fetchLocalities({ city, q });
  res.json(localities.slice(0, 30)); // limit autocomplete spam
});


// GET /api/admin/property/:id
export const getDeveloperDetails = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const property = await propertyService.fetchPropertyById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.json({
    success: true,
    data: property
  });
});

// Already-decided wording for the 409 (the listing's current status).
const ALREADY_REVIEWED_MESSAGE = {
  [LISTING_STATUS.APPROVED]: 'This listing is already approved',
  [LISTING_STATUS.SUSPENDED]: "This listing is already approved; it's hidden until the posting agent is reinstated",
  [LISTING_STATUS.REJECTED]: 'This listing is already rejected',
};

// updatePropertyStatus result → the updated listing, or a 403/404/409 error.
function reviewedOrThrow(result, res) {
  if (result.error === 'not_found') {
    res.status(404);
    throw new Error('Property not found');
  }
  // A reviewer can't approve or reject their own submission
  if (result.error === 'self_review') {
    res.status(403);
    throw new Error('You cannot review a property you submitted yourself');
  }
  // The poster edited the listing after the admin opened it (FORM-02)
  if (result.error === 'changed') {
    res.status(409);
    throw new Error('This listing was edited after you opened it. Reload it and review the latest version.');
  }
  if (result.error === 'already_reviewed') {
    res.status(409);
    throw new Error(ALREADY_REVIEWED_MESSAGE[result.status] ?? 'This listing has already been reviewed');
  }
  return result.property;
}

// Every review names the listing version it applies to (contentVersion, as
// the admin list and details return it), so a listing edited after the admin
// opened it isn't decided on unseen content (FORM-02).
function versionOrThrow(req, res) {
  const version = readVersion(req.body?.version);
  if (version === null) {
    res.status(400);
    throw new Error('Reload the listing and try again (version missing)');
  }
  return version;
}

// Bulk: { [id]: version }. Anything malformed is dropped, so that listing is
// skipped as "changed" rather than decided blind.
function readVersions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [id, v] of Object.entries(value).slice(0, 100)) {
    const version = readVersion(v);
    if (isValidId(id) && version !== null) out[id] = version;
  }
  return out;
}

// PUT /api/admin/approve/:id - this approves the individual property via AdminDashboard - makes status = approved
export const approveProperty = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const version = versionOrThrow(req, res);
  const result = await propertyService.updatePropertyStatus(req.params.id, LISTING_STATUS.APPROVED, req.user._id, null, version);
  const property = reviewedOrThrow(result, res);

  const message = property.status === LISTING_STATUS.SUSPENDED
    ? 'Approved, but hidden until the posting agent is reinstated'
    : 'Property approved successfully';
  res.json({ success: true, message, property });
});

// PUT /api/admin/reject/:id - this rejects the individual property via AdminDashboard
export const rejectProperty = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const version = versionOrThrow(req, res);
  const reason = readReason(req.body?.rejectionReason);
  const result = await propertyService.updatePropertyStatus(req.params.id, LISTING_STATUS.REJECTED, req.user._id, reason, version);
  const property = reviewedOrThrow(result, res);

  res.json({ success: true, message: 'Property rejected successfully', property });
});

// PUT /api/admin/bulk-approve - approve many properties at once (checkbox selection in AdminDashboard)
export const bulkApproveProperties = asyncHandler(async (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    res.status(400);
    throw new Error('ids must be a non-empty array');
  }

  const versions = readVersions(req.body?.versions);
  const result = await propertyService.bulkUpdatePropertyStatus(ids, LISTING_STATUS.APPROVED, req.user._id, null, versions);
  res.json({ success: true, message: 'Properties approved successfully', ...result });
});

// PUT /api/admin/bulk-reject - reject many properties at once (checkbox selection in AdminDashboard)
export const bulkRejectProperties = asyncHandler(async (req, res) => {
  const { ids, rejectionReason } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    res.status(400);
    throw new Error('ids must be a non-empty array');
  }

  const reason = readReason(rejectionReason);
  const versions = readVersions(req.body?.versions);
  const result = await propertyService.bulkUpdatePropertyStatus(ids, LISTING_STATUS.REJECTED, req.user._id, reason, versions);
  res.json({ success: true, message: 'Properties rejected successfully', ...result });
});
