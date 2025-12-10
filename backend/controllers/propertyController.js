const asyncHandler = require('express-async-handler');
const Fuse = require('fuse.js');
// import slugify from "slugify";
const Property = require('../models/Property');




      //Filter options for Filter and Filter Panel for Properties.js Page
      const getFilterOptions = asyncHandler(async (req, res) => {

        const states = await Property.distinct('state');
          const cities = await Property.distinct('city');
          const localities = await Property.distinct('locality');
          const possessionStatusOptions = await Property.distinct('possessionStatus');
          const furnishingOptions = await Property.distinct('furnishing');
          const facingOptions = await Property.distinct('facing');
          const floorOptions = await Property.distinct('floor');
          const ageOptions = await Property.distinct('ageOfProperty');
          const bathroomOptions = await Property.distinct('bathrooms');
          const balconyOptions = await Property.distinct('balconies');
          const bhkOptions = await Property.distinct('bhk');
          const parkingOptions = await Property.distinct('parkings');
          const propertyTypeOptions = await Property.distinct('propertyType');
        
          res.json({
            states, cities, localities, possessionStatusOptions, furnishingOptions,
            facingOptions, floorOptions, ageOptions, bathroomOptions, balconyOptions,
            bhkOptions, parkingOptions, propertyTypeOptions
          });  

      });

      const getPropertiesByType = asyncHandler(async (req, res) => {
          const result = {};
  const types = ['Residential','Industrial','Commercial','Plot','Retail'];

  for (const type of types) {
    const localities = await Property.distinct('locality', { propertyType: type, status: 'approved' });
    result[type.toLowerCase()] = localities;
  }

  res.json(result);
      })
 
      // Get Featured Properties
      const getFeaturedProperties = asyncHandler(async (req, res) => {
        const featuredProperties = await Property.find({ featured: true });
        res.json(featuredProperties);
      });

      // Get Recent Properties - used in the Top Projects on the Home Page - HAVE TO MAKE CHANGES
      const getRecentProperties = asyncHandler(async (req, res) => {
        const recentProperties = await Property.find().sort({ createdAt: -1 }).limit(3);
        res.json(recentProperties);
      });

      // Get Properties by approved developer/user- these properties are shown on the website
      const getAllApprovedProperties = asyncHandler(async (req, res) => {
        const properties = await Property.find({ status: 'approved' }).populate('userId', 'displayName');
        res.json(properties);
      });

      // ===== CRUD =====
      const addProperty = asyncHandler(async (req, res) => {
          const property = new Property({ ...req.body, userId: req.user._id, status: 'pending' });

            await property.save();
            res.status(201).json({ success: true, message: 'Property submitted for admin approval', property });
      });

      const getMyProperties = asyncHandler(async (req, res) => {
           const properties = await Property.find({ userId: req.user._id });
            res.json(properties);
      });

      const updateProperty = asyncHandler(async (req, res) => {
          const property = await Property.findOneAndUpdate(
              { _id: req.params.id, userId: req.user._id },
              req.body,
              { new: true }
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
  try {
    const city = req.params.city;

    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    // Case-insensitive match (handles Mumbai / mumbai / MUMBAI)
    const localities = await Property.distinct("locality", {
      city: { $regex: new RegExp(`^${city}$`, "i") }
    });

    res.json({ localities });
  } catch (error) {
    console.error("Error fetching localities:", error);
    res.status(500).json({ message: "Server Error" });
  }
});




      module.exports = {
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
        getLocalitiesByCity 
      }

    
