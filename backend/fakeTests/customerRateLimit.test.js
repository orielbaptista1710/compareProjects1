// backend/fakeTests/customerRateLimit.test.js
//
// Wiring tests only (same approach as authRateLimit.test.js) — checks the
// right middleware function is attached to each route rather than firing
// real requests, since the shared limiters' `skip: () => IS_TEST` disables
// rate limiting during `npm test`.
//
// Regression context: customerRoutes.js previously defined its own local,
// duplicate `authLimiter` (same name as the shared one in rateLimiters.js,
// but a distinct instance without the test-safe skip) for signup/login, and
// GET /me plus all of customerActivityRoutes.js had no rate limiting at all.
import { describe, it, expect, vi } from "vitest";

vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken: vi.fn() }) },
}));

const { default: customerRoutes } = await import("../routes/customerRoutes.js");
const { default: customerActivityRoutes } = await import("../routes/customerActivityRoutes.js");
const { authLimiter, customerActionLimiter } = await import("../middleware/rateLimiters.js");

function findRouteLayer(router, path, method) {
  return router.stack.find(
    (layer) => layer.route?.path === path && layer.route?.methods?.[method]
  );
}

function middlewareOf(layer) {
  return layer.route.stack.map((l) => l.handle);
}

describe("customer route rate limiting", () => {
  it("uses the shared authLimiter for signup and login, not a local duplicate", () => {
    const signupLayer = findRouteLayer(customerRoutes, "/firebase-signup", "post");
    const loginLayer = findRouteLayer(customerRoutes, "/firebase-login", "post");

    expect(signupLayer).toBeTruthy();
    expect(loginLayer).toBeTruthy();
    expect(middlewareOf(signupLayer)).toContain(authLimiter);
    expect(middlewareOf(loginLayer)).toContain(authLimiter);
  });

  it("applies customerActionLimiter to GET /me", () => {
    const meLayer = findRouteLayer(customerRoutes, "/me", "get");

    expect(meLayer).toBeTruthy();
    expect(middlewareOf(meLayer)).toContain(customerActionLimiter);
  });

  it("applies customerActionLimiter to the whole customerActivity router", () => {
    const useLayer = customerActivityRoutes.stack.find(
      (layer) => !layer.route && layer.handle === customerActionLimiter
    );

    expect(useLayer).toBeTruthy();
  });
});
