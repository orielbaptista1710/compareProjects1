// routes/propertyRoutes.js
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
  getLocalitiesByCity,
  getLocationOptions
} = require('../controllers/propertyController');

// routes
router.get('/search', searchProperties); //used in ExpandableSeachBar - check if can be usd in AdminDashboard CHECK THIS 
router.get('/filters', getFilterOptions);  // used in the FilterPanel
router.get('/featured', getFeaturedProperties);  // used in the FeaturedProperties on HomePage
router.get('/localities-by-type', getPropertiesByType);  //i want to use it in the footer but idk if i should i have to decide on seo n links for the footer
router.get('/recent', getRecentProperties); // used in top projects on HomePage

router.get("/localities/:city", getLocalitiesByCity);//i think its used in the Footer im not sure-- CHECK THIS
router.get("/location-options", getLocationOptions); //to be used for location seach for MainSeachBar

//used in the Developer dashboard to get all the properties CRUD  by the developer
router.get('/', getAllApprovedProperties);//use for optional listing in the Properties Page 
router.post('/add', protect, addProperty);
router.get('/my-properties', protect, getMyProperties);
router.put('/update/:id', protect, updateProperty);
router.delete('/delete/:id', protect, deleteProperty);
router.get('/:id', getPropertyById);

module.exports = router;
