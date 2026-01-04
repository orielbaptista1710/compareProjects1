const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

// GET /api/admin/properties
router.get('/properties', protect, isAdmin, adminController.getProperties);

router.get("/cities", protect, isAdmin, adminController.getCities);
router.get("/localities", protect, isAdmin, adminController.getLocalities);

// GET full property details by ID
router.get('/property/:id', protect, isAdmin, adminController.getDeveloperDetails);

// PUT /api/admin/approve/:id
router.put('/approve/:id', protect, isAdmin, adminController.approveProperty);

// PUT /api/admin/reject/:id
router.put('/reject/:id', protect, isAdmin, adminController.rejectProperty);

module.exports = router;
