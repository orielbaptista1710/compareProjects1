// backend/fakeTests/propertyInputRules.test.js
//
// Developer property input rules (docs/review SEC-04, SEC-09, DATA-01):
// only allowlisted fields can be set, links must point at trusted hosts, and
// editing coordinates keeps the geo point in sync.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createProperty, signToken } from "./helpers/fixtures.js";
import Property from "../models/Property.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

const VALID_NEW_LISTING = {
  developerName: "Dev Co",
  title: "New listing",
  description: "A test property description.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri",
  address: "123 Test Street",
  pincode: "400001",
  price: 5000000,
  propertyType: "Villa",
};

// What a malicious developer could put in the body to game moderation/ranking.
const FORGED = {
  metadata: {
    moderation: { verifiedByAdmin: true, dataQualityScore: 100 },
    analytics: { popularityScore: 999, viewCount: 100000 },
  },
  reraApproved: true, // no reraNumber
  featured: true,
  status: "approved",
  ownerPhone: "9999999999",
  brokerEmail: "broker@example.com",
  sourceUrl: "https://elsewhere.example",
  dataSource: "scraper",
};

const addAs = (user, body) =>
  request(app).post("/api/properties/add").set("Authorization", `Bearer ${signToken(user)}`).send(body);

const updateAs = (user, id, body) =>
  request(app).put(`/api/properties/update/${id}`).set("Authorization", `Bearer ${signToken(user)}`).send(body);

function expectNotForged(saved) {
  expect(saved.metadata?.moderation?.verifiedByAdmin ?? false).toBe(false);
  expect(saved.metadata?.moderation?.dataQualityScore ?? 0).toBe(0);
  expect(saved.metadata?.analytics?.popularityScore ?? 0).toBe(0);
  expect(saved.metadata?.analytics?.viewCount ?? 0).toBe(0);
  expect(saved.reraApproved).toBe(false);
  expect(saved.featured).toBe(false);
  expect(saved.status).toBe("pending");
  expect(saved.ownerPhone).toBeUndefined();
  expect(saved.brokerEmail).toBeUndefined();
  expect(saved.sourceUrl).toBeUndefined();
  expect(saved.dataSource).toBe("manual");
}

describe("developer can only set allowlisted fields (SEC-04)", () => {
  it("add ignores forged moderation, analytics, RERA badge and contact fields", async () => {
    const dev = await createUser();

    const res = await addAs(dev, { ...VALID_NEW_LISTING, ...FORGED });

    expect(res.status).toBe(201);
    expectNotForged(await Property.findById(res.body.property._id).lean());
  });

  it("update ignores the same forged fields", async () => {
    const dev = await createUser();
    const property = await createProperty({ userId: dev._id });

    const res = await updateAs(dev, property._id, { title: "Edited title", ...FORGED });

    expect(res.status).toBe(200);
    const saved = await Property.findById(property._id).lean();
    expect(saved.title).toBe("Edited title");
    expectNotForged(saved);
  });

  it("an update only touches the fields that were sent", async () => {
    const dev = await createUser();
    const property = await createProperty({ userId: dev._id, bhk: 3, long_description: "Keep me" });

    await updateAs(dev, property._id, { title: "Only the title changes" });

    const saved = await Property.findById(property._id).lean();
    expect(saved.bhk).toBe(3);
    expect(saved.long_description).toBe("Keep me");
  });

  it("RERA approved is derived from having a RERA number", async () => {
    const dev = await createUser();

    const withNumber = await addAs(dev, { ...VALID_NEW_LISTING, reraNumber: "P51800012345", reraApproved: false });
    expect(withNumber.status).toBe(201);
    expect((await Property.findById(withNumber.body.property._id).lean()).reraApproved).toBe(true);

    const cleared = await updateAs(dev, withNumber.body.property._id, { reraNumber: "" });
    expect(cleared.status).toBe(200);
    expect((await Property.findById(withNumber.body.property._id).lean()).reraApproved).toBe(false);
  });

  it("data the model rejects is a 400 naming the field, not a 500", async () => {
    const dev = await createUser();

    const res = await addAs(dev, { ...VALID_NEW_LISTING, pincode: "12345", furnishing: "Palace" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("pincode");
    expect(res.body.message).toContain("furnishing");
    expect(res.body.message).not.toContain("12345"); // field names, not values
  });

  it("accepts the dashboard form's payload shape (empty strings, comma-joined parkings)", async () => {
    const dev = await createUser();

    const res = await addAs(dev, {
      ...VALID_NEW_LISTING,
      long_description: "",
      mapLink: "",
      reraNumber: "",
      wing: "",
      phase: "",
      facing: "",
      area: { value: 950, unit: "sqft" },
      bhk: 2,
      parkings: "Open Parking, Covered Parking",
      amenities: [],
      priceNegotiable: false,
    });

    expect(res.status).toBe(201);
    const saved = await Property.findById(res.body.property._id).lean();
    expect(saved.parkings).toEqual(["Open Parking", "Covered Parking"]);
    expect(saved.area).toEqual({ value: 950, unit: "sqft" });
  });
});

describe("links and media must point at trusted hosts (SEC-09)", () => {
  it.each([
    ["mapLink", { mapLink: "https://attacker.example/maps/embed/login" }],
    ["mapLink", { mapLink: "http://www.google.com/maps/embed?pb=1" }], // not https
    ["coverImage.url", { coverImage: { url: "https://evil.example/cover.jpg" } }],
    ["galleryImages.0.url", { galleryImages: [{ url: "javascript:alert(1)" }] }],
    ["virtualTours.0.url", { virtualTours: [{ type: "video", url: "https://evil.example/tour" }] }],
  ])("rejects an untrusted %s with a 400 naming the field", async (field, body) => {
    const dev = await createUser();

    const res = await addAs(dev, { ...VALID_NEW_LISTING, ...body });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain(field);
    expect(await Property.countDocuments()).toBe(0);
  });

  it("accepts Google Maps, Cloudinary and YouTube links", async () => {
    const dev = await createUser();

    const res = await addAs(dev, {
      ...VALID_NEW_LISTING,
      mapLink: "https://maps.app.goo.gl/abc123",
      coverImage: { url: "https://res.cloudinary.com/demo/image/upload/cover.jpg" },
      virtualTours: [{ type: "video", url: "https://www.youtube.com/watch?v=abc" }],
    });

    expect(res.status).toBe(201);
  });
});

describe("editing coordinates keeps geo in sync (DATA-01)", () => {
  it("recomputes geo when a saved listing's coordinates are edited", async () => {
    const dev = await createUser();
    const property = await createProperty({ userId: dev._id, coordinates: { lat: 19.1, lng: 72.8 } });
    expect(property.geo.coordinates).toEqual([72.8, 19.1]);

    const res = await updateAs(dev, property._id, { coordinates: { lat: 28.6, lng: 77.2 } });

    expect(res.status).toBe(200);
    const saved = await Property.findById(property._id).lean();
    expect(saved.coordinates).toMatchObject({ lat: 28.6, lng: 77.2 });
    expect(saved.geo.coordinates).toEqual([77.2, 28.6]);
  });

  it("rejects out-of-range coordinates", async () => {
    const dev = await createUser();

    const res = await addAs(dev, { ...VALID_NEW_LISTING, coordinates: { lat: 200, lng: 72.8 } });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("coordinates.lat");
  });

  it("rejects blank coordinates instead of pinning the listing at 0,0", async () => {
    const dev = await createUser();

    const res = await addAs(dev, { ...VALID_NEW_LISTING, coordinates: { lat: "", lng: "" } });

    expect(res.status).toBe(400);
    expect(await Property.countDocuments()).toBe(0);
  });
});
