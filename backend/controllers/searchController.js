// backend/controllers/searchController.js
//
// Thin HTTP adapter — all search logic lives in searchService.js.
// This file only handles: request parsing, response shaping, error handling.
// When you migrate to Atlas Search, this file is UNCHANGED.

import asyncHandler from 'express-async-handler';
import { runSearch, sanitiseQuery } from '../services/searchService.js';

const searchProperties = asyncHandler(async (req, res) => {
  const raw = req.query.query ?? '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 10); // clamp 1–10

  const query = sanitiseQuery(raw);

  if (query.length < 2) {
    return res.json({ properties: [], fuzzy: false });
  }

  const result = await runSearch(query, limit);
  return res.json(result);
});

export { searchProperties };