// backend/fakeTests/locationSearch.test.js
// GET /api/locations/search — the home page location box (LocationSearchBar).
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { rateLimit } from "express-rate-limit";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createProperty } from "./helpers/fixtures.js";
import { clearCache, withCache, createCache, CACHE_MAX_KEYS } from "../utils/withCache.js";
import { MAX_QUERY_LENGTH } from "../services/locationSearchService.js";
import locationRoutes from "../routes/locationRoutes.js";
import {
  locationSuggestLimiter,
  searchLimiter,
  LOCATION_SUGGEST_LIMIT,
} from "../middleware/rateLimiters.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  clearCache();
  await clearTestDb();
});

const suggest = (query) => request(app).get(`/api/locations/search${query}`);
const labels = (res) => res.body.results.map((r) => r.label);

const approved = (developer, overrides = {}) =>
  createProperty({ userId: developer._id, status: "approved", ...overrides });

describe("GET /api/locations/search", () => {
  it("returns matching cities and localities from approved listings", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune", locality: "Baner" });
    await approved(developer, { city: "Mumbai", locality: "Punawale Road" });

    const res = await suggest("?q=pun");

    expect(res.status).toBe(200);
    expect(labels(res)).toEqual(expect.arrayContaining(["Pune", "Punawale Road, Mumbai"]));
    const city = res.body.results.find((r) => r.label === "Pune");
    expect(city).toMatchObject({ type: "city", city: "Pune", localities: [] });
  });

  it("never suggests places that only have pending or rejected listings", async () => {
    const developer = await createUser();
    await createProperty({ userId: developer._id, status: "pending", city: "Secretpur", locality: "Hidden" });
    await createProperty({ userId: developer._id, status: "rejected", city: "Secretpur", locality: "Hidden" });

    const res = await suggest("?q=secret");

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it("returns an empty list for queries shorter than 2 characters or missing", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune" });

    for (const q of ["", "?q=", "?q=p", "?q=%20%20"]) {
      const res = await suggest(q);
      expect(res.status, q).toBe(200);
      expect(res.body.results, q).toEqual([]);
    }
  });

  it("treats a repeated q (array) as no query instead of failing with 500", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune" });

    const res = await suggest("?q=pune&q=mumbai");

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it("caps long queries at 100 characters before matching", async () => {
    const developer = await createUser();
    const capped = "a".repeat(MAX_QUERY_LENGTH);
    await approved(developer, { city: "Pune", locality: capped });

    // Uncapped, a 5000-char pattern could never match a 100-char locality.
    const res = await suggest(`?q=${"a".repeat(5000)}`);

    expect(res.status).toBe(200);
    expect(labels(res)).toContain(`${capped}, Pune`);
  });

  it("trims before capping, so leading spaces don't cut the query short", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune" });
    await approved(developer, { city: "Puri" });

    // 98 spaces + "pune": capping first would leave just "pu", matching Puri too.
    const res = await suggest(`?q=${"%20".repeat(98)}pune`);

    expect(labels(res)).toEqual(["Pune"]);
  });

  it("matches regex characters literally", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune", locality: "Baner" });

    const res = await suggest(`?q=${encodeURIComponent(".*")}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it("uses its own cache, so a full shared cache doesn't stop caching suggestions", async () => {
    for (let i = 0; i < CACHE_MAX_KEYS; i++) await withCache(`fill:${i}`, async () => i);
    const developer = await createUser();
    await approved(developer, { city: "Pune" });

    await suggest("?q=pu");
    await approved(developer, { city: "Puri" }); // straight to DB, cache not cleared

    expect(labels(await suggest("?q=pu"))).toEqual(["Pune"]); // served from cache
  });

  it("doesn't use up slots in the shared cache", async () => {
    for (let i = 0; i < CACHE_MAX_KEYS - 1; i++) await withCache(`fill:${i}`, async () => i);
    const developer = await createUser();
    await approved(developer, { city: "Pune" });

    await suggest("?q=pune");

    // The last shared slot is still free for a hot key.
    await withCache("hot", async () => "first");
    await expect(withCache("hot", async () => "second")).resolves.toBe("first");
  });
});

describe("location search rate limiting", () => {
  it("uses its own limiter, not the shared property search budget", () => {
    const layer = locationRoutes.stack.find((l) => l.route?.path === "/search" && l.route?.methods?.get);
    const handles = layer.route.stack.map((l) => l.handle);

    expect(handles).toContain(locationSuggestLimiter);
    expect(handles).not.toContain(searchLimiter);
  });

  // The shared limiters are switched off under NODE_ENV=test, so this builds
  // one from the real settings to check the budget.
  it("allows 120 requests a minute, then answers 429", async () => {
    const limited = express();
    limited.get("/search", rateLimit(LOCATION_SUGGEST_LIMIT), (req, res) => res.json({ results: [] }));

    for (let i = 0; i < LOCATION_SUGGEST_LIMIT.max; i++) {
      expect((await request(limited).get("/search?q=pu")).status).toBe(200);
    }
    const blocked = await request(limited).get("/search?q=pu");
    expect(blocked.status).toBe(429);
    expect(LOCATION_SUGGEST_LIMIT.max).toBe(120);
  });
});

describe("cache when full", () => {
  it("serves fresh results without storing them, and keeps existing entries", async () => {
    const tiny = createCache({ name: "test-tiny", maxKeys: 2 });
    await tiny("a", async () => "a1");
    await tiny("b", async () => "b1");

    await expect(tiny("c", async () => "c1")).resolves.toBe("c1");
    // Not stored: a second call runs the fetch again.
    await expect(tiny("c", async () => "c2")).resolves.toBe("c2");
    // Existing entries are untouched.
    await expect(tiny("a", async () => "a2")).resolves.toBe("a1");
  });

  it("clearCache empties every cache, including separately created ones", async () => {
    const extra = createCache({ name: "test-extra", maxKeys: 10 });
    await extra("k", async () => "old");

    clearCache();

    await expect(extra("k", async () => "new")).resolves.toBe("new");
  });
});
