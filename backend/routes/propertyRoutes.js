const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const protect = require('../middleware/protect');
const asyncHandler = require('express-async-handler');

// ===== SEARCH ROUTE =====
router.get('/search', asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim().length < 2) return res.json([]);

  const q = query.toLowerCase();
  const filters = { status: 'approved' };

  // Property Types
  const propertyTypes = ["villa","bungalow","flat","apartment","plot","shop","showroom","warehouse","retail"];
  const foundType = propertyTypes.find(type => q.includes(type));
  if (foundType) filters.propertyType = new RegExp(foundType, 'i');

  // Furnishing
  const furnishingKeywords = ["furnished","semi furnished","unfurnished","fully furnished"];
  const foundFurnishing = furnishingKeywords.find(f => q.includes(f));
  if (foundFurnishing) filters.furnishing = { $in: [new RegExp(foundFurnishing, 'i')] };

  // BHK
  const bhkMatch = q.match(/(\d+)\s*bhk/);
  if (bhkMatch) filters.bhk = new RegExp(`${bhkMatch[1]}\\s*bhk`, 'i');

  // RERA
  if (q.includes('rera')) filters.reraApproved = true;

  // Price Range
  const priceMatch = q.match(/under\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  if (priceMatch) {
    let price = parseInt(priceMatch[1], 10);
    if (priceMatch[2]) {
      if (priceMatch[2].includes('lakh')) price *= 100000;
      if (priceMatch[2].includes('cr') || priceMatch[2].includes('crore')) price *= 10000000;
    }
    filters.price = { $lte: price };
  }

  // Location
  const locationMatch = q.match(/in ([a-zA-Z\s]+)/);
  if (locationMatch) {
    const loc = locationMatch[1].trim();
    filters.$or = [
      { city: new RegExp(loc, 'i') },
      { locality: new RegExp(loc, 'i') },
      { state: new RegExp(loc, 'i') }
    ];
  }

  // Landmarks
  const nearMatch = q.match(/near ([a-zA-Z\s]+)/);
  if (nearMatch) {
    filters['landmarks.name'] = new RegExp(nearMatch[1].trim(), 'i');
  }

  // Fallback search
  if (Object.keys(filters).length <= 1) {
    filters.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { long_description: { $regex: query, $options: 'i' } },
      { city: { $regex: query, $options: 'i' } },
      { locality: { $regex: query, $options: 'i' } },
      { state: { $regex: query, $options: 'i' } }
    ];
  }

  const properties = await Property.find(filters)
    .select('title locality city state price images propertyType bhk furnishing reraApproved')
    .limit(5)
    .lean();

  res.json(properties);
}));

// ===== FILTER OPTIONS =====
router.get('/filters', asyncHandler(async (req, res) => {
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
}));

// ===== LOCALITIES FOR CITY =====
router.get('/localities/:city', asyncHandler(async (req, res) => {
  const { city } = req.params;
  const localities = await Property.distinct('locality', {
    city: { $regex: new RegExp(`^${city}$`, 'i') }
  });
  res.json({ localities });
}));

// ===== PROPERTY TYPES =====
router.get('/property-types', asyncHandler(async (req, res) => {
  const availablePropertyTypes = await Property.distinct('propertyType');
  const propertyTypeStructure = {
    Residential: ['Flats/Apartments','Villa','Plot'],
    Commercial: ['Shop/Showroom','Industrial Warehouse','Retail']
  };

  const filteredPropertyTypes = {};
  Object.keys(propertyTypeStructure).forEach(group => {
    const availableInGroup = propertyTypeStructure[group].filter(type => availablePropertyTypes.includes(type));
    if (availableInGroup.length > 0) {
      filteredPropertyTypes[group] = availableInGroup.map(type => ({ value: type, label: type }));
    }
  });

  const propertyTypeOptions = Object.keys(filteredPropertyTypes).map(group => ({
    label: group,
    options: filteredPropertyTypes[group]
  }));

  res.json({ propertyTypes: propertyTypeOptions, availablePropertyTypes });
}));

// ===== LOCALITIES BY TYPE =====
router.get('/localities-by-type', asyncHandler(async (req, res) => {
  const result = {};
  const types = ['Residential','Industrial','Commercial','Plot','Retail'];

  for (const type of types) {
    const localities = await Property.distinct('locality', { propertyType: type, status: 'approved' });
    result[type.toLowerCase()] = localities;
  }

  res.json(result);
}));

// ===== LOCALITIES GROUPED =====
router.get('/localities', asyncHandler(async (req, res) => {
  const localities = await Property.aggregate([
    { $group: { _id: { propertyType: '$propertyType', locality: '$locality' }, count: { $sum: 1 } } },
    { $project: { _id: 0, propertyType: '$_id.propertyType', name: '$_id.locality', count: 1 } },
    { $sort: { count: -1 } }
  ]);
  res.json(localities);
}));

// ===== FEATURED & RECENT PROPERTIES =====
router.get('/featured', asyncHandler(async (req, res) => {
  const featuredProperties = await Property.find({ featured: true });
  res.json(featuredProperties);
}));

router.get('/recent', asyncHandler(async (req, res) => {
  const recentProperties = await Property.find().sort({ createdAt: -1 }).limit(3);
  res.json(recentProperties);
}));

// ===== ALL APPROVED PROPERTIES =====
router.get('/', asyncHandler(async (req, res) => {
  const properties = await Property.find({ status: 'approved' }).populate('userId', 'displayName');
  res.json(properties);
}));

// ===== ADD PROPERTY =====
router.post('/add', protect, asyncHandler(async (req, res) => {
  const property = new Property({ ...req.body, userId: req.user._id, status: 'pending' });
  await property.save();
  res.status(201).json({ success: true, message: 'Property submitted for admin approval', property });
}));

// ===== MY PROPERTIES =====
router.get('/my-properties', protect, asyncHandler(async (req, res) => {
  const properties = await Property.find({ userId: req.user._id });
  res.json(properties);
}));

// ===== UPDATE PROPERTY =====
router.put('/update/:id', protect, asyncHandler(async (req, res) => {
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
}));

// ===== DELETE PROPERTY =====
router.delete('/delete/:id', protect, asyncHandler(async (req, res) => {
  const property = await Property.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.json({ message: 'Property deleted successfully' });
}));

// ===== GET SINGLE PROPERTY BY ID =====
router.get('/:id', asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  res.json(property);
}));

module.exports = router;
