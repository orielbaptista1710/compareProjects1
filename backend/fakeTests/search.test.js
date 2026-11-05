// backend/fakeTests/search.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createProperty } from "./helpers/fixtures.js";
import Property from "../models/Property.js";
import { searchProperties } from "../controllers/searchController.js";
import { buildSearchIntent, sanitiseQuery, searchCache } from "../services/searchService.js";
import errorHandler from "../middleware/errorMiddleware.js";

// Only the search handler is mounted — this endpoint is public, so the test
// app doesn't need (and doesn't load) any auth routes.
const app = express();
app.get("/api/properties/search", searchProperties);
app.use(errorHandler);

const search = (query, extra = "") =>
  request(app).get(`/api/properties/search?query=${encodeURIComponent(query)}${extra}`);

const ownerId = new mongoose.Types.ObjectId();
const listing = (overrides = {}) =>
  createProperty({ userId: ownerId, status: "approved", ...overrides });

beforeAll(async () => {
  await startTestDb();
  await Property.createIndexes(); // $text needs PropertyTextIndex to exist
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  searchCache.flushAll();
  await clearTestDb();
});

describe("GET /api/properties/search", () => {
  it("returns an empty result for missing, too-short or non-string queries", async () => {
    for (const path of ["", "?query=a", "?query[$ne]=x", "?query=a&query=b"]) {
      const res = await request(app).get(`/api/properties/search${path}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ properties: [], fuzzy: false });
    }
  });

  it("finds a listing by project name", async () => {
    await listing({ title: "Lodha Skyline Towers" });

    const res = await search("skyline");

    expect(res.body.fuzzy).toBe(false);
    expect(res.body.properties.map((p) => p.title)).toEqual(["Lodha Skyline Towers"]);
  });

  it("never returns pending, rejected or suspended listings", async () => {
    await listing({ title: "Hidden Orchid Pending", status: "pending" });
    await listing({ title: "Hidden Orchid Rejected", status: "rejected" });
    await listing({ title: "Hidden Orchid Suspended", status: "suspended" });

    for (const q of ["orchid", "orchd", "hidden"]) {
      const res = await search(q);
      expect(res.body.properties).toEqual([]);
    }
  });

  it("does not return arbitrary listings for a query that matches nothing", async () => {
    await listing({ title: "Prestige Lakeside" });

    const res = await search("xq");

    expect(res.body.properties).toEqual([]);
  });

  it("falls back to a fuzzy match for typos and flags it", async () => {
    await listing({ title: "Prestige Lakeside" });

    const res = await search("prestge");

    expect(res.body.fuzzy).toBe(true);
    expect(res.body.properties[0].title).toBe("Prestige Lakeside");
  });

  it("finds project names that contain digits", async () => {
    await listing({ title: "M3M Golf Estate" });

    const res = await search("m3m");

    expect(res.body.fuzzy).toBe(false);
    expect(res.body.properties.map((p) => p.title)).toEqual(["M3M Golf Estate"]);
  });

  it("keeps parsed filters on fuzzy matches", async () => {
    // Title is almost the query itself, so Fuse would match it if the
    // price filter weren't applied — the listing costs ₹2 crore.
    await listing({ title: "Prestige 2 BHK under 50 lakh", bhk: 2, price: 20_000_000 });

    const res = await search("prestge 2 bhk under 50 lakh");

    expect(res.body.properties).toEqual([]);
  });

  it("clamps limit to 1–10 and defaults to 5", async () => {
    for (let i = 0; i < 12; i++) {
      await listing({ title: `Godrej Meadows Wing ${i}` });
    }

    expect((await search("godrej", "&limit=50")).body.properties).toHaveLength(10);
    expect((await search("godrej", "&limit=abc")).body.properties).toHaveLength(5);
    expect((await search("godrej", "&limit=0")).body.properties).toHaveLength(1);
  });

  it("shows identical duplicate listings only once", async () => {
    for (let i = 0; i < 3; i++) {
      await listing({ title: "Hiranandani Gardens", locality: "Powai", price: 9000000 });
    }
    await listing({ title: "Hiranandani Gardens", locality: "Powai", price: 12000000 });

    const res = await search("hiranandani", "&limit=5");

    expect(res.body.properties).toHaveLength(2);
  });

  it("returns only card fields and at most one gallery image", async () => {
    await listing({
      title: "Kalpataru Vista",
      galleryImages: [{ url: "a.jpg" }, { url: "b.jpg" }, { url: "c.jpg" }],
    });

    const [result] = (await search("kalpataru")).body.properties;

    expect(result.galleryImages).toHaveLength(1);
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("address");
    expect(result).not.toHaveProperty("description");
  });

  it("filters by bhk and price when the query has no name words", async () => {
    await listing({ title: "Match", bhk: 2, price: 4_000_000 });
    await listing({ title: "Too Pricey", bhk: 2, price: 6_000_000 });
    await listing({ title: "Wrong Bhk", bhk: 3, price: 3_000_000 });

    const res = await search("2 bhk under 50 lakh");

    expect(res.body.properties.map((p) => p.title)).toEqual(["Match"]);
  });

  it("filters by property type and location", async () => {
    await listing({ title: "Pune Flat", city: "Pune", locality: "Baner", propertyType: "Flats/Apartments" });
    await listing({ title: "Pune Villa", city: "Pune", locality: "Baner", propertyType: "Villa" });
    await listing({ title: "Mumbai Flat", city: "Mumbai", propertyType: "Flats/Apartments" });

    const res = await search("flats in pune");

    expect(res.body.properties.map((p) => p.title)).toEqual(["Pune Flat"]);
  });

  it("serves repeat queries from cache until the cache is flushed", async () => {
    await listing({ title: "Oberoi Esquire" });
    await search("oberoi");

    await listing({ title: "Oberoi Splendor" });
    expect((await search("oberoi")).body.properties).toHaveLength(1);

    searchCache.flushAll();
    expect((await search("oberoi")).body.properties).toHaveLength(2);
  });
});

describe("buildSearchIntent", () => {
  it("parses prices with and without units", () => {
    expect(buildSearchIntent("under 50").filters.price).toEqual({ $lte: 5_000_000 });
    expect(buildSearchIntent("under 1.5 cr").filters.price).toEqual({ $lte: 15_000_000 });
    expect(buildSearchIntent("above 50 lakh under 1 crore").filters.price)
      .toEqual({ $gte: 5_000_000, $lte: 10_000_000 });
    expect(buildSearchIntent("between 50 and 80 lakh").filters.price)
      .toEqual({ $gte: 5_000_000, $lte: 8_000_000 });
    expect(buildSearchIntent("between 50 and 1 cr").filters.price)
      .toEqual({ $gte: 5_000_000, $lte: 10_000_000 });
  });

  it("doesn't read an area as a price", () => {
    expect(buildSearchIntent("above 500 sqft").filters.price).toBeUndefined();
    expect(buildSearchIntent("under 1000 sq ft").filters.price).toBeUndefined();
  });

  it("maps keywords to the stored property type and furnishing values", () => {
    expect(buildSearchIntent("3 bhk flats").filters.propertyType).toBe("Flats/Apartments");
    expect(buildSearchIntent("godown in bhiwandi").filters.propertyType).toBe("Industrial Warehouse/Godown");
    expect(buildSearchIntent("unfurnished villa").filters.furnishing).toEqual({ $in: ["Unfurnished"] });
    expect(buildSearchIntent("semi-furnished").filters.furnishing).toEqual({ $in: ["Semi Furnished"] });
  });

  it("only treats a standalone 'in' as a location marker", () => {
    expect(buildSearchIntent("mountain view").locationTerms).toEqual(["mountain"]);
    expect(buildSearchIntent("villa in goa under 2 cr").locationTerms).toEqual(["goa"]);
  });

  it("keeps filter words out of the text query", () => {
    expect(buildSearchIntent("2 bhk under 50 lakh").textQuery).toBe("");
    expect(buildSearchIntent("lodha flats in thane").textQuery).toBe("lodha thane");
  });
});

describe("sanitiseQuery", () => {
  it("strips symbols, $text negation and caps length", () => {
    expect(sanitiseQuery("flat -pune")).toBe("flat pune");
    expect(sanitiseQuery("semi-furnished")).toBe("semi-furnished");
    expect(sanitiseQuery('{"$gt":""}')).toBe("gt");
    expect(sanitiseQuery("x".repeat(500))).toHaveLength(100);
  });
});
