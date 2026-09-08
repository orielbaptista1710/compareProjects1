// backend/controllers/locationController.js
import { searchLocations } from "../services/locationSearchService.js";

export const getLocationSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const results = await searchLocations(q);
    res.json({ results });
  } catch (err) {
    console.error("Location search error:", err);
    res.status(500).json({ message: "Failed to fetch location suggestions" });
  }
};