// middleware/originCheck.js
// CSRF defence (docs/review SEC-06). The auth cookie is SameSite=None in
// production, so browsers attach it to cross-site requests. Browsers always
// send an Origin header on cross-site POST/PUT/PATCH/DELETE, so any
// state-changing request whose Origin isn't on the CORS allowlist is refused.
// Requests with no Origin header (curl, Postman, server-to-server, uptime
// monitors) aren't browser CSRF and are allowed through.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const originCheck = (allowedOrigins) => (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin || allowedOrigins.includes(origin)) return next();

  return res.status(403).json({ success: false, message: 'Request blocked: unknown origin.' });
};

export default originCheck;
 