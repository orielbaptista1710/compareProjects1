// routes/discoverRoutes.js
import express from "express";
const router = express.Router();

import { getDiscover } from "../controllers/discoverController.js";
import { readLimiter } from "../middleware/rateLimiters.js";

/*
Endpoint:
GET /api/discover/localities

Used by the footer's "Popular searches". Returns, per category
(residential/commercial/retail/industrial/plot), up to 20
{ label, params } links built from approved listings.
*/
router.get("/localities", readLimiter, getDiscover);

export default router; 