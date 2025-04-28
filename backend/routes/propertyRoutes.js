const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');

router.get("/filters", async (req, res) => {
  try {
    const cities = await Property.distinct("city");
    const localities = await Property.distinct("locality");
    res.json({ cities, localities });
  } catch (error) {
    console.error("Error fetching cities/localities:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});


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


router.post('/add', protect, async (req, res) => {
  try {
    console.log('Incoming request body:', req.body);
    const property = new Property({ 
      ...req.body, 
      userId: req.user._id,
      status: 'pending' 
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

// Get localities grouped by property type
router.get('/localities', async (req, res) => {
  try {
    const localities = await Property.aggregate([
      {
        $group: {
          _id: {
            propertyType: '$propertyType',
            locality: '$locality'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          propertyType: '$_id.propertyType',
          name: '$_id.locality',
          count: 1
        }
      },
      { $sort: { count: -1 } } // Sort by most properties first
    ]);
    res.json(localities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





module.exports = router;
