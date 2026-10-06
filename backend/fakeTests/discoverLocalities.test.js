// backend/fakeTests/discoverLocalities.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createAdminUser, createUser, createProperty, signToken } from "./helpers/fixtures.js";
import { clearCache } from "../utils/withCache.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  // The footer response is cached in process memory; reset it so tests stay independent.
  clearCache();
  await clearTestDb();
  vi.restoreAllMocks();
});

const getFooter = () => request(app).get("/api/discover/localities");

describe("GET /api/discover/localities (footer)", () => {
  it("lists only approved properties' localities, never pending or rejected ones", async () => {
    const developer = await createUser();
    await createProperty({ userId: developer._id, status: "approved", locality: "Andheri" });
    await createProperty({ userId: developer._id, status: "pending", locality: "Secret Pending Area" });
    await createProperty({ userId: developer._id, status: "rejected", locality: "Rejected Area" });

    const res = await getFooter();

    expect(res.status).toBe(200);
    const all = Object.values(res.body.data).flat();
    expect(all).toContain("Andheri");
    expect(all).not.toContain("Secret Pending Area");
    expect(all).not.toContain("Rejected Area");
  });

  it("groups by category, de-duplicates and sorts localities", async () => {
    const developer = await createUser();
    await createProperty({ userId: developer._id, status: "approved", locality: "Powai", propertyType: "Villa" });
    await createProperty({ userId: developer._id, status: "approved", locality: "Andheri", propertyType: "Villa" });
    await createProperty({ userId: developer._id, status: "approved", locality: "Andheri", propertyType: "Villa" });
    await createProperty({ userId: developer._id, status: "approved", locality: "BKC", propertyType: "Office Space" });
    await createProperty({ userId: developer._id, status: "approved", locality: "Bhiwandi", propertyType: "Plot" });

    const { body } = await getFooter();

    expect(body.data.residential).toEqual(["Andheri", "Powai"]);
    expect(body.data.commercial).toEqual(["BKC"]);
    expect(body.data.plot).toEqual(["Bhiwandi"]);
  });

  it("returns exactly the five footer categories (no empty 'popular' key)", async () => {
    const { body } = await getFooter();

    expect(Object.keys(body.data).sort()).toEqual(
      ["commercial", "industrial", "plot", "residential", "retail"]
    );
  });

  it("lists a locality once even when many listings share it (same type or same category)", async () => {
    const developer = await createUser();
    await createProperty({ userId: developer._id, status: "approved", locality: "Baner", propertyType: "Villa" });
    await createProperty({ userId: developer._id, status: "approved", locality: "Baner", propertyType: "Villa" });
    await createProperty({ userId: developer._id, status: "approved", locality: "Baner", propertyType: "Flats/Apartments" });

    const { body } = await getFooter();

    expect(body.data.residential).toEqual(["Baner"]);
  });

  it("serves repeat requests from the 5-minute cache instead of re-querying", async () => {
    const developer = await createUser();
    await createProperty({ userId: developer._id, status: "approved", locality: "Andheri" });
    await getFooter();

    // Written straight to the DB, bypassing approve/edit, so nothing clears the cache.
    await createProperty({ userId: developer._id, status: "approved", locality: "Powai" });

    const cached = await getFooter();
    expect(cached.body.data.residential).toEqual(["Andheri"]);

    invalidatePropertyCaches();

    const fresh = await getFooter();
    expect(fresh.body.data.residential).toEqual(["Andheri", "Powai"]);
  });

  it("shows a newly approved property immediately (approving clears the cache)", async () => {
    const admin = await createAdminUser();
    const developer = await createUser();
    const pending = await createProperty({ userId: developer._id, status: "pending", locality: "Baner" });

    const before = await getFooter();
    expect(Object.values(before.body.data).flat()).not.toContain("Baner");

    const approve = await request(app)
      .put(`/api/admin/approve/${pending._id}`)
      .set("Authorization", `Bearer ${signToken(admin)}`);
    expect(approve.status).toBe(200);

    const after = await getFooter();
    expect(after.body.data.residential).toContain("Baner");
  });

  it("drops a deleted property immediately (developer delete clears the cache)", async () => {
    const developer = await createUser();
    const property = await createProperty({ userId: developer._id, status: "approved", locality: "Wakad" });

    const before = await getFooter();
    expect(before.body.data.residential).toContain("Wakad");

    const del = await request(app)
      .delete(`/api/properties/delete/${property._id}`)
      .set("Authorization", `Bearer ${signToken(developer)}`);
    expect(del.status).toBe(200);

    const after = await getFooter();
    expect(after.body.data.residential).not.toContain("Wakad");
  });

  it("does not log the response payload", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await createProperty({ status: "approved" });

    await getFooter();

    expect(logSpy).not.toHaveBeenCalled();
  });
});
