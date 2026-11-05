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
import { describe, it, expect, vi } from "vitest";

// customerListingRoutes → protectCustomer → firebaseAdmin, which needs real
// credentials; these tests only inspect route wiring.
vi.mock("../config/firebaseAdmin.js", () => ({ default: { auth: () => ({}) } }));

import authRoutes from "../routes/authRoutes.js";
import passwordResetRequestRoutes from "../routes/passwordResetRequestRoutes.js";
import customerListingRoutes from "../routes/customerListingRoutes.js";
import {
  authLimiter,
  passwordResetRequestLimiter,
  addPropertyLimiter,
  customerAddPropertyLimiter,
} from "../middleware/rateLimiters.js";

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

  it("gives forgot-password requests their own limiter, so they can't use up the login quota", () => {
    const layer = findRouteLayer(passwordResetRequestRoutes, "/", "post");
    const middlewareHandles = layer.route.stack.map((l) => l.handle);

    expect(middlewareHandles).toContain(passwordResetRequestLimiter);
    expect(middlewareHandles).not.toContain(authLimiter);
  });

  it("limits owner/agent posting per account, not per shared IP", () => {
    const layer = findRouteLayer(customerListingRoutes, "/", "post");
    const middlewareHandles = layer.route.stack.map((l) => l.handle);

    expect(middlewareHandles).toContain(customerAddPropertyLimiter);
    expect(middlewareHandles).not.toContain(addPropertyLimiter);
  });
});
