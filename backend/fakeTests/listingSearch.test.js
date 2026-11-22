// backend/fakeTests/listingSearch.test.js
// GET /api/properties?search= — the free-text box on the listing page and the
// home search "See all results". Parsed with buildSearchIntent like the
// dropdown, so a typed city or "2 bhk under 80 lakh" works.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createProperty } from "./helpers/fixtures.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";
import { buildListingSearch } from "../services/searchService.js";

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

const listing = (overrides = {}) => createProperty({ status: "approved", ...overrides });

const titlesFor = async (qs) => {
  const res = await request(app).get(`/api/properties?${qs}`);
  expect(res.status).toBe(200);
  return res.body.data.map((p) => p.title).sort();
};

const search = (text, extra = "") => titlesFor(`search=${encodeURIComponent(text)}${extra}`);

describe("GET /api/properties?search=", () => {
  it("finds listings in a typed city, not only ones that mention it", async () => {
    await listing({ title: "Hill View", city: "Pune", locality: "Baner" });
    await listing({ title: "Sea View", city: "Mumbai", locality: "Andheri" });

    expect(await search("Pune")).toEqual(["Hill View"]);
  });

  it("finds a locality and a project name", async () => {
    await listing({ title: "Hill View", city: "Pune", locality: "Baner" });
    await listing({ title: "Lodha Park", city: "Mumbai", locality: "Worli" });

    expect(await search("baner")).toEqual(["Hill View"]);
    expect(await search("lodha park")).toEqual(["Lodha Park"]);
  });

  it("applies bhk, type and price read from the words", async () => {
    await listing({ title: "Match", city: "Pune", bhk: 2, propertyType: "Flats/Apartments", price: 6_000_000 });
    await listing({ title: "Too big", city: "Pune", bhk: 3, propertyType: "Flats/Apartments", price: 6_000_000 });
    await listing({ title: "Too dear", city: "Pune", bhk: 2, propertyType: "Flats/Apartments", price: 9_000_000 });
    await listing({ title: "A villa", city: "Pune", bhk: 2, propertyType: "Villa", price: 6_000_000 });

    expect(await search("2 bhk flats in pune under 80 lakh")).toEqual(["Match"]);
  });

  it("lets a filter picked in the panel win over one read from the words", async () => {
    await listing({ title: "Two", city: "Pune", bhk: 2 });
    await listing({ title: "Three", city: "Pune", bhk: 3 });

    expect(await search("2 bhk pune", "&bhk=3")).toEqual(["Three"]);
    expect(await search("pune under 50 lakh", "&priceMax=99000000")).toEqual(["Three", "Two"]);
  });

  it("keeps a chosen city alongside the search", async () => {
    await listing({ title: "Baner Pune", city: "Pune", locality: "Baner" });
    await listing({ title: "Baner Mumbai", city: "Mumbai", locality: "Baner Road" });

    expect(await search("baner", "&city=Pune")).toEqual(["Baner Pune"]);
  });

  it("ignores junk, one-letter and non-string searches", async () => {
    await listing({ title: "One" });
    await listing({ title: "Two" });

    expect(await search("a")).toEqual(["One", "Two"]);
    expect(await search("$%^")).toEqual(["One", "Two"]);
    expect(await titlesFor("search=a&search=b")).toEqual(["One", "Two"]);
    expect(await titlesFor("search[$ne]=x")).toEqual(["One", "Two"]);
  });

  it("treats regex characters as plain text", async () => {
    await listing({ title: "Plain" });

    expect(await search(".*")).toEqual(["Plain"]); // "." after cleaning: too short, no search
    expect(await search("(pune")).toEqual([]); // "pune", and Plain is in Mumbai
  });

  it("never returns pending or rejected listings", async () => {
    await listing({ title: "Live", city: "Pune" });
    await createProperty({ title: "Waiting", city: "Pune", status: "pending" });
    await createProperty({ title: "Refused", city: "Pune", status: "rejected" });

    expect(await search("pune")).toEqual(["Live"]);
  });
});

describe("buildListingSearch", () => {
  it("returns null when there is nothing to search for", () => {
    expect(buildListingSearch(undefined)).toBeNull();
    expect(buildListingSearch(["pune"])).toBeNull();
    expect(buildListingSearch(" a ")).toBeNull();
    expect(buildListingSearch("!!")).toBeNull();
  });

  it("splits filters from the name/place match and drops status", () => {
    const result = buildListingSearch("3 bhk villa in pune");

    expect(result.filters).toEqual({ bhk: 3, propertyType: "Villa" });
    expect(result.or.map((clause) => Object.keys(clause)[0])).toEqual([
      "title", "description", "locality", "city", "locality", "state",
    ]);
  });
});
