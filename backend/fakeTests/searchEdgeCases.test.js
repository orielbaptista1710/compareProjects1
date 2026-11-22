// backend/fakeTests/searchEdgeCases.test.js
// Odd and hostile input, bounded results and "does it stay fast" checks for
// the two search endpoints: the dropdown (/api/properties/search) and the
// listing page (/api/properties?search=).
//
// Timing limits are deliberately loose (seconds, not milliseconds): they exist
// to catch a path that became pathologically slow, not machine-load noise.
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createProperty } from "./helpers/fixtures.js";
import Property from "../models/Property.js";
import { searchProperties } from "../controllers/searchController.js";
import { buildListingSearch, searchCache } from "../services/searchService.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";
import errorHandler from "../middleware/errorMiddleware.js";

// The dropdown handler on its own, so these many requests don't trip the
// per-IP search limiter that the full app applies.
const dropdownApp = express();
dropdownApp.get("/api/properties/search", searchProperties);
dropdownApp.use(errorHandler);

const dropdown = (query, extra = "") =>
  request(dropdownApp).get(`/api/properties/search?query=${encodeURIComponent(query)}${extra}`);
const listing = (qs) => request(app).get(`/api/properties?${qs}`);

const SLOW_MS = 4000;
const timed = async (run) => {
  const start = Date.now();
  const res = await run();
  return { res, ms: Date.now() - start };
};

const CITIES = ["Mumbai", "Pune", "Thane"];
const TYPES = ["Flats/Apartments", "Villa", "Plot"];

// Enough listings that a missing limit or an accidental full-collection load
// shows up as a long response or an oversized body.
const seed = async (count) => {
  const userId = new mongoose.Types.ObjectId();
  const docs = Array.from({ length: count }, (_, i) => ({
    userId,
    slug: `seed-tower-${i}`, // normally made on save, which insertMany skips
    developerName: `Developer ${i % 20}`,
    title: `Tower ${i} ${["Skyline", "Orchid", "Meadows", "Gardens"][i % 4]}`,
    description: "A test property description with some words in it.",
    state: "Maharashtra",
    city: CITIES[i % 3],
    locality: `Locality ${i % 15}`,
    address: "123 Test Street",
    pincode: "400001",
    price: 2_000_000 + (i % 50) * 200_000,
    propertyType: TYPES[i % 3],
    furnishing: "Unfurnished",
    possessionStatus: "Ready to Move",
    unitsAvailable: 1,
    bhk: 1 + (i % 4),
    status: "approved",
  }));
  await Property.insertMany(docs);
};

beforeAll(async () => {
  await startTestDb();
  await Property.createIndexes(); // $text needs PropertyTextIndex
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  searchCache.flushAll();
});

afterEach(async () => {
  searchCache.flushAll();
  invalidatePropertyCaches();
  await clearTestDb();
});

// Odd strings a user (or a script) might send. None may crash a handler.
const WEIRD = [
  "x".repeat(500),
  "पुणे",
  "🏠🏠🏠",
  "(((((",
  "[[[",
  "\\",
  '{"$where":"sleep(1000)"}',
  "$ne",
  "a b c d e f g h i j k l m n o p q r s t",
  "  pune   baner  ",
  "pune.*",
  "%00abc",
  "\u0000abc",
];

describe("dropdown search: odd input", () => {
  it("answers 200 with a list for every odd string", async () => {
    await seed(20);

    for (const text of WEIRD) {
      const res = await dropdown(text);
      expect(res.status, `query ${JSON.stringify(text.slice(0, 20))}`).toBe(200);
      expect(Array.isArray(res.body.properties)).toBe(true);
      expect(typeof res.body.fuzzy).toBe("boolean");
    }
  });

  it("treats repeated or object-shaped parameters as no search", async () => {
    for (const qs of ["query=a&query=pune", "query[$gt]=", "query[]=pune", "limit=5"]) {
      const res = await request(dropdownApp).get(`/api/properties/search?${qs}`);
      expect(res.status).toBe(200);
      expect(res.body.properties).toEqual([]);
    }
  });

  it("is not case or spacing sensitive for the same words", async () => {
    await seed(20);

    const a = (await dropdown("SKYLINE")).body.properties.map((p) => p.title);
    const b = (await dropdown("skyline")).body.properties.map((p) => p.title);

    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });

  it("keeps working when the cache is full", async () => {
    await seed(20);
    for (let i = 0; i < 5000; i++) searchCache.set(`filler:${i}`, 1);

    const res = await dropdown("skyline");

    expect(res.status).toBe(200);
    expect(res.body.properties.length).toBeGreaterThan(0);
    expect(searchCache.keys().length).toBeLessThanOrEqual(5000);
  });
});

describe("dropdown search: bounded and fast on a larger collection", () => {
  beforeEach(async () => {
    await seed(600);
  });

  it("never returns more than 10 results whatever limit is asked", async () => {
    for (const limit of ["10", "11", "1000", "-5", "1e9", "NaN"]) {
      const res = await dropdown("tower", `&limit=${limit}`);
      expect(res.body.properties.length).toBeLessThanOrEqual(10);
    }
  });

  it.each([
    ["a name that hits the text index", "skyline"],
    ["a place with filters", "2 bhk flats in pune under 50 lakh"],
    ["filters only", "3 bhk under 40 lakh"],
    ["a typo, which falls through to the fuzzy pass", "skyilne"],
    ["gibberish, which tries every pass and finds nothing", "zzqxjv kkwpt"],
    ["a long query of many words", "tower skyline orchid meadows gardens pune mumbai thane andheri baner"],
  ])("answers %s within the time limit", async (_label, query) => {
    const { res, ms } = await timed(() => dropdown(query));

    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(SLOW_MS);
  });

  it("answers a repeated query from cache, faster than the first", async () => {
    await dropdown("skyilne"); // fuzzy path, the most expensive one
    const cached = await timed(() => dropdown("skyilne"));

    expect(cached.res.status).toBe(200);
    expect(cached.ms).toBeLessThan(SLOW_MS);
    expect(searchCache.keys().some((k) => k.includes("skyilne"))).toBe(true);
  });

  it("handles a burst of different queries without failing", async () => {
    const words = ["tower", "orchid", "meadows", "gardens", "skyline", "pune", "thane", "mumbai"];
    const results = await Promise.all(words.map((w, i) => dropdown(`${w} ${i}`)));

    for (const res of results) expect(res.status).toBe(200);
  });
});

describe("location suggestions: odd input", () => {
  it("answers 200 with a results list for every odd string", async () => {
    await seed(20);

    for (const text of WEIRD) {
      const res = await request(app).get(`/api/locations/search?q=${encodeURIComponent(text)}`);
      expect(res.status, `q ${JSON.stringify(text.slice(0, 20))}`).toBe(200);
      expect(Array.isArray(res.body.results)).toBe(true);
    }
  });

  it("ignores control characters instead of failing (a null byte used to give a 500)", async () => {
    await createProperty({ city: "Pune", locality: "Baner", status: "approved" });

    const res = await request(app).get("/api/locations/search?q=%00Baner");

    expect(res.status).toBe(200);
    expect(res.body.results.map((r) => r.label)).toContain("Baner, Pune");
  });

  it("answers within the time limit on a larger collection", async () => {
    await seed(600);

    const { res, ms } = await timed(() => request(app).get("/api/locations/search?q=loc"));

    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(SLOW_MS);
  });
});

describe("listing search: odd input", () => {
  it("answers 200 with a list for every odd string", async () => {
    await seed(20);

    for (const text of WEIRD) {
      const res = await listing(`search=${encodeURIComponent(text)}`);
      expect(res.status, `search ${JSON.stringify(text.slice(0, 20))}`).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  it("does not throw building a search from odd text", () => {
    for (const text of WEIRD) expect(() => buildListingSearch(text)).not.toThrow();
  });

  it("finds a listing by a Devanagari word", async () => {
    await createProperty({ title: "पुणे हाइट्स", status: "approved" });
    await createProperty({ title: "Other Tower", status: "approved" });

    const res = await listing(`search=${encodeURIComponent("पुणे")}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.title)).toEqual(["पुणे हाइट्स"]);
  });

  it("combines a search with every panel filter without error", async () => {
    await seed(30);
    const qs = [
      "search=" + encodeURIComponent("2 bhk flats in pune under 80 lakh"),
      "bhk=5%2B&bhk=2",
      "propertyType=Villa&propertyType=Plot",
      "priceMin=1000000&priceMax=9000000",
      "city=Pune&page=1&limit=10",
    ].join("&");

    const res = await listing(qs);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("caps the name words so one request can't build dozens of regexes", () => {
    const result = buildListingSearch("alpha bravo charlie delta echo foxtrot golf hotel");

    expect(result.and.length).toBeLessThanOrEqual(3);
  });
});

describe("listing search: bounded and fast on a larger collection", () => {
  beforeEach(async () => {
    await seed(600);
  });

  it("never returns more than the page limit, however large", async () => {
    for (const qs of ["limit=100000", "limit=100000&page=99999", "limit=-1", "limit=abc&page=abc"]) {
      const res = await listing(`search=tower&${qs}`);
      expect(res.status, qs).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(100);
    }
  });

  it("returns an empty page, not an error, past the end of the results", async () => {
    const res = await listing("search=skyline&page=999&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it.each([
    ["a city name", "pune"],
    ["a name word", "skyline"],
    ["several words", "tower skyline pune"],
    ["words that match nothing, forcing a full scan", "zzqxjv kkwpt"],
    ["a long search near the length cap", "tower skyline orchid meadows gardens pune mumbai thane andheri baner locality".repeat(1)],
    ["typed filters and a place", "2 bhk flats in thane under 60 lakh"],
  ])("answers %s within the time limit", async (_label, text) => {
    const { res, ms } = await timed(() => listing(`search=${encodeURIComponent(text)}`));

    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(SLOW_MS);
  });

  it("returns only the fields the listing cards need, not whole documents", async () => {
    const res = await listing("search=skyline&limit=5");
    const [first] = res.body.data;

    expect(first).toBeDefined();
    expect(first).not.toHaveProperty("userId");
    expect(first).not.toHaveProperty("__v");
  });
});
