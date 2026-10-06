// backend/fakeTests/propertyDeveloperAuth.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createAdminUser, createProperty, signToken } from "./helpers/fixtures.js";
import Property from "../models/Property.js";

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

// Clients must not be able to set server-managed fields (ownership, moderation,
// featured flag, analytics) — the edit form sends the whole saved property back.
describe("server-managed fields are ignored", () => {
  const TAMPERED = {
    status: "approved",
    featured: true,
    analytics: { viewCount: 9999 },
    rejectionReason: "forged",
  };

  it("update cannot reassign userId or change moderation/featured fields", async () => {
    const owner = await createUser();
    const other = await createUser();
    const property = await createProperty({ userId: owner._id });

    const res = await request(app)
      .put(`/api/properties/update/${property._id}`)
      .set("Authorization", `Bearer ${signToken(owner)}`)
      .send({ title: "Edited title", userId: other._id.toString(), ...TAMPERED });

    expect(res.status).toBe(200);
    const saved = await Property.findById(property._id).lean();
    expect(saved.title).toBe("Edited title");
    expect(saved.userId.toString()).toBe(owner._id.toString());
    expect(saved.status).toBe("pending");
    expect(saved.featured).toBe(false);
    expect(saved.analytics?.viewCount ?? 0).toBe(0);
    expect(saved.rejectionReason).toBeUndefined();
  });

  it("add ignores client-supplied userId, status and featured", async () => {
    const dev = await createUser();
    const other = await createUser();

    const res = await request(app)
      .post("/api/properties/add")
      .set("Authorization", `Bearer ${signToken(dev)}`)
      .send({
        developerName: "Dev Co",
        title: "New listing",
        description: "A test property description.",
        state: "Maharashtra",
        city: "Mumbai",
        locality: "Andheri",
        address: "123 Test Street",
        pincode: "400001",
        price: 5000000,
        propertyType: "Villa",
        userId: other._id.toString(),
        ...TAMPERED,
      });

    expect(res.status).toBe(201);
    const saved = await Property.findById(res.body.property._id).lean();
    expect(saved.userId.toString()).toBe(dev._id.toString());
    expect(saved.status).toBe("pending");
    expect(saved.featured).toBe(false);
    expect(saved.analytics?.viewCount ?? 0).toBe(0);
  });
});
