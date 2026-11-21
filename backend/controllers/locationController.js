// backend/controllers/locationController.js
import { searchLocations } from "../services/locationSearchService.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";

export const getLocationSuggestions = async (req, res) => {
  try {
    // Express can hand us an array (?q=a&q=b); searchLocations treats anything
    // but a string as empty, and trims + caps the length itself.
    const results = await searchLocations(req.query.q);
    res.json({ results });
  } catch (err) {
    logger.error("Location search error", safeErrorMeta(err));
    res.status(500).json({ message: "Failed to fetch location suggestions" });
  }
};