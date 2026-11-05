// backend/fakeTests/adminApproval.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose"; 
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createAdminUser, createUser, createProperty, createCustomer, signToken } from "./helpers/fixtures.js";
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

async function adminToken() {
  const admin = await createAdminUser();
  return signToken(admin);
}

describe("admin approval workflow - correctness", () => {

  describe("single approve/reject", () => {
    it("approves a pending property and stamps reviewedBy/reviewedAt", async () => {
      const token = await adminToken();
      const property = await createProperty({ status: "pending" });

      const res = await request(app)
        .put(`/api/admin/approve/${property._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.property.status).toBe("approved");
      expect(res.body.property.reviewedBy).toBeTruthy();
      expect(res.body.property.reviewedAt).toBeTruthy();
    });

    it("trims and caps rejectionReason at 500 chars", async () => {
      const token = await adminToken();
      const property = await createProperty({ status: "pending" });
      const longReason = "x".repeat(600);

      const res = await request(app)
        .put(`/api/admin/reject/${property._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rejectionReason: `  ${longReason}  ` });

      expect(res.status).toBe(200);
      expect(res.body.property.status).toBe("rejected");
      expect(res.body.property.rejectionReason).toHaveLength(500);
      expect(res.body.property.rejectionReason.startsWith(" ")).toBe(false);
    });

    it("defaults rejectionReason to 'No reason provided' when omitted", async () => {
      const token = await adminToken();
      const property = await createProperty({ status: "pending" });

      const res = await request(app)
        .put(`/api/admin/reject/${property._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.property.rejectionReason).toBe("No reason provided");
    });
  });

  describe("id validation (400 vs 404, not 500)", () => {
    const routes = [
      { method: "get", urlFor: (id) => `/api/admin/property/${id}` },
      { method: "put", urlFor: (id) => `/api/admin/approve/${id}` },
      { method: "put", urlFor: (id) => `/api/admin/reject/${id}` },
    ];

    it.each(routes)(
      "$method $urlFor -> 400 for a malformed id, 404 for a well-formed missing id",
      async ({ method, urlFor }) => {
        const token = await adminToken();

        const malformed = await request(app)[method](
          urlFor("not-an-object-id"))
          .set("Authorization", `Bearer ${token}`);
        expect(malformed.status).toBe(400);
        expect(malformed.body.success).toBe(false);

        const missingId = new mongoose.Types.ObjectId();
        const missing = await request(app)[method](
          urlFor(missingId.toString()))
          .set("Authorization", `Bearer ${token}`);
        expect(missing.status).toBe(404);
        expect(missing.body.success).toBe(false);
      }
    );
  });

  describe("bulk approve/reject", () => {
    it("matched counts only ids that actually exist; malformed/duplicate/nonexistent ids are silently dropped, not 500s", async () => {
      const token = await adminToken();
      const propA = await createProperty({ status: "pending" });
      const propB = await createProperty({ status: "pending" });
      const nonexistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put("/api/admin/bulk-approve")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ids: [
            propA._id.toString(),
            propB._id.toString(),
            propA._id.toString(), // duplicate
            nonexistentId.toString(), // well-formed but missing
            "not-an-object-id", // malformed
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(2);
      expect(res.body.modified).toBe(2);

      const updatedA = await Property.findById(propA._id);
      expect(updatedA.status).toBe("approved");
    });

    it("applies a shared rejectionReason (trimmed) to every matched doc", async () => {
      const token = await adminToken();
      const propA = await createProperty({ status: "pending" });
      const propB = await createProperty({ status: "pending" });

      const res = await request(app)
        .put("/api/admin/bulk-reject")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ids: [propA._id.toString(), propB._id.toString()],
          rejectionReason: "  Incomplete listing  ",
        });

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(2);
      expect(res.body.modified).toBe(2);

      const updatedA = await Property.findById(propA._id);
      const updatedB = await Property.findById(propB._id);
      expect(updatedA.status).toBe("rejected");
      expect(updatedA.rejectionReason).toBe("Incomplete listing");
      expect(updatedB.rejectionReason).toBe("Incomplete listing");
    });

    it("returns 400 for an empty ids array", async () => {
      const token = await adminToken();

      const res = await request(app)
        .put("/api/admin/bulk-approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids: [] });

      expect(res.status).toBe(400);
    });

    it("caps processing at 100 ids even when more are sent", async () => {
      const token = await adminToken();
      const owner = await createUser();
      const properties = [];
      for (let i = 0; i < 105; i++) {
        properties.push(await createProperty({ status: "pending", userId: owner._id }));
      }
      const ids = properties.map((p) => p._id.toString());

      const res = await request(app)
        .put("/api/admin/bulk-approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids });

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(100);
      expect(res.body.modified).toBe(100);
    }, 20000);
  });

  describe("self-review guard (an admin cannot approve/reject their own submitted property)", () => {
    it("403s when approving a property the admin submitted themselves, and leaves it unchanged", async () => {
      const admin = await createAdminUser();
      const token = signToken(admin);
      const own = await createProperty({ status: "pending", userId: admin._id });

      const res = await request(app)
        .put(`/api/admin/approve/${own._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      const unchanged = await Property.findById(own._id);
      expect(unchanged.status).toBe("pending");
    });

    it("403s when rejecting a property the admin submitted themselves", async () => {
      const admin = await createAdminUser();
      const token = signToken(admin);
      const own = await createProperty({ status: "pending", userId: admin._id });

      const res = await request(app)
        .put(`/api/admin/reject/${own._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rejectionReason: "test" });

      expect(res.status).toBe(403);
    });

    it("still allows approving someone else's property normally", async () => {
      const admin = await createAdminUser();
      const token = signToken(admin);
      const someoneElses = await createProperty({ status: "pending" });

      const res = await request(app)
        .put(`/api/admin/approve/${someoneElses._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("bulk-approve silently excludes the admin's own submission from the batch, same as malformed/nonexistent ids", async () => {
      const admin = await createAdminUser();
      const token = signToken(admin);
      const ownProperty = await createProperty({ status: "pending", userId: admin._id });
      const othersProperty = await createProperty({ status: "pending" });

      const res = await request(app)
        .put("/api/admin/bulk-approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids: [ownProperty._id.toString(), othersProperty._id.toString()] });

      expect(res.status).toBe(200);
      expect(res.body.matched).toBe(1);
      expect(res.body.modified).toBe(1);

      const own = await Property.findById(ownProperty._id);
      const others = await Property.findById(othersProperty._id);
      expect(own.status).toBe("pending");
      expect(others.status).toBe("approved");
    });
  });

  describe("regex-escaping on search and locality filters", () => {
    it("treats `search` as a literal string, not a live regex", async () => {
      const token = await adminToken();
      await createProperty({ title: "Sunshine Residency" });
      await createProperty({ title: "Sun.*Shine Towers" });

      const res = await request(app)
        .get("/api/admin/properties")
        .query({ search: ".*" })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.map((p) => p.title);
      expect(titles).toEqual(["Sun.*Shine Towers"]);
    });

    it("treats locality `q` as a literal string, not a live regex", async () => {
      const token = await adminToken();
      await createProperty({ city: "Mumbai", locality: "Andheri West" });
      await createProperty({ city: "Mumbai", locality: "Test.*Locality" });

      const res = await request(app)
        .get("/api/admin/localities")
        .query({ city: "Mumbai", q: ".*" })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(["Test.*Locality"]);
    });
  });
});

describe("admin approval workflow - audit trail", () => {
  it("appends every decision to reviewHistory", async () => {
    const token = await adminToken();
    const property = await createProperty({ status: "pending" });

    await request(app)
      .put(`/api/admin/reject/${property._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rejectionReason: "Blurry photos" });
    await request(app)
      .put(`/api/admin/approve/${property._id}`)
      .set("Authorization", `Bearer ${token}`);

    const saved = await Property.findById(property._id).lean();
    expect(saved.reviewHistory.map((h) => h.action)).toEqual(["rejected", "approved"]);
    expect(saved.reviewHistory[0].reason).toBe("Blurry photos");
    expect(saved.reviewHistory[1].by).toBeTruthy();
    expect(saved.reviewHistory[1].at).toBeTruthy();
  });

  it("records bulk decisions in reviewHistory too", async () => {
    const token = await adminToken();
    const property = await createProperty({ status: "pending" });

    const res = await request(app)
      .put("/api/admin/bulk-approve")
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [String(property._id)] });

    expect(res.status).toBe(200);
    const saved = await Property.findById(property._id).lean();
    expect(saved.reviewHistory).toHaveLength(1);
    expect(saved.reviewHistory[0].action).toBe("approved");
  });

  it("falls back to a default reason when rejectionReason isn't a string (no 500)", async () => {
    const token = await adminToken();
    const property = await createProperty({ status: "pending" });

    const res = await request(app)
      .put(`/api/admin/reject/${property._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rejectionReason: { $gt: "" } });

    expect(res.status).toBe(200);
    expect(res.body.property.rejectionReason).toBe("No reason provided");
  });
});

describe("admin listing table - who posted it", () => {
  it("shows the customer as poster for owner listings and filters by listedBy", async () => {
    const token = await adminToken();
    const customer = await createCustomer({ customerName: "Asha Owner" });
    await createProperty({ userId: customer._id, ownerModel: "Customer", listedBy: "owner", developerName: undefined });
    await createProperty({ listedBy: "developer" });

    const res = await request(app)
      .get("/api/admin/properties?listedBy=owner")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].listedBy).toBe("owner");
    expect(res.body.data[0].userId.customerName).toBe("Asha Owner");
  });

  it("still populates developer listings saved before ownerModel existed", async () => {
    const token = await adminToken();
    const developer = await createUser({ displayName: "Old Dev" });
    const property = await createProperty({ userId: developer._id });
    await Property.collection.updateOne({ _id: property._id }, { $unset: { ownerModel: "" } });

    const res = await request(app).get("/api/admin/properties").set("Authorization", `Bearer ${token}`);

    expect(res.body.data[0].userId.displayName).toBe("Old Dev");
  });

  it("'Builder' (listedBy=developer) also finds developer listings saved before listedBy existed", async () => {
    const token = await adminToken();
    const developer = await createUser();
    const labelled = await createProperty({ userId: developer._id, listedBy: "developer", title: "Labelled" });
    const legacy = await createProperty({ userId: developer._id, title: "Legacy" });
    await Property.collection.updateOne({ _id: legacy._id }, { $unset: { listedBy: "", ownerModel: "" } });
    const customer = await createCustomer();
    await createProperty({ userId: customer._id, ownerModel: "Customer", listedBy: "owner", developerName: undefined });

    const res = await request(app)
      .get("/api/admin/properties?listedBy=developer&status=")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => String(p._id)).sort()).toEqual([String(labelled._id), String(legacy._id)].sort());
  });

  it("rejects an unknown listedBy filter (400)", async () => {
    const token = await adminToken();

    const res = await request(app)
      .get("/api/admin/properties?listedBy=broker")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/property/:id — who posted it", () => {
  it("includes how to reach and verify an agent poster, without auth internals", async () => {
    const token = await adminToken();
    const agent = await createCustomer({
      customerName: "Ravi Agent",
      customerPhone: "+919800000009",
      emailVerified: true,
      agent: { status: "approved", agencyName: "Prime Realty", reraAgentId: "A51800012345" },
    });
    const property = await createProperty({
      userId: agent._id, ownerModel: "Customer", listedBy: "agent", developerName: undefined,
    });

    const res = await request(app).get(`/api/admin/property/${property._id}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toMatchObject({
      customerName: "Ravi Agent",
      customerPhone: "+919800000009",
      emailVerified: true,
      agent: { status: "approved", agencyName: "Prime Realty", reraAgentId: "A51800012345" },
    });
    expect(res.body.data.userId).not.toHaveProperty("firebaseUid");
  });
});
