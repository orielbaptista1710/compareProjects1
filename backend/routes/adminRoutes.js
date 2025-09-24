const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');
const isAdmin = require('../middleware/isAdmin');

// Get all pending properties
router.get('/pending-properties', protect, isAdmin, asyncHandler(async (req, res) => {
  const properties = await Property.find({ status: 'pending' })
    .populate('userId', 'displayName');
  res.json(properties);
}));

// Approve a property
router.put('/approve/:id', protect, isAdmin, asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'approved',
      reviewedBy: req.user._id,
      reviewedAt: Date.now()
    },
    { new: true }
  );

  if (!property) {
    res.status(404);
    throw new Error('Property not found'); // handled by global error handler
  }

  res.json({ 
    success: true,
    message: 'Property approved successfully',
    property
  });
}));

// Reject a property
router.put('/reject/:id', protect, isAdmin, asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'rejected',
      rejectionReason: rejectionReason || 'No reason provided',
      reviewedBy: req.user._id,
      reviewedAt: Date.now()
    },
    { new: true }
  );

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.json({ 
    success: true, 
    message: 'Property rejected successfully',
    property
  });
}));

// Get all properties (admin view)
router.get('/all-properties', protect, isAdmin, asyncHandler(async (req, res) => {
  const properties = await Property.find()
    .populate('userId', 'displayName')
    .populate('reviewedBy', 'displayName');
  res.json(properties);
}));

module.exports = router;
// Note: The above routes are for the admin panel and are not accessible to regular users.