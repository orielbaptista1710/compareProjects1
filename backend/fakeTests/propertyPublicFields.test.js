// backend/fakeTests/propertyPublicFields.test.js
//
// Regression test for SEC-01 (docs/review/01-security.md): public property
// endpoints must never return owner/broker contact details or internal fields.
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

const PRIVATE_FIELDS = [
  "ownerName", "ownerPhone", "ownerEmail",
  "brokerName", "brokerPhone", "brokerEmail",
  "userId", "sourceUrl", "dataSource", "importedAt",
  "reviewedBy", "reviewedAt", "rejectionReason", "submittedAt", "tierType",
];

const SECRET_PHONE = "9123456780";
const SECRET_EMAIL = "owner-private@example.com";

const createSensitiveProperty = (overrides = {}) =>
  createProperty({
    status: "approved",
    featured: true,
    title: "Sunrise Heights Andheri",
    ownerName: "Private Owner",
    ownerPhone: SECRET_PHONE,
    ownerEmail: SECRET_EMAIL,
    brokerName: "Private Broker",
    brokerPhone: "9988776655",
    brokerEmail: "broker-private@example.com",
    sourceUrl: "https://some-scraped-site.example/listing/1",
    dataSource: "scraper",
    metadata: {
      moderation: { verifiedByAdmin: true, verificationNotes: "internal note" },
      marketing: { utmSource: "internal" },
      analytics: { popularityScore: 42 },
    },
    ...overrides,
  });

function expectNoPrivateData(property) {
  for (const field of PRIVATE_FIELDS) {
    expect(property, `"${field}" must not be public`).not.toHaveProperty(field);
  }
  expect(property.metadata?.moderation).toBeUndefined();
  expect(property.metadata?.marketing).toBeUndefined();

  // Belt and braces: the values must not appear anywhere in the payload.
  const raw = JSON.stringify(property);
  expect(raw).not.toContain(SECRET_PHONE);
  expect(raw).not.toContain(SECRET_EMAIL);
}

describe("public property endpoints hide private fields (SEC-01)", () => {
  it("GET /api/properties (listing) returns card fields but no contact or internal fields", async () => {
    await createSensitiveProperty();

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(1);
    const [property] = res.body.properties;
    expectNoPrivateData(property);

    // Still returns what the cards and the guest compare tray render.
    expect(property).toMatchObject({ title: "Sunrise Heights Andheri", city: "Mumbai", price: 5000000 });
    expect(property._id).toBeDefined();
    expect(property.metadata.analytics.popularityScore).toBe(42);
  });

  it("GET /api/properties/:id (detail) returns page fields but no contact or internal fields", async () => {
    const created = await createSensitiveProperty({ long_description: "Long public description" });

    const res = await request(app).get(`/api/properties/${created._id}`);

    expect(res.status).toBe(200);
    expectNoPrivateData(res.body);
    expect(res.body).toMatchObject({
      title: "Sunrise Heights Andheri",
      long_description: "Long public description",
      address: "123 Test Street",
    });
  });

  it("the other public property endpoints don't leak private fields either", async () => {
    const created = await createSensitiveProperty();
    // A second approved listing in the same locality so /related has a result.
    await createSensitiveProperty({ title: "Sunrise Heights Tower B" });

    const responses = await Promise.all([
      request(app).get("/api/properties/featured"),
      request(app).get("/api/properties/recent"),
      request(app).get(`/api/properties/related/${created._id}`),
      request(app).get("/api/properties/search?query=Sunrise"),
    ]);

    const [featured, recent, related, search] = responses;
    for (const res of responses) expect(res.status).toBe(200);

    const all = [...featured.body, ...recent.body, ...related.body, ...search.body.properties];
    expect(all.length).toBeGreaterThan(0);
    all.forEach(expectNoPrivateData);
  });
});
