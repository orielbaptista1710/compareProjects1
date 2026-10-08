// middleware/rateLimiters.js
//
// Compatible with express-rate-limit v6 AND v7
//
// PROXY SETUP (required on Render / Railway / nginx):
//   Add this to your Express entry point BEFORE any routes:
//     app.set('trust proxy', 1);
//   Without it, req.ip returns the proxy IP, defeating per-user limiting.

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const IS_TEST = process.env.NODE_ENV === 'test';

// ---------------------------------------------------------------------------
// Key generator
// ---------------------------------------------------------------------------
// req.ip handles X-Forwarded-For from Render/Railway/nginx correctly when
// `trust proxy` is set on the Express app; falls back to the raw socket
// address so it never throws.
//
// ipKeyGenerator (express-rate-limit v8) leaves IPv4 untouched but groups an
// IPv6 address by its /56 network. One phone or home line owns a whole IPv6
// block, so keying on the full address let it dodge every limit by rotating
// addresses — common on Jio and other Indian IPv6 networks.
export const clientIp = (req) => {
  const ip = req.ip ?? req.socket?.remoteAddress;
  return ip ? ipKeyGenerator(ip) : 'unknown';
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
// Public detail / metadata reads  —  300 req / 60 s
// ---------------------------------------------------------------------------
// Separate counter from readLimiter and deliberately loose: one property page
// fires several of these, and many Indian mobile users share a carrier IP.
// This is an anti-flood backstop, not a scraping defense.
// Applied to: /api/properties/filters, /localities-by-type, /localities/:city,
//             /related/:id, /:id, /api/news/real-estate, /api/auth/me, /logout
export const publicLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 300,
  message: { error: 'Too many requests — please slow down.' },
});

// ---------------------------------------------------------------------------
// Developer dashboard actions (list / update / delete own)  —  60 req / 60 s
// ---------------------------------------------------------------------------
// Already auth-gated (protect + isDeveloper); backstop like adminActionLimiter.
// Applied to: /api/properties/my-properties, /update/:id, /delete/:id
export const developerActionLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 60,
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
// Developer/admin login  —  5 failed req / 15 min per username
// ---------------------------------------------------------------------------
// authLimiter is per IP, so an attacker rotating IPs could keep guessing one
// account's password. This caps failures per username however many IPs are
// used. skipSuccessfulRequests: a correct login doesn't use up the quota.
// Trade-off: anyone who knows a username can lock it out for 15 minutes.
// Requests without a string username are skipped; the controller 400s them.
// Applied to: POST /api/auth/login
export const loginUsernameKey = (req) => {
  const username = req.body?.username;
  return typeof username === 'string' && username.trim()
    ? `login-user:${username.trim().toLowerCase().slice(0, 50)}`
    : null;
};

// Exported so a test can build the limiter without the test-mode skip.
export const LOGIN_USERNAME_LIMIT = {
  windowMs: 15 * 60_000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: loginUsernameKey,
  message: { error: 'Too many failed logins for this account — please wait 15 minutes.' },
};

export const loginUsernameLimiter = rateLimit({
  ...sharedOptions,
  ...LOGIN_USERNAME_LIMIT,
  skip: (req) => IS_TEST || !loginUsernameKey(req),
});

// ---------------------------------------------------------------------------
// Customer auth sync (Firebase signup / login)  —  30 req / 15 min
// ---------------------------------------------------------------------------
// Separate counter from authLimiter so customers sharing a carrier IP can't lock
// developers out (or vice versa). Looser because Firebase has already checked
// the password — these routes only accept a valid Firebase ID token.
// Applied to: POST /api/customers/firebase-signup, /firebase-login
export const customerAuthLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60_000,
  max: 30,
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

// ---------------------------------------------------------------------------
// Public lead forms  —  30 req / 60 min per IP
// ---------------------------------------------------------------------------
// A real visitor sends one or two enquiries; the headroom is for many Indian
// mobile users sharing one carrier IP.
// Applied to: POST /api/leads/customer, /api/leads/developer
export const leadLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60_000,
  max: 30,
  message: { success: false, message: 'Too many enquiries — please try again later.' },
});

// ---------------------------------------------------------------------------
// Public lead forms  —  10 accepted req / 24 h per phone number
// ---------------------------------------------------------------------------
// Caps one number however many IPs or emails a spammer rotates through, and
// stops someone flooding a stranger's phone with sales calls. Requests without
// a phone are skipped here; the validator rejects them anyway.
// skipFailedRequests: rejected requests (4xx/5xx) don't count, so nobody can
// burn a stranger's quota with junk submissions using their number. 10, not 5,
// so a real buyer can enquire on several properties in a day.
// Applied to: POST /api/leads/customer, /api/leads/developer
export const leadPhoneKey = (req) => {
  const phone = req.body?.customerPhone ?? req.body?.developerPhone;
  const digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  return digits ? `lead-phone:${digits}` : null;
};

// Exported so a test can build the limiter without the test-mode skip.
export const LEAD_PHONE_LIMIT = {
  windowMs: 24 * 60 * 60_000,
  max: 10,
  skipFailedRequests: true,
  keyGenerator: leadPhoneKey,
  message: { success: false, message: 'Too many enquiries for this number — please try again tomorrow.' },
};

export const leadPhoneLimiter = rateLimit({
  ...sharedOptions,
  ...LEAD_PHONE_LIMIT,
  skip: (req) => IS_TEST || !leadPhoneKey(req),
});

// ---------------------------------------------------------------------------
// Admin actions (list / approve / reject / bulk)  —  60 req / 60 s
// ---------------------------------------------------------------------------
// Admin routes are already auth-gated (protect + isAdmin), so this is a
// backstop against a buggy client loop or a compromised admin token rather
// than a primary defense.
// Applied to: all of /api/admin/*
export const adminActionLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many admin requests — please slow down.' },
});

// ---------------------------------------------------------------------------
// Customer account actions (me / heart / compare)  —  60 req / 60 s
// ---------------------------------------------------------------------------
// These routes are already auth-gated (protectCustomer), so — like
// adminActionLimiter — this is a backstop against a buggy client loop or a
// leaked/stolen customer token rather than a primary defense.
// Applied to: GET /api/customers/me, all of /api/customerActivity/*
export const customerActionLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many requests — please slow down.' },
});