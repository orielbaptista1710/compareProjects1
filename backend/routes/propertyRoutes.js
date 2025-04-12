const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');


// GET all properties (Public route)
// Public routes - only approved properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'approved' })
      .populate('userId', 'displayName');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// router.post('/add', protect, async (req, res) => {
//   try {
//     const property = new Property({ ...req.body, userId: req.user._id });
//     await property.save();
//     res.status(201).json(property);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });

router.post('/add', protect, async (req, res) => {
  try {
    const property = new Property({ 
      ...req.body, 
      userId: req.user._id,
      status: 'pending' // Ensure status is set to pending
    });
    await property.save();
    res.status(201).json({
      success: true,
      message: 'Property submitted for admin approval',
      property
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/my-properties', protect, async (req, res) => {
  try {
    const properties = await Property.find({ userId: req.user._id });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add this to your propertyRoutes.js
router.put('/update/:id', protect, async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: 'Server errorR', error: err.message });
  }
});

router.delete('/delete/:id', protect, async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



module.exports = router;
