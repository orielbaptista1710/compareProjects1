//routes/adminRoutes.js
import express from 'express';
const router = express.Router(); 

import protect from '../middleware/protect.js';
import isAdmin from '../middleware/isAdmin.js';
import { adminActionLimiter } from '../middleware/rateLimiters.js';
import * as adminController from '../controllers/adminController.js';

router.use(adminActionLimiter);

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

// PUT /api/admin/bulk-approve, /bulk-reject - checkbox bulk actions in AdminDashboard
router.put('/bulk-approve', protect, isAdmin, adminController.bulkApproveProperties);
router.put('/bulk-reject', protect, isAdmin, adminController.bulkRejectProperties);

export default router;
