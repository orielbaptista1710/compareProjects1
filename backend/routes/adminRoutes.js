const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

// GET /api/admin/properties
router.get('/properties', protect, isAdmin, adminController.getProperties);

// PUT /api/admin/approve/:id
router.put('/approve/:id', protect, isAdmin, adminController.approveProperty);

// PUT /api/admin/reject/:id
router.put('/reject/:id', protect, isAdmin, adminController.rejectProperty);

module.exports = router;
