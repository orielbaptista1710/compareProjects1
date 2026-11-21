// backend/routes/locationRoutes.js
import express from "express";
import { getLocationSuggestions } from "../controllers/locationController.js";
import { locationSuggestLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// Own limiter: the location box fires on every (debounced) keystroke, so it
// shouldn't share a budget with full property search.
router.get("/search", locationSuggestLimiter, getLocationSuggestions);

export default router;