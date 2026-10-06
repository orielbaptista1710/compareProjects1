// routes/discoverRoutes.js
import express from "express";
const router = express.Router();

import { getDiscover } from "../controllers/discoverController.js";
import { readLimiter } from "../middleware/rateLimiters.js";

/*
Endpoint:
GET /api/discover/localities

Used by footer to display locality links
*/
router.get("/localities", readLimiter, getDiscover);

export default router; 