// backend/fakeTests/propertyProjectUnits.test.js
//
// GET /api/properties/project-units/:id — sibling units of the same project
// (matched by projectKey), powering the "other configurations" switcher on
// the property detail page.
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

describe("GET /api/properties/project-units/:id", () => {
  it("400s on an invalid id", async () => {
    const res = await request(app).get("/api/properties/project-units/not-an-id");
    expect(res.status).toBe(400);
  });

  it("404s when the property doesn't exist or isn't approved", async () => {
    const pending = await createProperty({ status: "pending" });
    const res = await request(app).get(`/api/properties/project-units/${pending._id}`);
    expect(res.status).toBe(404);
  });

  it("returns an empty array when the property has no projectKey", async () => {
    const solo = await createProperty({ status: "approved", projectName: undefined, projectKey: undefined });
    const res = await request(app).get(`/api/properties/project-units/${solo._id}`);

    expect(res.status).toBe(200);
    expect(res.body.units).toEqual([]);
  });

  it("returns every approved unit sharing the projectKey, including itself, sorted cheapest-first", async () => {
    const shared = {
      status: "approved",
      developerName: "Kalpataru",
      projectName: "Vian",
      city: "Mumbai",
      locality: "Lokhandwala",
    };
    const cheap = await createProperty({ ...shared, bhk: 3, price: 50_500_000, area: { value: 1116, unit: "sqft" } });
    const mid = await createProperty({ ...shared, bhk: 3, price: 59_100_000, area: { value: 1292, unit: "sqft" } });
    const expensive = await createProperty({ ...shared, bhk: 4, price: 96_300_000, area: { value: 2127, unit: "sqft" } });
    // A pending unit in the same project must not leak into the public list.
    await createProperty({ ...shared, status: "pending", bhk: 2, price: 40_000_000 });
    // An unrelated project must not show up either.
    await createProperty({ status: "approved", developerName: "Lodha", projectName: "Altus", locality: "Borivali", bhk: 2, price: 30_000_000 });

    const res = await request(app).get(`/api/properties/project-units/${mid._id}`);

    expect(res.status).toBe(200);
    expect(res.body.units).toHaveLength(3);
    expect(res.body.units.map((u) => u._id.toString())).toEqual(
      [cheap._id, mid._id, expensive._id].map((id) => id.toString())
    );
    // Only the fields the switcher needs — no owner/developer/contact fields.
    expect(Object.keys(res.body.units[0]).sort()).toEqual(["_id", "area", "bhk", "price", "slug"].sort());
  });
});
