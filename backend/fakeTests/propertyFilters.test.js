// backend/fakeTests/propertyFilters.test.js
//
// Filter-panel endpoints: GET /api/properties/filters, GET /api/properties/localities/:city,
// plus the sortBy / areaUnit params of GET /api/properties. All public, so there is
// no 401/403 case; the cases here are caching, approved-only data and bad input.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createProperty } from "./helpers/fixtures.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  invalidatePropertyCaches();
  await clearTestDb();
});

describe("GET /api/properties/filters", () => {
  it("lists option values from approved properties only", async () => {
    await createProperty({ status: "approved", propertyType: "Villa", furnishing: "Furnished" });
    await createProperty({ status: "pending", propertyType: "Office Space", furnishing: "Semi Furnished" });

    const res = await request(app).get("/api/properties/filters");

    expect(res.status).toBe(200);
    expect(res.body.propertyTypeOptions).toEqual(["Villa"]);
    expect(res.body.furnishingOptions).toEqual(["Furnished"]);
    expect(res.body.areaBounds.sqft).toEqual({ min: 0, max: 10000 });
  });

  it("serves the cached options until the property caches are invalidated", async () => {
    await createProperty({ status: "approved", propertyType: "Villa" });
    await request(app).get("/api/properties/filters");

    await createProperty({ status: "approved", propertyType: "Plot" });
    const stale = await request(app).get("/api/properties/filters");
    expect(stale.body.propertyTypeOptions).toEqual(["Villa"]);

    // Approve/edit/delete paths call this, so real changes show up straight away.
    invalidatePropertyCaches();
    const fresh = await request(app).get("/api/properties/filters");
    expect(fresh.body.propertyTypeOptions).toEqual(["Plot", "Villa"]);
  });
});

describe("GET /api/properties/localities/:city", () => {
  it("returns sorted distinct approved localities, matching the city case-insensitively", async () => {
    await createProperty({ status: "approved", city: "Pune", locality: "Wakad" });
    await createProperty({ status: "approved", city: "Pune", locality: "Baner" });
    await createProperty({ status: "approved", city: "Pune", locality: "Baner" });
    await createProperty({ status: "pending",  city: "Pune", locality: "Hidden" });
    await createProperty({ status: "approved", city: "Mumbai", locality: "Andheri" });

    const res = await request(app).get("/api/properties/localities/pune");

    expect(res.status).toBe(200);
    expect(res.body.localities).toEqual(["Baner", "Wakad"]);
  });

  it("shares one cache entry between spellings and refreshes after invalidation", async () => {
    await createProperty({ status: "approved", city: "Pune", locality: "Baner" });
    await request(app).get("/api/properties/localities/Pune");

    await createProperty({ status: "approved", city: "Pune", locality: "Aundh" });
    const stale = await request(app).get("/api/properties/localities/PUNE");
    expect(stale.body.localities).toEqual(["Baner"]);

    invalidatePropertyCaches();
    const fresh = await request(app).get("/api/properties/localities/Pune");
    expect(fresh.body.localities).toEqual(["Aundh", "Baner"]);
  });

  it("does not cache an unknown city as a failure and returns an empty list", async () => {
    const res = await request(app).get("/api/properties/localities/Atlantis");
    expect(res.status).toBe(200);
    expect(res.body.localities).toEqual([]);
  });

  it("rejects a one-character or over-long city with 400", async () => {
    expect((await request(app).get("/api/properties/localities/x")).status).toBe(400);
    expect((await request(app).get(`/api/properties/localities/${"a".repeat(101)}`)).status).toBe(400);
  });
});

describe("GET /api/properties — sortBy and areaUnit validation", () => {
  it.each(["constructor", "__proto__", "toString", "hasOwnProperty", "nonsense"])(
    "falls back to relevance (200) for sortBy=%s",
    async (sortBy) => {
      await createProperty({ status: "approved" });

      const res = await request(app).get("/api/properties").query({ sortBy });

      expect(res.status).toBe(200);
      expect(res.body.totalProperties).toBe(1);
    }
  );

  it("still honours a real sort key", async () => {
    await createProperty({ status: "approved", title: "Cheap", price: 1_000_000 });
    await createProperty({ status: "approved", title: "Dear",  price: 9_000_000 });

    const res = await request(app).get("/api/properties").query({ sortBy: "price-high-low" });

    expect(res.body.data.map((p) => p.title)).toEqual(["Dear", "Cheap"]);
  });

  it("applies a known areaUnit together with the area range", async () => {
    await createProperty({ status: "approved", title: "Sqft", area: { value: 1000, unit: "sqft" } });
    await createProperty({ status: "approved", title: "Sqm",  area: { value: 1000, unit: "sqmts" } });

    const res = await request(app).get("/api/properties").query({ areaMin: 500, areaMax: 2000, areaUnit: "sqft" });

    expect(res.body.data.map((p) => p.title)).toEqual(["Sqft"]);
  });

  it("ignores an unknown areaUnit instead of filtering on it", async () => {
    await createProperty({ status: "approved", title: "Sqft", area: { value: 1000, unit: "sqft" } });
    await createProperty({ status: "approved", title: "Sqm",  area: { value: 1000, unit: "sqmts" } });

    const res = await request(app).get("/api/properties").query({ areaMin: 500, areaMax: 2000, areaUnit: "bogus" });

    expect(res.status).toBe(200);
    expect(res.body.totalProperties).toBe(2);
  });

  it("ignores a repeated areaUnit param (array) without erroring", async () => {
    await createProperty({ status: "approved", area: { value: 1000, unit: "sqft" } });

    const res = await request(app).get("/api/properties?areaMin=500&areaUnit=sqft&areaUnit=sqmts");

    expect(res.status).toBe(200);
    expect(res.body.totalProperties).toBe(1);
  });
});
