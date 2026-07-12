// backend/controllers/searchController.js
//
// Thin HTTP adapter — all search logic lives in searchService.js.
// This file only handles: request parsing, response shaping, error handling.
// When you migrate to Atlas Search, this file is UNCHANGED.


//need to test this for production
import asyncHandler from 'express-async-handler';
import { runSearch, sanitiseQuery } from '../services/searchService.js';
 
const searchProperties = asyncHandler(async (req, res) => {
  // ── Input validation ──────────────────────────────────────────────────────
  const raw = typeof req.query.query === 'string' ? req.query.query : '';

  // Clamp limit: minimum 1, maximum 10, default 5.
  // parseInt on a non-numeric string returns NaN, so we guard with || 5.
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 10)
    : 5;

  // ── Sanitise ──────────────────────────────────────────────────────────────
  const query = sanitiseQuery(raw);

  if (query.length < 2) {
    return res.status(200).json({ properties: [], fuzzy: false });
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const result = await runSearch(query, limit);

  // ── Response ──────────────────────────────────────────────────────────────
  // Explicit shape keeps the contract stable even if searchService changes internals.
  return res.status(200).json({
    properties: result.properties,
    fuzzy: result.fuzzy,
  });
});

export { searchProperties };