// backend/fakeTests/customerProfileFields.test.js
//
// Regression tests for two frontend bugs found in a senior audit of
// CustomerProfilePage: ProfileTab's "Member Since" always rendered "—"
// because GET /me never returned createdAt, and the "Verified Account"
// badge was hardcoded/unconditional because there was no emailVerified
// field at all. Both are now wired through signup/login/me.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock("../config/firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken }),
  },
}));

const { default: app } = await import("./helpers/customerRoutesApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer } = await import("./helpers/fixtures.js");

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
});

function tokenFor(uid, claims = {}) {
  verifyIdToken.mockImplementation(async (t) => {
    if (t !== `token-for-${uid}`) throw new Error("bad token");
    return { uid, ...claims };
  });
  return `token-for-${uid}`;
}

describe("GET /api/customers/me", () => {
  it("returns createdAt and emailVerified alongside the existing fields", async () => {
    const customer = await createCustomer({ emailVerified: true });
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .get("/api/customers/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.customer.emailVerified).toBe(true);
    expect(res.body.customer.createdAt).toBeTruthy();
    expect(new Date(res.body.customer.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("defaults emailVerified to false for a customer created without it", async () => {
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .get("/api/customers/me") 
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.customer.emailVerified).toBe(false);
  });

  it("syncs emailVerified to true when the Firebase token says so, without requiring a fresh login", async () => {
    // Regression test: clicking the link in the verification email updates
    // Firebase immediately, but Mongo previously only learned about it on the
    // next explicit login. protectCustomer.js now syncs it on any request.
    const customer = await createCustomer({ emailVerified: false });
    const verifiedToken = tokenFor(customer.firebaseUid, { email_verified: true });

    const firstRes = await request(app)
      .get("/api/customers/me")
      .set("Authorization", `Bearer ${verifiedToken}`);

    expect(firstRes.body.customer.emailVerified).toBe(true);

    // Second request uses a token that no longer asserts email_verified, to
    // prove the true value was actually persisted to Mongo (not just held on
    // the in-memory doc from the first request's middleware run).
    const staleClaimToken = tokenFor(customer.firebaseUid);

    const secondRes = await request(app)
      .get("/api/customers/me")
      .set("Authorization", `Bearer ${staleClaimToken}`);

    expect(secondRes.body.customer.emailVerified).toBe(true);
  });
});

describe("POST /api/customers/firebase-signup", () => {
  it("stores emailVerified from the Firebase token", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "new-uid-1",
      email: "verified@example.com",
      email_verified: true,
    });

    const res = await request(app)
      .post("/api/customers/firebase-signup")
      .send({ token: "whatever", customerName: "Verified User" });

    expect(res.status).toBe(200);
    expect(res.body.customer.emailVerified).toBe(true);
  });

  it("defaults to unverified when the token doesn't report email_verified", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "new-uid-2",
      email: "unverified@example.com",
    });

    const res = await request(app)
      .post("/api/customers/firebase-signup")
      .send({ token: "whatever", customerName: "Unverified User" });

    expect(res.status).toBe(200);
    expect(res.body.customer.emailVerified).toBe(false);
  });
});

describe("POST /api/customers/firebase-login", () => {
  it("refreshes emailVerified on an existing customer instead of only setting it at creation", async () => {
    // Regression test: the original $setOnInsert-only update meant a customer
    // who verified their email *after* signing up would never see that
    // reflected, since login only touches fields on first-ever creation.
    const customer = await createCustomer({ emailVerified: false });
    const token = tokenFor(customer.firebaseUid, { email_verified: true });

    const res = await request(app)
      .post("/api/customers/firebase-login")
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.customer.emailVerified).toBe(true);
  });
});
