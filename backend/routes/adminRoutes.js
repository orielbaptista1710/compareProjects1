const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');
const isAdmin = require('../middleware/isAdmin');


// Get all pending properties
router.get('/pending-properties', protect, isAdmin, async (req, res) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('userId', 'displayName');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Approve a property
router.put('/approve/:id', protect, isAdmin, async (req, res) => {
  try {
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
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ 
      success: true,
      message: 'Property approved successfully',
      property
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reject a property with optional reason
// Make sure your reject route looks exactly like this:
router.put('/reject/:id', protect, isAdmin, async (req, res) => {
    try {
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
        return res.status(404).json({ message: 'Property not found' });
      }
  
      res.json({ 
        success: true,
        message: 'Property rejected successfully',
        property
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// Get all properties (admin view - includes all statuses)
router.get('/all-properties', protect, isAdmin, async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('userId', 'displayName')
      .populate('reviewedBy', 'displayName');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;