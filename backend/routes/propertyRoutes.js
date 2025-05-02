const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');

// router.get("/filters", async (req, res) => {
//   try {
//     const cities = await Property.distinct("city");
//     const localities = await Property.distinct("locality");
//     res.json({ cities, localities });
//   } catch (error) {
//     console.error("Error fetching cities/localities:", error);
//     res.status(500).json({ message: "Server Error", error });
//   }
// });


// GET filter options: cities, localities, possessionStatus, furnishing, facing, floor
router.get("/filters", async (req, res) => {
  try {
    const cities = await Property.distinct("city");
    const localities = await Property.distinct("locality");
    const possessionStatusOptions = await Property.distinct("possessionStatus");
    const furnishingOptions = await Property.distinct("furnishing");
    const facingOptions = await Property.distinct("facing");
    const floorOptions = await Property.distinct("floor");
    const ageOptions = await Property.distinct("ageOfProperty");
    const bathroomOptions = await Property.distinct("bathrooms");
    const balconyOptions = await Property.distinct("balconies");

    res.json({
      cities,
      localities,
      possessionStatusOptions,
      furnishingOptions,
      facingOptions,
      floorOptions,
      ageOptions,
      bathroomOptions,
      balconyOptions
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

router.get('/localities-by-type', async (req, res) => {
  try {
    const result = {};
    
    const types = ['Residential', 'Industrial', 'Commercial', 'Plot', 'Retail'];
    
    for (const type of types) {
      const localities = await Property.distinct('locality', { 
        propertyType: type,
        status: 'approved' 
      });
      result[type.toLowerCase()] = localities; 
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get featured properties
router.get('/featured', async (req, res) => {
  try {
    const featuredProperties = await Property.find({ 
      status: 'approved',
      featured: true 
    }).limit(5); 
    
    res.json(featuredProperties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


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
