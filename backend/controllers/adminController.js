//controllers/adminController.js 
const asyncHandler = require('express-async-handler');
const propertyService = require('../services/propertyAdminService');

//PROPERTIES SHOW THAT ARE APPROVE, REJECTED N PENDING 
// GET /api/admin/properties - here are all the properties that are not approved/approved/pending for the admin to review
exports.getProperties = asyncHandler(async (req, res) => {
  const { page, limit, status, propertyType, q, city, locality , sortBy, imageFilter } = req.query;

  const result = await propertyService.fetchProperties({
    page,
    limit,
    status,
    propertyType,
    city, 
    locality,
    search: q,
    sortBy,
    imageFilter,
  });

  res.json(result);
});

// GET /api/admin/cities
exports.getCities = asyncHandler(async (req, res) => {
  const cities = await propertyService.fetchCities();
  res.json(cities);
});

// GET /api/admin/localities
exports.getLocalities = asyncHandler(async (req, res) => {
  const { city, q } = req.query;
  const localities = await propertyService.fetchLocalities({ city, q });
  res.json(localities.slice(0, 30)); // limit autocomplete spam
});


// GET /api/admin/property/:id
exports.getDeveloperDetails = asyncHandler(async (req, res) => {
  const property = await propertyService.fetchPropertyById(req.params.id);

  res.json({
    success: true,
    data: property
  });
});

// PUT /api/admin/approve/:id - this approves the individual property via AdminDashboard - makes status = approved - CHECK THIS when large no of approvals what to do? - needed security for this?
exports.approveProperty = asyncHandler(async (req, res) => {
  const property = await propertyService.updatePropertyStatus(req.params.id, 'approved', req.user._id);
  res.json({ success: true, message: 'Property approved successfully', property });
});

// PUT /api/admin/reject/:id - this rejects the individual property via AdminDashboard
exports.rejectProperty = asyncHandler(async (req, res) => {
  const reason = req.body.rejectionReason || 'No reason provided';
  const property = await propertyService.updatePropertyStatus(req.params.id, 'rejected', req.user._id, reason);
  res.json({ success: true, message: 'Property rejected successfully', property });
});
