const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const {searchProperties} = require('../controllers/searchController')
const {
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
} = require('../controllers/propertyController');

// routes
router.get('/search', searchProperties);
router.get('/filters', getFilterOptions);
router.get('/featured', getFeaturedProperties);
router.get('/localities-by-type', getPropertiesByType);
router.get('/recent', getRecentProperties);
router.get('/', getAllApprovedProperties);
router.post('/add', protect, addProperty);
router.get('/my-properties', protect, getMyProperties);
router.put('/update/:id', protect, updateProperty);
router.delete('/delete/:id', protect, deleteProperty);
router.get('/:id', getPropertyById);
router.get("/localities/:city", getLocalitiesByCity);


// ===== LOCALITIES FOR CITY =====
// router.get('/localities/:city', asyncHandler(async (req, res) => {
//   const { city } = req.params;
//   const localities = await Property.distinct('locality', {
//     city: { $regex: new RegExp(`^${city}$`, 'i') }
//   });
//   res.json({ localities });
// }));

// ===== PROPERTY TYPES =====
// router.get('/property-types', asyncHandler(async (req, res) => {
//   const availablePropertyTypes = await Property.distinct('propertyType');
//   const propertyTypeStructure = {
//     Residential: ['Flats/Apartments','Villa','Plot'],
//     Commercial: ['Shop/Showroom','Industrial Warehouse','Retail']
//   };

//   const filteredPropertyTypes = {};
//   Object.keys(propertyTypeStructure).forEach(group => {
//     const availableInGroup = propertyTypeStructure[group].filter(type => availablePropertyTypes.includes(type));
//     if (availableInGroup.length > 0) {
//       filteredPropertyTypes[group] = availableInGroup.map(type => ({ value: type, label: type }));
//     }
//   });

//   const propertyTypeOptions = Object.keys(filteredPropertyTypes).map(group => ({
//     label: group,
//     options: filteredPropertyTypes[group]
//   }));

//   res.json({ propertyTypes: propertyTypeOptions, availablePropertyTypes });
// }));

// ===== LOCALITIES BY TYPE =====
// router.get('/localities-by-type', asyncHandler(async (req, res) => {
//   const result = {};
//   const types = ['Residential','Industrial','Commercial','Plot','Retail'];

//   for (const type of types) {
//     const localities = await Property.distinct('locality', { propertyType: type, status: 'approved' });
//     result[type.toLowerCase()] = localities;
//   }

//   res.json(result);
// }));

// ===== LOCALITIES GROUPED =====
// router.get('/localities', asyncHandler(async (req, res) => {
//   const localities = await Property.aggregate([
//     { $group: { _id: { propertyType: '$propertyType', locality: '$locality' }, count: { $sum: 1 } } },
//     { $project: { _id: 0, propertyType: '$_id.propertyType', name: '$_id.locality', count: 1 } },
//     { $sort: { count: -1 } }
//   ]);
//   res.json(localities);
// }));



module.exports = router;
