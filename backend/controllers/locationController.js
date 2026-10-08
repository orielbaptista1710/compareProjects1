// backend/controllers/locationController.js
import { searchLocations } from "../services/locationSearchService.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";

export const getLocationSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const results = await searchLocations(q);
    res.json({ results });
  } catch (err) {
    logger.error("Location search error", safeErrorMeta(err));
    res.status(500).json({ message: "Failed to fetch location suggestions" });
  }
};