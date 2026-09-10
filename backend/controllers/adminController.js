//controllers/adminController.js
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import * as propertyService from '../services/propertyAdminService.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from '../models/propertyType.js';

  
//PROPERTIES SHOW THAT ARE APPROVE, REJECTED N PENDING 
// GET /api/admin/properties - here are all the properties that are not approved/approved/pending for the admin to review
export const getProperties = asyncHandler(async (req, res) => {

  const { page, limit, status, propertyType, search, city, locality, sortBy, imageFilter } = req.query;

  const VALID_STATUSES = ["pending", "approved", "rejected", ""];
  //CHECK THIS DEPENDS ON Properties filter 
  const VALID_TYPES = ["Flats/Apartments", "Villa", "Plot",
                       "Builder Floor", "Commercial","Penthouse",
                       "Commercial Land", "Office Space", "Shop/Showroom" ,"Industrial Warehouse/Godown" , "Industrial Building"];

  if (status && !VALID_STATUSES.includes(status)) {
  return res.status(400).json({ message: "Invalid status filter" });
  }

  if (propertyType && !VALID_TYPES.includes(propertyType)) {
  return res.status(400).json({ message: "Invalid property type" });
  }

  console.log("✅ getProperties hit");
  console.log("📦 query params:", req.query);

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
  });
  // console.error("ADMIN FETCH ERROR:", error);   ///////????????

  res.json(result);
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

// PUT /api/admin/approve/:id - this approves the individual property via AdminDashboard - makes status = approved
export const approveProperty = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const property = await propertyService.updatePropertyStatus(req.params.id, 'approved', req.user._id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.json({ success: true, message: 'Property approved successfully', property });
});

// PUT /api/admin/reject/:id - this rejects the individual property via AdminDashboard
export const rejectProperty = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const reason = req.body?.rejectionReason || 'No reason provided'; //
  const property = await propertyService.updatePropertyStatus(req.params.id, 'rejected', req.user._id, reason);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.json({ success: true, message: 'Property rejected successfully', property });
});

// PUT /api/admin/bulk-approve - approve many properties at once (checkbox selection in AdminDashboard)
export const bulkApproveProperties = asyncHandler(async (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    res.status(400);
    throw new Error('ids must be a non-empty array');
  }

  const result = await propertyService.bulkUpdatePropertyStatus(ids, 'approved', req.user._id);
  res.json({ success: true, message: 'Properties approved successfully', ...result });
});

// PUT /api/admin/bulk-reject - reject many properties at once (checkbox selection in AdminDashboard)
export const bulkRejectProperties = asyncHandler(async (req, res) => {
  const { ids, rejectionReason } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    res.status(400);
    throw new Error('ids must be a non-empty array');
  }

  const reason = rejectionReason || 'No reason provided';
  const result = await propertyService.bulkUpdatePropertyStatus(ids, 'rejected', req.user._id, reason);
  res.json({ success: true, message: 'Properties rejected successfully', ...result });
});
