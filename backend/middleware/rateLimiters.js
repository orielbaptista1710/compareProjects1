// middleware/rateLimiters.js
//
// Compatible with express-rate-limit v6 AND v7
//
// PROXY SETUP (required on Render / Railway / nginx):
//   Add this to your Express entry point BEFORE any routes:
//     app.set('trust proxy', 1);
//   Without it, req.ip returns the proxy IP, defeating per-user limiting.

import rateLimit from 'express-rate-limit';

const IS_TEST = process.env.NODE_ENV === 'test';

// ---------------------------------------------------------------------------
// Key generator
// ---------------------------------------------------------------------------
// express-rate-limit v7 removed ipKeyGenerator. We extract the real IP
// ourselves — handles X-Forwarded-For from Render/Railway/nginx correctly
// when `trust proxy` is set on the Express app.
// Falls back to req.socket.remoteAddress so it never throws.
const clientIp = (req) => {
  // When trust proxy is set, Express already normalises req.ip.
  // Prefer it; fall back to raw socket address.
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
};

// Shared handler options
const sharedOptions = {
  standardHeaders: 'draft-7', // RateLimit header (RFC draft 7)
  legacyHeaders: false,       // Disable X-RateLimit-* (deprecated)
  skip: () => IS_TEST,
  keyGenerator: clientIp,
};

// ---------------------------------------------------------------------------
// Search / autocomplete  —  30 req / 60 s
// ---------------------------------------------------------------------------
// Generous enough for real users (fast typers hit ~1 req/s at most),
// painful for bots or scrapers hammering the endpoint.
// Applied to: GET /api/properties/search, GET /api/properties/location-options
export const searchLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 30,
  message: { error: 'Too many search requests — please slow down.' },
});

// ---------------------------------------------------------------------------
// Property submission  —  10 req / 60 min
// ---------------------------------------------------------------------------
// Prevents spam/duplicate submissions from the same IP.
// Applied to: POST /api/properties/add
export const addPropertyLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60_000,
  max: 10, // addPropertyLimiter: max 10 submissions / hour per IP.
  message: { error: 'Too many property submissions — try again later.' },
});

// ---------------------------------------------------------------------------
// General public reads  —  120 req / 60 s
// ---------------------------------------------------------------------------
// Wide limit for listing / featured / recent endpoints.
// Applied to: GET /api/properties, GET /api/properties/featured, /recent
export const readLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 120,
  message: { error: 'Too many requests — please slow down.' },
});

// ---------------------------------------------------------------------------
// Auth endpoints  —  10 req / 15 min
// ---------------------------------------------------------------------------
// Hard cap for login / register / password-reset to limit credential stuffing.
// Applied to: POST /api/auth/login, /register, /reset-password
export const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60_000,
  max: 10,
  message: { error: 'Too many auth attempts — please wait before trying again.' },
});

// ---------------------------------------------------------------------------
// Geocode / reverse-geocode  —  20 req / 60 s
// ---------------------------------------------------------------------------
// Protects the Nominatim proxy endpoint from abuse.
// Applied to: GET /api/geocode/reverse
export const geocodeLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 20,
  message: { error: 'Too many geocode requests — please slow down.' },
}); 