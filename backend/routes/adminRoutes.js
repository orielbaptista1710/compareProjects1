//routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const protect = require('../middleware/protect');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');


// GET /api/admin/properties
router.get('/properties', protect, isAdmin, adminController.getProperties);    //used in AdminDasboard.js

router.get("/cities", protect, isAdmin, adminController.getCities);            //used in AdminDasboard.js
router.get("/localities", protect, isAdmin, adminController.getLocalities);    //used in AdminDasboard.js

// GET full property details by ID
router.get('/property/:id', protect, isAdmin, adminController.getDeveloperDetails); //used in AdminDasboard.js

// PUT /api/admin/approve/:id
router.put('/approve/:id', protect, isAdmin, adminController.approveProperty);    //used in AdminDasboard.js

// PUT /api/admin/reject/:id
router.put('/reject/:id', protect, isAdmin, adminController.rejectProperty);   //used in AdminDasboard.js   

module.exports = router;
