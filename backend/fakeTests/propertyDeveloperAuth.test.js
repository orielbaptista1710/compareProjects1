// backend/fakeTests/propertyDeveloperAuth.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createAdminUser, signToken } from "./helpers/fixtures.js";

beforeAll(async () => {
  await startTestDb();
}); 

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

// Developer-only self-service routes — admins review listings via /api/admin/*,
// they don't submit their own, so an admin token should never pass isDeveloper.
const ROUTES = [
  { method: "post", url: "/api/properties/add" },
  { method: "get", url: "/api/properties/my-properties" },
  { method: "put", url: () => `/api/properties/update/${new mongoose.Types.ObjectId()}` },
  { method: "delete", url: () => `/api/properties/delete/${new mongoose.Types.ObjectId()}` },
];

describe.each(ROUTES)("developer-only route - $method $url", ({ method, url }) => {
  const resolvedUrl = typeof url === "function" ? url : () => url;

  it("403s for a valid admin token", async () => {
    const admin = await createAdminUser();
    const token = signToken(admin);

    const res = await request(app)[method](resolvedUrl()).set(
      "Authorization",
      `Bearer ${token}`
    );

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Developer access required");
  });

  it("is not blocked by isDeveloper for a user-role token", async () => {
    const user = await createUser();
    const token = signToken(user);

    const res = await request(app)[method](resolvedUrl()).set(
      "Authorization",
      `Bearer ${token}`
    );

    expect(res.status).not.toBe(403);
  });
});
