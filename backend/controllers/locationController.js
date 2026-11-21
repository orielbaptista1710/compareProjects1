// backend/controllers/locationController.js
import { searchLocations } from "../services/locationSearchService.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";

const MAX_QUERY_LENGTH = 100;

export const getLocationSuggestions = async (req, res) => {
  try {
    // Express can hand us an array (?q=a&q=b); only plain text is a valid query.
    // Capped at 100 chars, matching sanitiseQuery in searchService.js.
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, MAX_QUERY_LENGTH) : "";
    const results = await searchLocations(q);
    res.json({ results });
  } catch (err) {
    logger.error("Location search error", safeErrorMeta(err));
    res.status(500).json({ message: "Failed to fetch location suggestions" });
  }
};