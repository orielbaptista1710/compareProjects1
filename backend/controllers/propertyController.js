//controllers/propertyController.js
import asyncHandler from 'express-async-handler';
import Fuse from 'fuse.js';
import Property from '../models/Property.js';
import {
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
} from '../models/propertyType.js';
import { COMMON_AMENITIES, COMMON_SECURITY } from "../constants/amenities.js";

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validateSearchQuery = (search) => {
  if (!search || typeof search !== 'string') return null;
  
  const trimmed = search.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  
  return escapeRegex(trimmed);
};

const getFilterOptions = asyncHandler(async (req, res) => {
  /**
   * Principles: 
   * - Only approved properties
   * - Backend owns numeric truth
   * - Lightweight response
   */

  const matchStage = { status: "approved", bhk: { $ne: 0 }, };

  const [
    cities,
    propertyTypeOptions,
    furnishingOptions,
    facingOptions,
    parkingOptions,
    possessionStatusOptions,
    floorLabelOptions,
  ] = await Promise.all([
    Property.distinct("city", matchStage),
    Property.distinct("propertyType", matchStage),
    Property.distinct("furnishing", matchStage),
    Property.distinct("facing", matchStage),
    Property.distinct("parkings", matchStage),
    Property.distinct("possessionStatus", matchStage),
    Property.distinct("floorLabel", matchStage),
  ]);

    /* ---------------- Amenities + Security (Curated) ---------------- */

  const combinedAmenities = [...COMMON_AMENITIES, ...COMMON_SECURITY];

  const amenitiesOptions = [
    ...new Set(combinedAmenities.map((item) => item.trim()))
  ].sort();


  res.status(200).json({
    cities: cities.filter(Boolean).sort(),
    propertyTypeOptions: propertyTypeOptions.filter(Boolean).sort(),
    furnishingOptions: furnishingOptions.filter(Boolean).sort(),
    facingOptions: facingOptions.filter(Boolean).sort(),
    parkingOptions: parkingOptions.filter(Boolean).sort(),
    possessionStatusOptions: possessionStatusOptions.filter(Boolean).sort(),
    floorLabelOptions: floorLabelOptions.filter(Boolean).sort(),
    amenitiesOptions,
  });
});



  const getPropertiesByType = asyncHandler(async (req, res) => {
  const statusFilter = { status: "approved" };

  const [residentialLocalities, commercialLocalities] = await Promise.all([
    Property.distinct("locality", {
      ...statusFilter,
      propertyType: { $in: RESIDENTIAL_TYPES },
    }),

    Property.distinct("locality", {
      ...statusFilter,
      propertyType: { $in: COMMERCIAL_TYPES },
    }),
  ]);

  res.json({
    residential: residentialLocalities,
    commercial: commercialLocalities,
  });
});


 
      // Get Featured Properties (GLOBAL – not city based)
const getFeaturedProperties = asyncHandler(async (req, res) => {
  const { limit = 3, city } = req.query;

  // Build dynamic query
  const query = {
    featured: true,
    status: "approved",
  };

  //  Add city filter if provided
  if (city) {
    query.city = city; // OR use regex (better, see below)
  }

  const featuredProperties = await Property.find(query)
    .select(`
      title
      city
      locality
      price
      bhk
      furnishing
      area
      reraDate
      coverImage
      pricePerSqft
      slug
      developerName
      propertyType
      galleryImages
    `)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(featuredProperties);
});




      // Get Recent Properties (City-aware)
const getRecentProperties = asyncHandler(async (req, res) => {
  const { city, limit = 3 } = req.query;

  const query = {status: "approved"};

  // Apply city filter if provided
  if (city) {
    query.city = city;
  }
 
   
  const recentProperties = await Property.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(recentProperties);
});



    // Get PropertiesSW by approved developer/user- these properties are shown on the website
    const getAllApprovedProperties = asyncHandler(async (req, res) =>  {
  try {
    const page = Math.max(1, Math.min(1000, Number(req.query.page) || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const sortMap = {
      relevance: { featured: -1, createdAt: -1 },
      "price-low-high": { price: 1 },
      "price-high-low": { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };

    const sortBy = sortMap[req.query.sortBy] || sortMap.relevance;

    const query = {
      status: "approved",
      bhk: { $ne: 0 },
    };

  if (req.query.city) query.city = req.query.city;

  if (req.query.locality) {
    query.locality = { $in: [].concat(req.query.locality) };
  }

  if (req.query.propertyType) {
    query.propertyType = { $in: [].concat(req.query.propertyType) };
  }
  if (req.query.furnishing) {
    query.furnishing = { $in: [].concat(req.query.furnishing) };
  }

  if (req.query.facing) {
    query.facing = { $in: [].concat(req.query.facing) };
  }

  if (req.query.parkings) {
    query.parkings = { $in: [].concat(req.query.parkings) };
  }

  if (req.query.possessionStatus) {
    query.possessionStatus = { $in: [].concat(req.query.possessionStatus)
      // $in: req.query.possessionStatus.split(","),
    };
  }

  if (req.query.floorLabel) {
    query.floorLabel = {
      $in: req.query.floorLabel.split(","),
    };
  }

  if (req.query.amenities) {
  const values = [].concat(req.query.amenities);

  query.$and = query.$and || [];

  query.$and.push({
    $or: [
      { amenities: { $in: values } },
      { security: { $in: values } },
    ],
  });
}


    /* ------- BHK (1,2,3,5+) ---------------- */
    if (req.query.bhk) {
  const bhkValues = [].concat(req.query.bhk);

  const exact = [];
  let minPlus = null;

  bhkValues.forEach((v) => {
    const plusMatch = v.match(/^(\d+)\+$/);
    if (plusMatch) {
      minPlus = Number(plusMatch[1]);
    } else {
      exact.push(Number(v));
    }
  });

  if (minPlus !== null && exact.length) {
    query.$or = [
      { bhk: { $in: exact } },
      { bhk: { $gte: minPlus } },
    ];
  } else if (minPlus !== null) {
    query.bhk = { $gte: minPlus };
  } else if (exact.length) {
    query.bhk = { $in: exact };
  }
}

    if (req.query.search) {
  const safeSearch = validateSearchQuery(req.query.search);
  
  if (safeSearch) {
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
      { locality: { $regex: safeSearch, $options: "i" } },
    ];
  }
}
    const totalMatched = await Property.countDocuments(query);

    const properties = await Property.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    res.json({
      properties,
      totalMatched,
      page,
      totalPages: Math.ceil(totalMatched / limit),
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});






      // ===== CRUD ===== THIS IS USED DEVELOPER DASHBOARD -- i think the issue y the form is not working is becoz the validation or possesstionStstus and furnishing is not working in SellPropertyForm.js?
      const addProperty = asyncHandler(async (req, res) => {
        delete req.body.geo;
        delete req.body.propertyGroup;

        

          const property = new Property({ ...req.body,
             userId: req.user._id, status: 'pending' });

            await property.save();
            res.status(201).json({ success: true, message: 'Property submitted for admin approval', property });
      });

      const getMyProperties = asyncHandler(async (req, res) => {
           const properties = await Property.find({ userId: req.user._id });
            res.json(properties);
      });

      const updateProperty = asyncHandler(async (req, res) => {
        //Controller lvl sanitization- do i need to add for status,userId will that hamper with the scapering data 
        delete req.body.geo;
        delete req.body.propertyGroup;

          const property = await Property.findOneAndUpdate(
              { _id: req.params.id, userId: req.user._id },
              req.body,
              { 
                new: true,
                runValidators: true,
               }
            );
          
            if (!property) {
              res.status(404);
              throw new Error('Property not found');
            }
          
            res.json(property);
      });

      const deleteProperty = asyncHandler(async (req, res) => {
          const property = await Property.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
          
            if (!property) {
              res.status(404);
              throw new Error('Property not found');
            }
            res.json({ message: 'Property deleted successfully' });
      });

      // Get Property by Id 
      const getPropertyById = asyncHandler(async (req, res) => {
          const property = await Property.findById(req.params.id);
            if (!property) {
              res.status(404);
              throw new Error('Property not found');
            }
            res.json(property);
      });



    const getLocalitiesByCity = asyncHandler(async (req, res) => {
  const city = req.params.city;

  if (!city) {
    return res.status(400).json({ message: "City is required" });
  }

  const localities = await Property.distinct("locality", {
    city: { $regex: new RegExp(`^${city}$`, "i") },
    status: "approved",
  });

  res.json({ localities: localities.filter(Boolean).sort() });
});

 

//used for the Location seach for MainSeachBar -- needs to be updated still
const getLocationOptions = asyncHandler(async (req, res) => {
  const { q, city } = req.query;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const regex = new RegExp(q, "i");

  const match = {
    status: "approved",
    $or: [
      { locality: regex },
      { city: regex },
      { pincode: regex },
    ],
  };

  if (city) {
    match.city = city;
  }

  const results = await Property.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          city: "$city",
          locality: "$locality",
          pincode: "$pincode",
        },
      },
    },
    { $limit: 8 },
  ]);

  res.json(
    results.map(({ _id }) => ({
      label: _id.locality
        ? `${_id.locality}, ${_id.city}`
        : _id.city,
      city: _id.city,
      locality: _id.locality,
      pincode: _id.pincode,
      type: _id.locality ? "locality" : "city",
    }))
  );
});


      export {
        getFilterOptions,
        getPropertiesByType,
        getFeaturedProperties,
        getRecentProperties,
        getAllApprovedProperties,
        addProperty,
        getMyProperties,
        updateProperty,
        deleteProperty,
        getPropertyById,
        getLocalitiesByCity ,
        getLocationOptions,
      };

    
