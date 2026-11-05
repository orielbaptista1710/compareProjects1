// backend/fakeTests/customerListings.test.js
//
// Owner/agent posting through /api/customers/listings. These lock in the rules
// in middleware/listingOwner.js: ownership fields come from the account, never
// the body; only the poster can see/edit/delete their listings; unverified,
// suspended and over-the-limit accounts can't post.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer, createUser, createProperty, signToken } = await import("./helpers/fixtures.js");
const { default: Property } = await import("../models/Property.js");

// Firebase accepts "token-for-<uid>" for any customer created in the test.
const acceptTestTokens = () =>
  verifyIdToken.mockImplementation(async (token) => {
    if (!token.startsWith("token-for-")) {
      throw Object.assign(new Error("bad token"), { code: "auth/argument-error" });
    }
    return { uid: token.slice("token-for-".length) };
  });

beforeAll(startTestDb);
afterAll(stopTestDb);
afterEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
  acceptTestTokens();
});
acceptTestTokens();

const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const verifiedCustomer = (overrides = {}) => createCustomer({ emailVerified: true, ...overrides });

const LISTING = {
  title: "2BHK in Andheri",
  description: "Sunny flat, close to the station.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri",
  address: "12 Test Road",
  pincode: "400053",
  price: 9500000,
  propertyType: "Villa",
};

// A listing owned by a customer, created directly (bypassing the API).
const customerListing = (customer, overrides = {}) =>
  createProperty({
    userId: customer._id,
    ownerModel: "Customer",
    listedBy: "owner",
    developerName: undefined,
    ...overrides,
  });

describe("POST /api/customers/listings", () => {
  it("creates a pending owner listing with ownership fields taken from the account, not the body", async () => {
    const customer = await verifiedCustomer();
    const someoneElse = await createUser();

    const res = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(customer))
      .send({
        ...LISTING,
        status: "approved",
        featured: true,
        listedBy: "developer",
        ownerModel: "User",
        userId: String(someoneElse._id),
        listingType: "sale",
      });

    expect(res.status).toBe(201);
    const saved = await Property.findById(res.body.property._id).lean();
    expect(saved.status).toBe("pending");
    expect(saved.featured).toBe(false);
    expect(saved.listedBy).toBe("owner");
    expect(saved.ownerModel).toBe("Customer");
    expect(String(saved.userId)).toBe(String(customer._id));
    expect(saved.listingType).toBe("resale"); // owners always sell resale
  });

  it("doesn't require a developer name and never joins a developer's project group", async () => {
    const customer = await verifiedCustomer();

    const res = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(customer))
      .send({ ...LISTING, developerName: "Big Builder", projectName: "Skyline Towers" });

    expect(res.status).toBe(201);
    expect(res.body.property.projectKey).toBeNull();
  });

  it("marks an approved agent's listing as 'agent' and lets them choose sale", async () => {
    const agent = await verifiedCustomer({ agent: { status: "approved", agencyName: "Prime Realty" } });

    const res = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(agent))
      .send({ ...LISTING, listingType: "sale" });

    expect(res.status).toBe(201);
    expect(res.body.property.listedBy).toBe("agent");
    expect(res.body.property.listingType).toBe("sale");
  });

  it.each([
    ["pending", /awaiting approval/i],
    ["rejected", /not approved/i],
  ])("doesn't let a %s agent post at all — not even as an owner (403)", async (status, message) => {
    const applicant = await verifiedCustomer({ agent: { status } });

    const res = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(applicant))
      .send(LISTING);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(message);
    expect(await Property.countDocuments()).toBe(0);
  });

  it("refuses customers who haven't verified their email (403), but still lets them view", async () => {
    const customer = await createCustomer({ emailVerified: false });

    const post = await request(app).post("/api/customers/listings").set("Authorization", bearer(customer)).send(LISTING);
    const list = await request(app).get("/api/customers/listings").set("Authorization", bearer(customer));

    expect(post.status).toBe(403);
    expect(post.body.message).toMatch(/verify your email/i);
    expect(list.status).toBe(200);
  });

  it("refuses a suspended agent (403)", async () => {
    const agent = await verifiedCustomer({ agent: { status: "suspended" } });

    const res = await request(app).post("/api/customers/listings").set("Authorization", bearer(agent)).send(LISTING);

    expect(res.status).toBe(403);
  });

  it("refuses a suspended customer account on every route (403)", async () => {
    const customer = await verifiedCustomer({ isActive: false });

    const res = await request(app).get("/api/customers/listings").set("Authorization", bearer(customer));

    expect(res.status).toBe(403);
  });

  it("caps pending listings per customer (429)", async () => {
    const customer = await verifiedCustomer();
    for (let i = 0; i < 10; i++) await customerListing(customer);

    const res = await request(app).post("/api/customers/listings").set("Authorization", bearer(customer)).send(LISTING);

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/waiting for review/);
  });

  it("requires a Firebase token (401)", async () => {
    const res = await request(app).post("/api/customers/listings").send(LISTING);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/customers/listings", () => {
  it("returns only the customer's own listings, without admin bookkeeping", async () => {
    const customer = await verifiedCustomer();
    const other = await verifiedCustomer();
    await customerListing(customer, { title: "Mine" });
    await customerListing(other, { title: "Theirs" });
    await createProperty({ title: "A developer's" });

    const res = await request(app).get("/api/customers/listings").set("Authorization", bearer(customer));

    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.title)).toEqual(["Mine"]);
    expect(res.body[0].reviewHistory).toBeUndefined();
    expect(res.body[0].reviewedBy).toBeUndefined();
  });
});

describe("PUT/DELETE /api/customers/listings/:id", () => {
  it("sends an edited approved listing back to pending", async () => {
    const customer = await verifiedCustomer();
    const listing = await customerListing(customer, { status: "approved" });

    const res = await request(app)
      .put(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(customer))
      .send({ price: 9000000 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    expect(res.body.price).toBe(9000000);
  });

  it("can't edit or delete another customer's listing (404)", async () => {
    const owner = await verifiedCustomer();
    const intruder = await verifiedCustomer();
    const listing = await customerListing(owner);

    const put = await request(app)
      .put(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(intruder))
      .send({ price: 1 });
    const del = await request(app)
      .delete(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(intruder));

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(await Property.exists({ _id: listing._id })).toBeTruthy();
  });

  it("can't touch a developer's listing through the customer routes (404)", async () => {
    const customer = await verifiedCustomer();
    const developerListing = await createProperty();

    const res = await request(app)
      .delete(`/api/customers/listings/${developerListing._id}`)
      .set("Authorization", bearer(customer));

    expect(res.status).toBe(404);
  });

  it("lets the owner delete their own listing, even when they couldn't post right now", async () => {
    const customer = await createCustomer({ emailVerified: false });
    const listing = await customerListing(customer);

    const res = await request(app)
      .delete(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(customer));

    expect(res.status).toBe(200);
    expect(await Property.exists({ _id: listing._id })).toBeNull();
  });
});

describe("GET /api/properties/related/:id for owner listings", () => {
  it("matches by locality only — no developerName to match on", async () => {
    const owner = await verifiedCustomer();
    const mine = await customerListing(owner, { status: "approved", city: "Pune", locality: "Baner" });
    const neighbour = await customerListing(owner, { status: "approved", city: "Pune", locality: "Baner" });
    await customerListing(owner, { status: "approved", city: "Delhi", locality: "Saket" });

    const res = await request(app).get(`/api/properties/related/${mine._id}`);

    expect(res.status).toBe(200);
    const related = res.body.data ?? res.body;
    expect(related.map((p) => String(p._id))).toEqual([String(neighbour._id)]);
  });
});

describe("developer listings through /api/properties", () => {
  it.each(["user", "developer"])("accepts a developer with role %s and stamps listedBy/ownerModel", async (role) => {
    const developer = await createUser({ role });

    const res = await request(app)
      .post("/api/properties/add")
      .set("Authorization", `Bearer ${signToken(developer)}`)
      .send({ ...LISTING, developerName: "Dev Co" });

    expect(res.status).toBe(201);
    expect(res.body.property.listedBy).toBe("developer");
    expect(res.body.property.ownerModel).toBe("User");
  });

  it("still finds a developer's listings saved before ownerModel existed (pre-migration)", async () => {
    const developer = await createUser({ role: "developer" });
    const legacy = await createProperty({ userId: developer._id });
    await Property.collection.updateOne({ _id: legacy._id }, { $unset: { ownerModel: "", listedBy: "" } });
    const auth = `Bearer ${signToken(developer)}`;

    const mine = await request(app).get("/api/properties/my-properties").set("Authorization", auth);
    const removed = await request(app).delete(`/api/properties/delete/${legacy._id}`).set("Authorization", auth);

    expect(mine.body.map((p) => String(p._id))).toEqual([String(legacy._id)]);
    expect(removed.status).toBe(200);
  });

  it("refuses the old 'broker' value for listedBy (only owner, agent, developer)", async () => {
    const developer = await createUser();

    await expect(createProperty({ userId: developer._id, listedBy: "broker" })).rejects.toThrow(/listedBy/);
  });

  it("doesn't let a developer edit a customer's listing (404)", async () => {
    const developer = await createUser({ role: "developer" });
    const customer = await verifiedCustomer();
    const listing = await customerListing(customer);

    const res = await request(app)
      .put(`/api/properties/update/${listing._id}`)
      .set("Authorization", `Bearer ${signToken(developer)}`)
      .send({ price: 1 });

    expect(res.status).toBe(404);
  });
});
