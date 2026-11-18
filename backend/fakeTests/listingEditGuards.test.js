// backend/fakeTests/listingEditGuards.test.js
//
// Phase 1 guards on editing a listing:
//   - type, BHK and location can't change once a listing has been approved
//   - an edit that sends a listing back to review counts toward the pending cap
//   - a form opened on an older version can't overwrite a newer save
//   - deactivating a developer hides their live listings, reactivating restores them
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createAdminUser, createCustomer, createProperty, createUser, signToken } = await import(
  "./helpers/fixtures.js"
);
const { default: Property } = await import("../models/Property.js");
const { deactivateDeveloper, reactivateDeveloper } = await import("../services/developerAccountService.js");

verifyIdToken.mockImplementation(async (token) => ({ uid: token.slice("token-for-".length) }));

beforeAll(startTestDb);
afterAll(stopTestDb);
afterEach(clearTestDb);

const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const owner = () => createCustomer({ emailVerified: true });
const customerListing = (customer, overrides = {}) =>
  createProperty({
    userId: customer._id,
    ownerModel: "Customer",
    listedBy: "owner",
    developerName: undefined,
    propertyType: "Flats/Apartments",
    bhk: 2,
    ...overrides,
  });
const editAsCustomer = (customer, listing, body) =>
  request(app).put(`/api/customers/listings/${listing._id}`).set("Authorization", bearer(customer)).send(body);
const saved = (listing) => Property.findById(listing._id).lean();

describe("fields locked after approval", () => {
  it.each([
    ["propertyType", { propertyType: "Villa" }],
    ["bhk", { bhk: 3 }],
    ["city", { city: "Pune" }],
    ["locality", { locality: "Bandra" }],
    ["pincode", { pincode: "400050" }],
    ["coordinates", { coordinates: { lat: 19.1, lng: 72.9 } }],
  ])("refuses a change to %s on an approved listing", async (field, body) => {
    const customer = await owner();
    const listing = await customerListing(customer, {
      status: "approved",
      coordinates: { lat: 19.0, lng: 72.8 },
    });

    const res = await editAsCustomer(customer, listing, body);

    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toMatch(/after approval/);
    expect((await saved(listing)).status).toBe("approved");
  });

  it("still lets price and area change (they go to review)", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "approved" });

    const res = await editAsCustomer(customer, listing, { price: 4500000, area: { value: 900, unit: "sqft" } });

    expect(res.status).toBe(200);
    expect((await saved(listing)).status).toBe("pending");
  });

  it("stays locked while an edit of an approved listing waits for review", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "pending", firstApprovedAt: new Date() });

    const res = await editAsCustomer(customer, listing, { city: "Pune" });

    expect(res.status).toBe(400);
  });

  it("knows older listings were approved from their review history", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, {
      status: "pending",
      reviewHistory: [{ action: "approved", at: new Date() }],
    });

    const res = await editAsCustomer(customer, listing, { bhk: 4 });

    expect(res.status).toBe(400);
  });

  it("allows filling in a location detail that was never set", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "approved" });

    const res = await editAsCustomer(customer, listing, { coordinates: { lat: 19.1, lng: 72.9 } });

    expect(res.status).toBe(200);
  });

  it("doesn't lock a listing that was never approved", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, {
      status: "rejected",
      reviewHistory: [{ action: "rejected", at: new Date() }],
    });

    const res = await editAsCustomer(customer, listing, { propertyType: "Villa", city: "Pune" });

    expect(res.status).toBe(200);
  });

  it("locks developer listings too", async () => {
    const developer = await createUser({ role: "developer" });
    const listing = await createProperty({ userId: developer._id, status: "approved" });

    const res = await request(app)
      .put(`/api/properties/update/${listing._id}`)
      .set("Authorization", `Bearer ${signToken(developer)}`)
      .send({ locality: "Juhu" });

    expect(res.status).toBe(400);
  });

  it("records the first approval and keeps it on later approvals", async () => {
    const admin = await createAdminUser();
    const auth = `Bearer ${signToken(admin)}`;
    const listing = await createProperty({ status: "pending" });

    await request(app).put(`/api/admin/approve/${listing._id}`).set("Authorization", auth).send({ version: 0 });
    const first = (await saved(listing)).firstApprovedAt;
    await Property.updateOne({ _id: listing._id }, { status: "pending" });
    await request(app).put(`/api/admin/approve/${listing._id}`).set("Authorization", auth).send({ version: 0 });

    expect(first).toBeInstanceOf(Date);
    expect((await saved(listing)).firstApprovedAt).toEqual(first);
  });
});

describe("pending cap on edits (FORM-12)", () => {
  it("refuses an edit that would send an 11th listing to review", async () => {
    const customer = await owner();
    await Promise.all(Array.from({ length: 10 }, () => customerListing(customer, { status: "pending" })));
    const live = await customerListing(customer, { status: "approved" });

    const res = await editAsCustomer(customer, live, { price: 4500000 });

    expect(res.status).toBe(429);
    expect((await saved(live)).status).toBe("approved");
  });

  it("still lets a pending listing be edited at the cap", async () => {
    const customer = await owner();
    const listings = await Promise.all(
      Array.from({ length: 10 }, () => customerListing(customer, { status: "pending" }))
    );

    const res = await editAsCustomer(customer, listings[0], { price: 4500000 });

    expect(res.status).toBe(200);
  });
});

describe("edits from an out-of-date form", () => {
  it("409s when the listing changed since the form opened it", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { contentVersion: 2 });

    const res = await editAsCustomer(customer, listing, { price: 4500000, expectedVersion: 1 });

    expect(res.status).toBe(409);
    expect((await saved(listing)).price).toBe(5000000);
  });

  it("saves when the form has the current version (none stored counts as 0)", async () => {
    const customer = await owner();
    const listing = await customerListing(customer);

    const res = await editAsCustomer(customer, listing, { price: 4500000, expectedVersion: 0 });

    expect(res.status).toBe(200);
    expect((await saved(listing)).contentVersion).toBe(1);
  });
});

describe("deactivating a developer account", () => {
  it("hides only their live listings and restores them on reactivation", async () => {
    const developer = await createUser({ role: "developer" });
    const other = await createUser({ role: "developer" });
    const live = await createProperty({ userId: developer._id, status: "approved" });
    const waiting = await createProperty({ userId: developer._id, status: "pending" });
    const othersLive = await createProperty({ userId: other._id, status: "approved" });

    const off = await deactivateDeveloper(developer.username);
    expect(off.listings).toBe(1);
    expect((await saved(live)).status).toBe("suspended");
    expect((await saved(waiting)).status).toBe("pending");
    expect((await saved(othersLive)).status).toBe("approved");

    const on = await reactivateDeveloper(developer.username);
    expect(on.listings).toBe(1);
    expect(on.user.isActive).toBe(true);
    expect((await saved(live)).status).toBe("approved");
  });

  it("keeps a deactivated developer's listing hidden when an admin approves it", async () => {
    const admin = await createAdminUser();
    const developer = await createUser({ role: "developer" });
    const waiting = await createProperty({ userId: developer._id, status: "pending" });
    await deactivateDeveloper(developer.username);

    const res = await request(app)
      .put(`/api/admin/approve/${waiting._id}`)
      .set("Authorization", `Bearer ${signToken(admin)}`)
      .send({ version: 0 });

    expect(res.status).toBe(200);
    expect((await saved(waiting)).status).toBe("suspended");
    await reactivateDeveloper(developer.username);
    expect((await saved(waiting)).status).toBe("approved");
  });

  it("returns null for an unknown username", async () => {
    expect(await deactivateDeveloper("nobody-here")).toBeNull();
  });
});
