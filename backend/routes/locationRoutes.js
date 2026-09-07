// backend/routes/locationRoutes.js
import express from "express";
import { getLocationSuggestions } from "../controllers/locationController.js";
import { searchLimiter } from "../middleware/rateLimiters.js"; // CHECK THIS ENSURE ITS CONNECTED 

const router = express.Router();

router.get("/search", searchLimiter, getLocationSuggestions);

export default router;