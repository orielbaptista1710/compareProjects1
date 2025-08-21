const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) return res.json([]);

    const q = query.toLowerCase();
    const filters = { status: "approved" }; // always only approved

    // ===== Property Types =====
    const propertyTypes = [
      "villa",
      "bungalow",
      "flat",
      "apartment",
      "plot",
      "shop",
      "showroom",
      "warehouse",
      "retail"
    ];
    const foundType = propertyTypes.find(type => q.includes(type));
    if (foundType) {
      filters.propertyType = new RegExp(foundType, "i");
    }

    // ===== Furnishing =====
    const furnishingKeywords = ["furnished", "semi furnished", "unfurnished", "fully furnished"];
    const foundFurnishing = furnishingKeywords.find(f => q.includes(f));
    if (foundFurnishing) {
      filters.furnishing = { $in: [new RegExp(foundFurnishing, "i")] };
    }

    // ===== BHK =====
    const bhkMatch = q.match(/(\d+)\s*bhk/);
    if (bhkMatch) {
      filters.bhk = new RegExp(`${bhkMatch[1]}\\s*bhk`, "i");
    }

    // ===== RERA =====
    if (q.includes("rera")) {
      filters.reraApproved = true;
    }

    // ===== Price Range =====
    const priceMatch = q.match(/under\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
    if (priceMatch) {
      let price = parseInt(priceMatch[1], 10);
      if (priceMatch[2]) {
        if (priceMatch[2].includes("lakh")) price *= 100000;
        if (priceMatch[2].includes("cr") || priceMatch[2].includes("crore")) price *= 10000000;
      }
      filters.price = { $lte: price };
    }

    // ===== Location (in <city/locality/state>) =====
    const locationMatch = q.match(/in ([a-zA-Z\s]+)/);
    if (locationMatch) {
      const loc = locationMatch[1].trim();
      filters.$or = [
        { city: new RegExp(loc, "i") },
        { locality: new RegExp(loc, "i") },
        { state: new RegExp(loc, "i") }
      ];
    }

    // ===== Landmarks (near <keyword>) =====
    const nearMatch = q.match(/near ([a-zA-Z\s]+)/);
    if (nearMatch) {
      const landmark = nearMatch[1].trim();
      filters["landmarks.name"] = new RegExp(landmark, "i");
    }

    // ===== Fallback to title/description search =====
    if (Object.keys(filters).length <= 1) { // only status is set
      filters.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { long_description: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { locality: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } }
      ];
    }

    const properties = await Property.find(filters)
      .select("title locality city state price images propertyType bhk furnishing reraApproved")
      .limit(5)
      .lean();

    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


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

// Get localities for a specific city
router.get("/localities/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const localities = await Property.distinct("locality", {
      city: { $regex: new RegExp(`^${city}$`, 'i') }
    });
    res.json({ localities });
  } catch (error) {
    console.error("Error fetching localities for city:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});




// GET property types grouped by category
router.get("/property-types", async (req, res) => {
  try {
    // Get all available property types from the database
    const availablePropertyTypes = await Property.distinct("propertyType");
    
    // Define the property type structure based on your schema
    const propertyTypeStructure = {
      Residential: ["Flats/Apartments", "Villa", "Plot"],
      Commercial: ["Shop/Showroom", "Industrial Warehouse", "Retail"]
    };

    // Filter to only include property types that exist in your database
    const filteredPropertyTypes = {};
    
    Object.keys(propertyTypeStructure).forEach(group => {
      const availableInGroup = propertyTypeStructure[group].filter(type => 
        availablePropertyTypes.includes(type)
      );
      
      if (availableInGroup.length > 0) {
        filteredPropertyTypes[group] = availableInGroup.map(type => ({
          value: type,
          label: type
        }));
      }
    });

    // Convert to react-select format
    const propertyTypeOptions = Object.keys(filteredPropertyTypes).map(group => ({
      label: group,
      options: filteredPropertyTypes[group]
    }));

    res.json({
      propertyTypes: propertyTypeOptions,
      availablePropertyTypes // Also send flat array for reference
    });
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});



//used in the footer . it was used in MainSearchBar but the design was changed to Get localities grouped by property type
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

// Get featured properties
router.get('/featured', async (req, res) => {
  try {
    const featuredProperties = await Property.find({ featured: true });
    res.json(featuredProperties);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured properties', error });
  }
});

// In your Express routes file
router.get('/recent', async (req, res) => {
  try {
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(3); // Limit to 3 in the query itself
    res.json(recentProperties);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// GET a single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
