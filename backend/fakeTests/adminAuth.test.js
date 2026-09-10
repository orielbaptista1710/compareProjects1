// backend/fakeTests/adminAuth.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createAdminUser, createUser, signToken } from "./helpers/fixtures.js";
import User from "../models/User.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

// One GET and one PUT route, to confirm protect+isAdmin are wired on both,
// not just whichever route happened to get tested first.
const ROUTES = [
  { method: "get", url: "/api/admin/properties" },
  { method: "put", url: `/api/admin/approve/${new mongoose.Types.ObjectId()}` },
];

describe.each(ROUTES)("admin route auth - $method $url", ({ method, url }) => {
  it("401s with no token", async () => {
    const res = await request(app)[method](url);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("401s with a garbage/invalid token", async () => {
    const res = await request(app)[method](
      url)
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("401s with an expired token", async () => {
    const admin = await createAdminUser();
    const token = signToken(admin, { expiresIn: "-10s" });

    const res = await request(app)[method](
      url)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("403s for an authenticated non-admin user", async () => {
    const user = await createUser({ role: "user" });
    const token = signToken(user);

    const res = await request(app)[method](
      url)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });

  it("403s for a deactivated admin (protect's isActive check fires before isAdmin's role check)", async () => {
    const admin = await createAdminUser({ isActive: false });
    const token = signToken(admin);

    const res = await request(app)[method](
      url)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it("401s when the token references a user that no longer exists", async () => {
    const admin = await createAdminUser();
    const token = signToken(admin);
    await User.findByIdAndDelete(admin._id);

    const res = await request(app)[method](
      url)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
