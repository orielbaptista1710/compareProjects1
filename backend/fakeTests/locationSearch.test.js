// backend/fakeTests/locationSearch.test.js
// GET /api/locations/search — the home page location box (LocationSearchBar).
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createProperty } from "./helpers/fixtures.js";
import { clearCache, withCache, CACHE_MAX_KEYS } from "../utils/withCache.js";
import locationRoutes from "../routes/locationRoutes.js";
import { locationSuggestLimiter, searchLimiter } from "../middleware/rateLimiters.js";

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

  it("caps very long queries instead of failing", async () => {
    const res = await suggest(`?q=${"a".repeat(5000)}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it("matches regex characters literally", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Pune", locality: "Baner" });

    const res = await suggest(`?q=${encodeURIComponent(".*")}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});

describe("location search rate limiting", () => {
  it("uses its own limiter, not the shared property search budget", () => {
    const layer = locationRoutes.stack.find((l) => l.route?.path === "/search" && l.route?.methods?.get);
    const handles = layer.route.stack.map((l) => l.handle);

    expect(handles).toContain(locationSuggestLimiter);
    expect(handles).not.toContain(searchLimiter);
  });
});

describe("withCache when full", () => {
  it("still returns fresh results once the key cap is reached", async () => {
    for (let i = 0; i < CACHE_MAX_KEYS; i++) {
      await withCache(`fill:${i}`, async () => i);
    }

    await expect(withCache("one-too-many", async () => "fresh")).resolves.toBe("fresh");
  });
});
