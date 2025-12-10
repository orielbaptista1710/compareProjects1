const asyncHandler = require('express-async-handler');
const propertyService = require('../services/propertyAdminService');

// GET /api/admin/properties
exports.getProperties = asyncHandler(async (req, res) => {
  const { page, limit, status, city, state, propertyType, q } = req.query;

  const result = await propertyService.fetchProperties({
    page,
    limit,
    status,
    city,
    state,
    propertyType,
    search: q,
  });

  res.json(result);
});

// GET /api/admin/properties/:id
exports.getDeveloperDetails = asyncHandler(async (req, res) => {
  const property = await propertyService.fetchPropertyById(req.params.id);

  res.json({
    success: true,
    data: property
  });
});

// PUT /api/admin/approve/:id
exports.approveProperty = asyncHandler(async (req, res) => {
  const property = await propertyService.updatePropertyStatus(req.params.id, 'approved', req.user._id);
  res.json({ success: true, message: 'Property approved successfully', property });
});

// PUT /api/admin/reject/:id
exports.rejectProperty = asyncHandler(async (req, res) => {
  const reason = req.body.rejectionReason || 'No reason provided';
  const property = await propertyService.updatePropertyStatus(req.params.id, 'rejected', req.user._id, reason);
  res.json({ success: true, message: 'Property rejected successfully', property });
});
