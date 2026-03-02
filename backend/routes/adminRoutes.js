//routes/adminRoutes.js
import express from 'express';
const router = express.Router();

import protect from '../middleware/protect.js';
import isAdmin from '../middleware/isAdmin.js';
import * as adminController from '../controllers/adminController.js';


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

export default router;
