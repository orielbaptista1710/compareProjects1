//backend/controllers/geocodeController.js
//this is for CitySelction i believe
import asyncHandler from 'express-async-handler';

// ── In-memory cache (upgrade to Redis when you scale) ──────────────────────
const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Round coords to ~1km precision so nearby users share the same cache key
const roundCoord = (n) => parseFloat(parseFloat(n).toFixed(2));

const getCacheKey = (lat, lon) => `${roundCoord(lat)},${roundCoord(lon)}`;

// ── Simple in-process rate limiter (per-IP, 5 req/min) ─────────────────────
// Protects Nominatim from accidental hammering during dev/test
const rateLimiter = new Map();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_REQUESTS = 5;

const isRateLimited = (ip) => {
  const now = Date.now();
  const entry = rateLimiter.get(ip) ?? { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_MAX_REQUESTS) return true;

  entry.count++;
  rateLimiter.set(ip, entry);
  return false;
};

// ── Controller ──────────────────────────────────────────────────────────────
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;

  // Input validation
  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);

  if (isNaN(latN) || isNaN(lonN) ||
      latN < -90 || latN > 90 ||
      lonN < -180 || lonN > 180) {
    res.status(400);
    throw new Error('Invalid coordinates.');
  }

  // Rate limiting per IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.ip;
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    return;
  }

  // Cache check
  const cacheKey = getCacheKey(latN, lonN);
  if (geoCache.has(cacheKey)) {
    return res.json({ ...geoCache.get(cacheKey), source: 'cache' });
  }

  // Fetch from Nominatim
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latN}&lon=${lonN}&format=json&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      // Required by Nominatim's usage policy
      'User-Agent': `${process.env.APP_NAME ?? 'RealEstateApp'}/1.0 (${process.env.CONTACT_EMAIL ?? 'admin@example.com'})`,
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(6000), // 6s timeout
  });

  if (!response.ok) {
    res.status(502);
    throw new Error('Geocoding service unavailable.');
  }

  const data = await response.json();

  // Extract the most relevant city-level field
  const address = data.address ?? {};
  const city =
    address.city ||
    address.town ||
    address.county ||      // catches "North Goa", "South Goa"
    address.state_district ||
    address.village ||
    null;

  const result = { city, address };

  // Cache the result, evict after TTL
  geoCache.set(cacheKey, result);
  setTimeout(() => geoCache.delete(cacheKey), CACHE_TTL_MS);

  res.json({ ...result, source: 'nominatim' });
});