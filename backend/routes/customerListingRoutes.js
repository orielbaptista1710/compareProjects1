// routes/customerListingRoutes.js
//
// Owner/agent listings, mounted at /api/customers/listings (server.js, only
// when ENABLE_CUSTOMER_LISTINGS=true). Same handlers as the developer routes in
// propertyRoutes.js — middleware/listingOwner.js is what makes the difference.
//
// Must stay under /api/customers/: the frontend's api.js only attaches the
// Firebase token to URLs outside /api/properties/, /api/auth/ and /api/admin/.
import express from 'express';
import protectCustomer from '../middleware/protectCustomer.js';
import { customerListingOwner, customerCanPost } from '../middleware/listingOwner.js';
import { customerActionLimiter, customerAddPropertyLimiter } from '../middleware/rateLimiters.js';
import {
  addProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';

const router = express.Router();

router.use(customerActionLimiter, protectCustomer, customerListingOwner);

router.get('/', getMyProperties);
router.post('/', customerAddPropertyLimiter, customerCanPost, addProperty);
router.put('/:id', customerCanPost, updateProperty);
router.delete('/:id', deleteProperty);

export default router;
