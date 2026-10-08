# backend/CLAUDE.md

Rules for writing backend code. These are durable rules. Current open findings live in `../PRODUCTION_READINESS_AUDIT.md`; don't copy them here. Auth/data-store architecture is in the root `CLAUDE.md`.

## Security

- **No mass assignment.** Never pass `req.body` straight into `Object.assign`, `Model.create`, `findByIdAndUpdate`, or Prisma `create`/`update`. Build the object from a whitelist of fields. Server-managed fields (`userId`, `status`, `featured`, `views`, `reviewedBy`, timestamps) are set only by server code, never from the client.
- **Sanitize free text before persisting** anything shown to other users (titles, descriptions, amenities, reasons), using `sanitizeObject` from `utils/sanitizeInput.js`. Validate IDs with `mongoose.isValidObjectId` and never pass raw request objects into Mongo query filters (NoSQL operator injection).
- **Every route gets a rate limiter** from `middleware/rateLimiters.js` (`publicLimiter`, `readLimiter`, `searchLimiter`, `authLimiter`, `loginUsernameLimiter`, `customerAuthLimiter`, `developerActionLimiter`, `adminActionLimiter`, `customerActionLimiter`, …). If none fits, add a new one to that file. Never define a limiter locally in a route or controller.
- **Client IP = `req.ip`** (`trust proxy` is set in `server.js`). Never key anything on the raw `x-forwarded-for` header; clients can spoof it.
- **Auth middleware must match the user type:** `protect` (+ `isAdmin`/`isDeveloper`) → `req.user`; `protectCustomer` → `req.customer`. Nothing from either goes under `/api/crm/*`.
- The developer/admin cookie is `SameSite=None`, so new state-changing (POST/PUT/PATCH/DELETE) cookie-auth routes must stay JSON-only and must not loosen CORS. Keep CSRF in mind.
- **Errors:** `next(err)` into `middleware/errorMiddleware.js`. Never return `err.message` or stack traces to the client for 500s. Send a generic message and log the details.
- **Logging:** use `utils/logger.js` only; no `console.log` in app code. Never log `req.body`, passwords, tokens, cookies, or contact details (phone/email). Log caught errors as `logger.error('…', safeErrorMeta(err))` from `utils/safeError.js`, never the raw `err`: duplicate-key and validation errors carry the customer's email/phone in their message and stack.
- **Secrets:** config comes from `process.env` only. No hard-coded credentials, and no `|| 'fallback-secret'` defaults outside tests.
- Don't mount `routes/mediaUpload.js` (or any upload route) without `protect` + a limiter + file type/size limits.

## Performance

- **Every read is bounded:** `.lean()`, a field projection, `.limit()`, and `page`/`limit` clamped server-side. No unbounded `find({})` or `distinct()` on public routes.
- **No new unanchored `$regex`** on hot paths (it forces a collection scan). Anchor with `^` like `searchService.js` does for city/locality/state; its title match is a deliberate, known exception. Search-affecting changes go through `buildSearchIntent`/`sanitiseQuery` in `services/searchService.js`.
- **Cache read-heavy, slow-changing data** with `withCache` from `utils/withCache.js` (filters, localities, reference data). Any write that changes property visibility or data must call `invalidatePropertyCaches()` from `utils/propertyCache.js`.
- Public listings/filters/localities return only `status: 'approved'` properties.
- No heavy synchronous CPU work inside a request (large Fuse scoring, big in-JS sorts or dedupes over full collections). Push the work into the query or cap the input.
- New query patterns on large collections need a matching index in the Mongoose model.

## Scalability (Phase 0/1)

- **Keep the web process stateless.** No unbounded in-memory `Map`/object caches, no per-key `setTimeout`, no `setInterval`/cron jobs, no writes to local disk (Render disks are ephemeral and not shared).
- **One path for caching, one for limiting:** all caching via `withCache` and all limiters in `rateLimiters.js`. When the backend moves to 2+ instances (Phase 2), switching to Redis should touch only those two files plus `REDIS_URL`. Don't add Redis before then.
- Slow outbound calls (GNews, geocoding, email/SMS) get a timeout, and their results are cached.

## Tests

- Every new or changed endpoint gets a test in `fakeTests/` (use `fakeTests/helpers/testApp.js`). Cover the unauthorized (401/403) case as well as the happy path.
- `npm run lint && npm test` must pass before committing.
