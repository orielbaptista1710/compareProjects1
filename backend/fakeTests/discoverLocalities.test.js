// backend/fakeTests/discoverLocalities.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createAdminUser, createUser, createProperty, signToken } from "./helpers/fixtures.js";
import { clearCache } from "../utils/withCache.js";
import { invalidatePropertyCaches } from "../utils/propertyCache.js";
import Property from "../models/Property.js";

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
const labels = (links = []) => links.map((l) => l.label);
const allLabels = (data) => Object.values(data).flat().map((l) => l.label);
const findLink = (data, label) => Object.values(data).flat().find((l) => l.label === label);

// Same URL the footer builds (Footer.jsx toHref): array params become repeated keys.
const openLink = (params) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    for (const item of [].concat(v)) qs.append(k, String(item));
  }
  return request(app).get(`/api/properties?${qs}`);
};

// Fixture defaults: city "Mumbai", locality "Andheri", propertyType "Villa".
const approved = (developer, overrides = {}) =>
  createProperty({ userId: developer._id, status: "approved", ...overrides });

describe("GET /api/discover/localities (footer popular searches)", () => {
  it("builds links only from approved properties, never pending or rejected ones", async () => {
    const developer = await createUser();
    await approved(developer, { locality: "Powai" });
    await createProperty({ userId: developer._id, status: "pending", locality: "Secret Pending Area" });
    await createProperty({ userId: developer._id, status: "rejected", locality: "Rejected Area" });

    const res = await getFooter();

    expect(res.status).toBe(200);
    const all = allLabels(res.body.data);
    expect(all).toContain("Villas in Powai");
    expect(all.some((l) => l.includes("Secret Pending Area"))).toBe(false);
    expect(all.some((l) => l.includes("Rejected Area"))).toBe(false);
  });

  it("returns type+city, type+locality and BHK+locality links with exact filter params", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Flats/Apartments", city: "Thane", locality: "Thane West", bhk: 2 });

    const { body } = await getFooter();

    expect(body.data.residential).toEqual(
      expect.arrayContaining([
        { label: "Flats in Thane", params: { propertyType: "Flats/Apartments", city: "Thane" } },
        {
          label: "Flats in Thane West",
          params: { propertyType: "Flats/Apartments", city: "Thane", locality: "Thane West" },
        },
        {
          label: "2 BHK in Thane West",
          params: {
            propertyType: ["Flats/Apartments", "Villa"],
            city: "Thane",
            locality: "Thane West",
            bhk: 2,
          },
        },
      ])
    );
  });

  it("puts each property type in its footer category", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Villa", locality: "Lonavala" });
    await approved(developer, { propertyType: "Office Space", locality: "BKC" });
    await approved(developer, { propertyType: "Shop/Showroom", locality: "Dadar" });
    await approved(developer, { propertyType: "Industrial Warehouse/Godown", locality: "Bhiwandi" });
    await approved(developer, { propertyType: "Plot", locality: "Panvel" });

    const { body } = await getFooter();

    expect(labels(body.data.residential)).toContain("Villas in Lonavala");
    expect(labels(body.data.commercial)).toContain("Office spaces in BKC");
    expect(labels(body.data.retail)).toContain("Shops & showrooms in Dadar");
    expect(labels(body.data.industrial)).toContain("Warehouses in Bhiwandi");
    expect(labels(body.data.plot)).toContain("Plots in Panvel");
  });

  it("returns all five categories, with an empty list where nothing is listed", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Villa" });

    const { body } = await getFooter();

    expect(Object.keys(body.data).sort()).toEqual(
      ["commercial", "industrial", "plot", "residential", "retail"]
    );
    expect(body.data.residential.length).toBeGreaterThan(0);
    expect(body.data.plot).toEqual([]);
  });

  it("ranks links by listing count and merges duplicates into one link", async () => {
    const developer = await createUser();
    await approved(developer, { locality: "Baner", city: "Pune" });
    await approved(developer, { locality: "Baner", city: "Pune" });
    await approved(developer, { locality: "Baner", city: "Pune" });
    await approved(developer, { locality: "Wakad", city: "Pune" });

    const { body } = await getFooter();
    const res = labels(body.data.residential);

    expect(res).toEqual(["Villas in Pune", "Villas in Baner", "Villas in Wakad"]);
  });

  it("mixes city, locality and BHK links instead of listing every city first", async () => {
    const developer = await createUser();
    for (const city of ["Mumbai", "Pune", "Thane"]) {
      await approved(developer, { propertyType: "Flats/Apartments", city, locality: `${city} East`, bhk: 2 });
      await approved(developer, { propertyType: "Flats/Apartments", city, locality: `${city} East`, bhk: 2 });
    }

    const { body } = await getFooter();

    expect(labels(body.data.residential).slice(0, 3)).toEqual([
      "Flats in Mumbai",
      "Flats in Mumbai East",
      "2 BHK in Mumbai East",
    ]);
  });

  it("skips the locality link when the locality is just the city name", async () => {
    const developer = await createUser();
    await approved(developer, { city: "Mumbai", locality: "mumbai" });

    const { body } = await getFooter();

    expect(labels(body.data.residential)).toEqual(["Villas in Mumbai"]);
  });

  it("only adds BHK links for flats and villas", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Office Space", locality: "BKC", bhk: 2 });

    const { body } = await getFooter();

    expect(labels(body.data.commercial).some((l) => l.includes("BHK"))).toBe(false);
  });

  it("caps each category at 20 links", async () => {
    const developer = await createUser();
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => approved(developer, { locality: `Area ${i}` }))
    );

    const { body } = await getFooter();

    expect(body.data.residential).toHaveLength(20);
  });

  it("every link opens exactly the listings its label names", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Flats/Apartments", city: "Thane", locality: "Thane West", bhk: 2 });
    await approved(developer, { propertyType: "Villa", city: "Thane", locality: "Thane West", bhk: 2 });
    await approved(developer, { propertyType: "Office Space", city: "Mumbai", locality: "BKC" });

    const { body } = await getFooter();
    const expected = {
      "Flats in Thane": 1,
      "Flats in Thane West": 1,
      "Villas in Thane": 1,
      "Villas in Thane West": 1,
      "2 BHK in Thane West": 2,
      "Office spaces in Mumbai": 1,
      "Office spaces in BKC": 1,
    };
    expect(allLabels(body.data).sort()).toEqual(Object.keys(expected).sort());

    for (const { label, params } of Object.values(body.data).flat()) {
      const res = await openLink(params);
      expect(res.status, label).toBe(200);
      expect(res.body.totalProperties, label).toBe(expected[label]);
    }
  });

  it("BHK links don't pull in offices or shops that also have a bhk value", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Flats/Apartments", locality: "Andheri", bhk: 2 });
    for (let i = 0; i < 3; i++) {
      await approved(developer, { propertyType: "Office Space", locality: "Andheri", bhk: 2 });
    }

    const { body } = await getFooter();
    const link = findLink(body.data, "2 BHK in Andheri");
    expect(link).toBeDefined();

    const res = await openLink(link.params);
    expect(res.body.totalProperties).toBe(1);
  });

  it("keeps a city and a same-named locality as separate, correctly labelled links", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Flats/Apartments", city: "Thane", locality: "Thane West" });
    await approved(developer, { propertyType: "Flats/Apartments", city: "Mumbai", locality: "Thane" });
    await approved(developer, { propertyType: "Flats/Apartments", city: "Mumbai", locality: "Thane" });

    const { body } = await getFooter();
    const cityLink = findLink(body.data, "Flats in Thane");
    const localityLink = findLink(body.data, "Flats in Thane, Mumbai");

    expect(cityLink.params).toEqual({ propertyType: "Flats/Apartments", city: "Thane" });
    expect(localityLink.params).toEqual({ propertyType: "Flats/Apartments", city: "Mumbai", locality: "Thane" });
    expect((await openLink(cityLink.params)).body.totalProperties).toBe(1);
    expect((await openLink(localityLink.params)).body.totalProperties).toBe(2);
  });

  it("merges spellings that differ only in case into one link that opens all of them", async () => {
    const developer = await createUser();
    await approved(developer, { propertyType: "Flats/Apartments", city: "Mumbai", locality: "Andheri" });
    await approved(developer, { propertyType: "Flats/Apartments", city: "Mumbai", locality: "Andheri" });
    await approved(developer, { propertyType: "Flats/Apartments", city: "mumbai", locality: "andheri" });

    const { body } = await getFooter();
    const res = labels(body.data.residential);

    expect(res.filter((l) => l.toLowerCase() === "flats in mumbai")).toEqual(["Flats in Mumbai"]);
    expect(res.filter((l) => l.toLowerCase() === "flats in andheri")).toEqual(["Flats in Andheri"]);

    const locality = findLink(body.data, "Flats in Andheri");
    expect(locality.params.locality).toEqual(["Andheri", "andheri"]);
    expect((await openLink(locality.params)).body.totalProperties).toBe(3);
    expect((await openLink(findLink(body.data, "Flats in Mumbai").params)).body.totalProperties).toBe(3);
  });

  it("ignores listings with a missing or non-text city instead of failing", async () => {
    const developer = await createUser();
    await approved(developer, { locality: "Powai" });
    // Raw insert: bypasses schema validation, like old scraper rows can.
    await Property.collection.insertOne({
      status: "approved", propertyType: "Villa", city: null, locality: "Nowhere", bhk: 2,
    });

    const res = await getFooter();

    expect(res.status).toBe(200);
    expect(allLabels(res.body.data)).toContain("Villas in Powai");
    expect(allLabels(res.body.data).some((l) => l.includes("Nowhere"))).toBe(false);
  });

  it("serves repeat requests from the 5-minute cache instead of re-querying", async () => {
    const developer = await createUser();
    await approved(developer, { locality: "Andheri" });
    await getFooter();

    // Written straight to the DB, bypassing approve/edit, so nothing clears the cache.
    await approved(developer, { locality: "Powai" });

    const cached = await getFooter();
    expect(labels(cached.body.data.residential)).not.toContain("Villas in Powai");

    invalidatePropertyCaches();

    const fresh = await getFooter();
    expect(labels(fresh.body.data.residential)).toContain("Villas in Powai");
  });

  it("shows a newly approved property immediately (approving clears the cache)", async () => {
    const admin = await createAdminUser();
    const developer = await createUser();
    const pending = await createProperty({ userId: developer._id, status: "pending", locality: "Baner" });

    const before = await getFooter();
    expect(allLabels(before.body.data)).not.toContain("Villas in Baner");

    const approve = await request(app)
      .put(`/api/admin/approve/${pending._id}`)
      .set("Authorization", `Bearer ${signToken(admin)}`);
    expect(approve.status).toBe(200);

    const after = await getFooter();
    expect(labels(after.body.data.residential)).toContain("Villas in Baner");
  });

  it("drops a deleted property immediately (developer delete clears the cache)", async () => {
    const developer = await createUser();
    const property = await approved(developer, { locality: "Wakad" });

    const before = await getFooter();
    expect(labels(before.body.data.residential)).toContain("Villas in Wakad");

    const del = await request(app)
      .delete(`/api/properties/delete/${property._id}`)
      .set("Authorization", `Bearer ${signToken(developer)}`);
    expect(del.status).toBe(200);

    const after = await getFooter();
    expect(allLabels(after.body.data)).not.toContain("Villas in Wakad");
  });

  it("does not log the response payload", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await createProperty({ status: "approved" });

    await getFooter();

    expect(logSpy).not.toHaveBeenCalled();
  });
});
