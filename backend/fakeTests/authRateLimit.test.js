// backend/fakeTests/authRateLimit.test.js 
//
// This checks that /api/auth/login is wired to the shared, test-safe
// authLimiter (backend/middleware/rateLimiters.js) rather than firing 11
// real login requests at it. authLimiter's `skip: () => IS_TEST` deliberately
// disables rate limiting during `npm test` — that's what keeps every other
// rate-limited route's tests in this repo from becoming flaky as more test
// cases get added, so this test proves the correct middleware is attached
// instead of fighting that skip.
//
// The actual "11th attempt gets 429" behavior is a manual check against a
// running dev/prod server (see the auth plan's manual checklist), where
// IS_TEST is naturally false and the limiter is live.
import { describe, it, expect } from "vitest";
import authRoutes from "../routes/authRoutes.js";
import { authLimiter } from "../middleware/rateLimiters.js";

function findRouteLayer(router, path, method) {
  return router.stack.find(
    (layer) => layer.route?.path === path && layer.route?.methods?.[method]
  );
}

describe("POST /api/auth/login rate limiting", () => {
  it("applies the shared authLimiter middleware to the login route", () => {
    const loginLayer = findRouteLayer(authRoutes, "/login", "post");
    expect(loginLayer).toBeTruthy();

    const middlewareHandles = loginLayer.route.stack.map((layer) => layer.handle);
    expect(middlewareHandles).toContain(authLimiter);
  });
});
