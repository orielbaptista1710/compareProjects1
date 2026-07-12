//backend/routes/geocodeRoutes.js
import express from 'express';
import { reverseGeocode } from '../controllers/geocodeController.js';

const router = express.Router();
router.get('/reverse', reverseGeocode);

export default router;