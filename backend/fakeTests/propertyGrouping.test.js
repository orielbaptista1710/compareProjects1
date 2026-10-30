// backend/fakeTests/propertyGrouping.test.js
//
// GET /api/properties groups BHK variants of the same project onto one card
// (projectKey). The critical invariant: totalProperties (the Properties page
// header count) must always equal the number of matching Property documents,
// completely independent of how many cards those documents get grouped into.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createProperty, createUser } from "./helpers/fixtures.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";
import Property from "../models/Property.js";

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

// Same developer + project + locality on every call => same projectKey.
const KALPATARU = {
  status: "approved",
  developerName: "Kalpataru",
  projectName: "Vian",
  city: "Mumbai",
  locality: "Lokhandwala",
};

describe("GET /api/properties — BHK-variant grouping", () => {
  it("groups same-project BHK variants into one card with all units", async () => {
    await createProperty({ ...KALPATARU, title: "3 BHK in Kalpataru Vian", bhk: 3, price: 50_500_000, area: { value: 1116, unit: "sqft" } });
    await createProperty({ ...KALPATARU, title: "3 BHK Large in Kalpataru Vian", bhk: 3, price: 59_100_000, area: { value: 1292, unit: "sqft" } });
    await createProperty({ ...KALPATARU, title: "4 BHK in Kalpataru Vian", bhk: 4, price: 96_300_000, area: { value: 2127, unit: "sqft" } });

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalProjects).toBe(1);
    expect(res.body.totalProperties).toBe(3);

    const [project] = res.body.data;
    expect(project.units).toHaveLength(3);
    expect(project.bhkList).toEqual([3, 4]);
    expect(project.minPrice).toBe(50_500_000);
    expect(project.maxPrice).toBe(96_300_000);
    // Cheapest unit first (frontend defaults to it).
    expect(project.units[0].price).toBe(50_500_000);
  });

  it("keeps listings without a projectName as their own single-unit card", async () => {
    await createProperty({ status: "approved", title: "Standalone Villa", bhk: 3 });
    await createProperty({ status: "approved", title: "Another Standalone", bhk: 2 });

    const res = await request(app).get("/api/properties");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalProjects).toBe(2);
    expect(res.body.totalProperties).toBe(2);
    res.body.data.forEach((project) => expect(project.units).toHaveLength(1));
  });

  it("does not group a resale listing even if it matches a project's developer/name/locality", async () => {
    await createProperty({ ...KALPATARU, title: "3 BHK sale", bhk: 3, listingType: "sale" });
    await createProperty({ ...KALPATARU, title: "3 BHK resale", bhk: 3, listingType: "resale" });

    const res = await request(app).get("/api/properties");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalProjects).toBe(2);
    expect(res.body.totalProperties).toBe(2);
    res.body.data.forEach((project) => expect(project.units).toHaveLength(1));
  });

  it("does not group plots/commercial listings (bhk 0) even with a matching projectKey", async () => {
    await createProperty({ ...KALPATARU, title: "Plot A", bhk: 0, propertyType: "Plot" });
    await createProperty({ ...KALPATARU, title: "Plot B", bhk: 0, propertyType: "Plot" });

    const res = await request(app).get("/api/properties");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalProjects).toBe(2);
    expect(res.body.totalProperties).toBe(2);
  });

  it("totalProperties matches countDocuments and is unchanged by grouping, with no filters applied", async () => {
    // One 3-unit project + two standalone singles = 5 documents, 3 cards.
    await createProperty({ ...KALPATARU, bhk: 1, price: 30_000_000 });
    await createProperty({ ...KALPATARU, bhk: 2, price: 45_000_000 });
    await createProperty({ ...KALPATARU, bhk: 3, price: 60_000_000 });
    await createProperty({ status: "approved", title: "Single A" });
    await createProperty({ status: "approved", title: "Single B" });

    const expectedDocCount = await Property.countDocuments({ status: "approved" });
    const res = await request(app).get("/api/properties");

    expect(expectedDocCount).toBe(5);
    expect(res.body.totalProperties).toBe(5);
    expect(res.body.totalProjects).toBe(3);
  });

  it("BHK filters narrow units[] inside a project without dropping the card, and both counts reflect the filter", async () => {
    await createProperty({ ...KALPATARU, bhk: 1, price: 30_000_000 });
    await createProperty({ ...KALPATARU, bhk: 2, price: 45_000_000 });
    await createProperty({ ...KALPATARU, bhk: 3, price: 60_000_000 });

    const expectedFilteredDocCount = await Property.countDocuments({ status: "approved", bhk: { $in: [2] } });
    const res = await request(app).get("/api/properties?bhk=2");

    expect(expectedFilteredDocCount).toBe(1);
    expect(res.body.totalProperties).toBe(1); // only the bhk=2 unit matches
    expect(res.body.totalProjects).toBe(1);   // the project card itself is still returned
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].units).toHaveLength(1);
    expect(res.body.data[0].units[0].bhk).toBe(2);
  });

  it("totalProperties for a filtered query still equals countDocuments(query), independent of grouping", async () => {
    await createProperty({ ...KALPATARU, bhk: 2, price: 45_000_000 });
    await createProperty({ ...KALPATARU, bhk: 3, price: 60_000_000 });
    await createProperty({ status: "approved", title: "Single", bhk: 2, price: 40_000_000 });

    const query = { status: "approved", bhk: { $in: [2] } };
    const expectedCount = await Property.countDocuments(query);
    const res = await request(app).get("/api/properties?bhk=2");

    expect(expectedCount).toBe(2); // the grouped bhk=2 unit + the standalone bhk=2 listing
    expect(res.body.totalProperties).toBe(2);
    expect(res.body.totalProjects).toBe(2); // one project card (1 matching unit) + one single card
  });
});

// Bulk scraper imports stamp a whole batch with one createdAt, and many
// projects share a price. Without a unique tiebreaker each page request may
// order tied projects differently, so $skip/$limit repeats some and skips others.
describe("GET /api/properties — stable pagination when sort values tie", () => {
  const SAME_TIME = new Date("2026-01-01T00:00:00Z");

  // n standalone listings with identical price and createdAt; returns their ids
  // oldest-inserted first (ObjectIds grow with insertion).
  const createTiedListings = async (n) => {
    const userId = (await createUser())._id; // one owner: creating a user per listing is slow
    const ids = [];
    for (let i = 0; i < n; i++) {
      const p = await createProperty({ userId, status: "approved", price: 10_000_000 });
      ids.push(p._id.toString());
    }
    // Bypass Mongoose timestamps, as insertMany batches effectively do.
    await Property.collection.updateMany({}, { $set: { createdAt: SAME_TIME } });
    return ids;
  };

  const fetchAllPages = async (sortBy, pageSize, totalPages) => {
    const seen = [];
    for (let page = 1; page <= totalPages; page++) {
      const res = await request(app).get(`/api/properties?sortBy=${sortBy}&page=${page}&limit=${pageSize}`);
      expect(res.status).toBe(200);
      seen.push(...res.body.data.map((card) => card._id));
    }
    return seen;
  };

  it.each(["relevance", "newest", "oldest", "price-low-high", "price-high-low"])(
    "%s: every project appears on exactly one page, in a fixed order",
    async (sortBy) => {
      const ids = await createTiedListings(12);
      // Ties are broken by newest unit first, except "oldest", which reverses it.
      const expected = sortBy === "oldest" ? ids : [...ids].reverse();

      const firstPass = await fetchAllPages(sortBy, 2, 6);
      expect(firstPass).toEqual(expected);
      // Same request again → same order (no reshuffling between requests).
      expect(await fetchAllPages(sortBy, 2, 6)).toEqual(firstPass);
    },
    30_000
  );

  it("a project card always takes its details from the same unit when unit prices tie", async () => {
    const first = await createProperty({ ...KALPATARU, title: "Vian Tower A 2 BHK", bhk: 2, price: 20_000_000 });
    await createProperty({ ...KALPATARU, title: "Vian Tower B 2 BHK", bhk: 2, price: 20_000_000 });

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/api/properties");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe(first.slug);
      expect(res.body.data[0]).not.toHaveProperty("lastId");
    }
  }, 30_000);
});
