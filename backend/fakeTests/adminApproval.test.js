// backend/fakeTests/adminApproval.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose"; 
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createAdminUser, createUser, createProperty, signToken } from "./helpers/fixtures.js";
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
