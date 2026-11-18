// backend/fakeTests/adminReviewQueue.test.js
//
// What an admin can see about posted and edited listings: edits to a reviewed
// listing come back as resubmissions (with what changed), a save that changes
// nothing doesn't re-queue anything, the queue can be sorted oldest-waiting
// first, and the pending badge has a counts endpoint.
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createAdminUser, createCustomer, createProperty, createUser, signToken, withVersions } = await import(
  "./helpers/fixtures.js"
);
const { default: Property } = await import("../models/Property.js");
const { clearCache } = await import("../utils/withCache.js");

verifyIdToken.mockImplementation(async (token) => {
  if (!token.startsWith("token-for-")) {
    throw Object.assign(new Error("bad token"), { code: "auth/argument-error" });
  }
  return { uid: token.slice("token-for-".length) };
});

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearCache); // the counts are cached for a few seconds
afterEach(clearTestDb);

const adminHeader = async () => `Bearer ${signToken(await createAdminUser({ displayName: "Admin Asha" }))}`;
const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const owner = () => createCustomer({ emailVerified: true });

const customerListing = (customer, overrides = {}) =>
  createProperty({
    userId: customer._id,
    ownerModel: "Customer",
    listedBy: "owner",
    developerName: undefined,
    ...overrides,
  });

const editAsCustomer = (customer, listing, body) =>
  request(app).put(`/api/customers/listings/${listing._id}`).set("Authorization", bearer(customer)).send(body);

const saved = (listing) => Property.findById(listing._id).lean();

describe("GET /api/admin/properties/counts", () => {
  it("401s without a token and 403s for a non-admin", async () => {
    const developer = await createUser({ role: "developer" });

    const anonymous = await request(app).get("/api/admin/properties/counts");
    const nonAdmin = await request(app)
      .get("/api/admin/properties/counts")
      .set("Authorization", `Bearer ${signToken(developer)}`);

    expect(anonymous.status).toBe(401);
    expect(nonAdmin.status).toBe(403);
  });

  it("counts every status, and how many pending listings are resubmissions", async () => {
    const auth = await adminHeader();
    await createProperty({ status: "pending" });
    await createProperty({ status: "pending" });
    await createProperty({ status: "pending", lastEditedAt: new Date() });
    await createProperty({ status: "approved" });
    await createProperty({ status: "rejected" });
    await createProperty({ status: "suspended" });

    const res = await request(app).get("/api/admin/properties/counts").set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pending: 3, approved: 1, rejected: 1, suspended: 1, pendingEdited: 1 });
  });

  it("reflects a review straight away, not after the cache expires", async () => {
    const auth = await adminHeader();
    const listing = await createProperty({ status: "pending" });
    await request(app).get("/api/admin/properties/counts").set("Authorization", auth);

    await request(app).put(`/api/admin/approve/${listing._id}`).send({ version: 0 }).set("Authorization", auth);
    const res = await request(app).get("/api/admin/properties/counts").set("Authorization", auth);

    expect(res.body.pending).toBe(0);
    expect(res.body.approved).toBe(1);
  });
});

describe("review queue order", () => {
  it("sortBy=waiting lists the listing that has waited longest first", async () => {
    const auth = await adminHeader();
    await createProperty({ title: "Newest", submittedAt: new Date("2026-03-01") });
    await createProperty({ title: "Oldest", submittedAt: new Date("2026-01-01") });
    await createProperty({ title: "Middle", submittedAt: new Date("2026-02-01") });

    const res = await request(app)
      .get("/api/admin/properties")
      .query({ status: "pending", sortBy: "waiting" })
      .set("Authorization", auth);

    expect(res.body.data.map((p) => p.title)).toEqual(["Oldest", "Middle", "Newest"]);
  });

  it("an unknown sortBy still falls back to newest first (no error)", async () => {
    const auth = await adminHeader();
    await createProperty({ title: "A" });
    await createProperty({ title: "B" });

    const res = await request(app).get("/api/admin/properties").query({ sortBy: "nonsense" }).set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.title)).toEqual(["B", "A"]);
  });
});

describe("editing a listing that was already reviewed (a resubmission)", () => {
  it("goes back to pending, records when and what changed, and clears the old decision's fields", async () => {
    const customer = await owner();
    const reviewer = await createAdminUser();
    const listing = await customerListing(customer, {
      status: "approved",
      submittedAt: new Date("2026-01-01"),
      reviewedAt: new Date("2026-01-02"),
      reviewedBy: reviewer._id,
      rejectionReason: "Old reason",
      reviewHistory: [{ action: "approved", by: reviewer._id, at: new Date("2026-01-02") }],
    });

    const res = await editAsCustomer(customer, listing, { price: 9000000, title: "A better title for the flat" });

    expect(res.status).toBe(200);
    const after = await saved(listing);
    expect(after.status).toBe("pending");
    expect(after.submittedAt.getTime()).toBeGreaterThan(new Date("2026-06-01").getTime());
    expect(after.lastEditedAt).toBeTruthy();
    expect([...after.changedFields].sort()).toEqual(["price", "title"]);
    // Describes the version that was just edited, so it goes
    expect(after.rejectionReason).toBeUndefined();
    expect(after.reviewedAt).toBeUndefined();
    expect(after.reviewedBy).toBeUndefined();
    // ...but the decision itself is still on record
    expect(after.reviewHistory).toHaveLength(1);
    expect(after.reviewHistory[0].action).toBe("approved");
  });

  it("works the same for a rejected listing, keeping the rejection in the history", async () => {
    const customer = await owner();
    const reviewer = await createAdminUser();
    const listing = await customerListing(customer, {
      status: "rejected",
      rejectionReason: "Blurry photos",
      reviewedAt: new Date(),
      reviewedBy: reviewer._id,
      reviewHistory: [{ action: "rejected", by: reviewer._id, at: new Date(), reason: "Blurry photos" }],
    });

    await editAsCustomer(customer, listing, { description: "A much clearer description of this flat." });

    const after = await saved(listing);
    expect(after.status).toBe("pending");
    expect(after.rejectionReason).toBeUndefined();
    expect(after.changedFields).toEqual(["description"]);
    expect(after.reviewHistory[0].reason).toBe("Blurry photos");
  });

  it("works for a developer's listing too", async () => {
    const developer = await createUser({ role: "developer" });
    const listing = await createProperty({ userId: developer._id, status: "approved", reviewedAt: new Date() });

    const res = await request(app)
      .put(`/api/properties/update/${listing._id}`)
      .set("Authorization", `Bearer ${signToken(developer)}`)
      .send({ price: 1234567 });

    expect(res.status).toBe(200);
    const after = await saved(listing);
    expect(after.status).toBe("pending");
    expect(after.changedFields).toEqual(["price"]);
    expect(after.lastEditedAt).toBeTruthy();
  });

  it("can't be forged: the client can't set the resubmission fields", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "approved", reviewedAt: new Date() });

    await editAsCustomer(customer, listing, {
      title: "A genuinely new title here",
      changedFields: ["bogus"],
      lastEditedAt: "2000-01-01",
      submittedAt: "2000-01-01",
    });

    const after = await saved(listing);
    expect(after.changedFields).toEqual(["title"]);
    expect(after.submittedAt.getFullYear()).toBeGreaterThan(2020);
    expect(after.lastEditedAt.getFullYear()).toBeGreaterThan(2020);
  });

  it("an edit to a listing that was never reviewed keeps its place in the queue and isn't marked edited", async () => {
    const customer = await owner();
    const submittedAt = new Date("2026-01-05");
    const listing = await customerListing(customer, { status: "pending", submittedAt });

    await editAsCustomer(customer, listing, { title: "Fixed a typo in my title" });

    const after = await saved(listing);
    expect(after.status).toBe("pending");
    expect(after.title).toBe("Fixed a typo in my title");
    expect(after.submittedAt.getTime()).toBe(submittedAt.getTime());
    expect(after.lastEditedAt).toBeUndefined();
    expect(after.changedFields).toEqual([]);
  });
});

describe("saving without changing anything", () => {
  it("leaves a live listing live and out of the review queue", async () => {
    const customer = await owner();
    const submittedAt = new Date("2026-01-01");
    const listing = await customerListing(customer, { status: "approved", submittedAt });

    const res = await editAsCustomer(customer, listing, { price: listing.price, title: listing.title });

    expect(res.status).toBe(200);
    expect(res.body.unchanged).toBe(true);
    const after = await saved(listing);
    expect(after.status).toBe("approved");
    expect(after.submittedAt.getTime()).toBe(submittedAt.getTime());
    expect(after.lastEditedAt).toBeUndefined();
  });

  it("doesn't mistake nested values for changes (area, coordinates)", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, {
      status: "approved",
      area: { value: 900, unit: "sqft" },
      coordinates: { lat: 19.1, lng: 72.8, source: "manual" },
    });

    const res = await editAsCustomer(customer, listing, {
      area: { value: 900, unit: "sqft" },
      coordinates: { lat: 19.1, lng: 72.8 },
    });

    expect(res.body.unchanged).toBe(true);
    expect((await saved(listing)).status).toBe("approved");
  });

  it("treats an emptied optional field as unchanged when it was already empty", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "approved" });

    const res = await editAsCustomer(customer, listing, { long_description: "", reraNumber: "" });

    expect(res.body.unchanged).toBe(true);
  });

  it("still sees a real change to a nested value", async () => {
    const customer = await owner();
    const listing = await customerListing(customer, { status: "approved", area: { value: 900, unit: "sqft" } });

    const res = await editAsCustomer(customer, listing, { area: { value: 950, unit: "sqft" } });

    expect(res.body.unchanged).toBeUndefined();
    expect((await saved(listing)).changedFields).toEqual(["area"]);
  });
});

describe("what the admin sees", () => {
  it("the list marks resubmissions with lastEditedAt, and the details show what changed and who decided before", async () => {
    const auth = await adminHeader();
    const reviewer = await createAdminUser({ displayName: "Reviewer Ravi" });
    const customer = await owner();
    const edited = await customerListing(customer, {
      status: "approved",
      reviewedAt: new Date(),
      reviewHistory: [{ action: "approved", by: reviewer._id, at: new Date() }],
    });
    const fresh = await customerListing(customer, { status: "pending" });
    await editAsCustomer(customer, edited, { price: 8000000 });

    const list = await request(app).get("/api/admin/properties").query({ status: "pending" }).set("Authorization", auth);
    const byId = Object.fromEntries(list.body.data.map((p) => [String(p._id), p]));
    expect(byId[String(edited._id)].lastEditedAt).toBeTruthy();
    expect(byId[String(fresh._id)].lastEditedAt).toBeUndefined();

    const detail = await request(app).get(`/api/admin/property/${edited._id}`).set("Authorization", auth);
    expect(detail.body.data.changedFields).toEqual(["price"]);
    expect(detail.body.data.reviewHistory[0].by.displayName).toBe("Reviewer Ravi");
  });
});

describe("admin property-type filter", () => {
  it.each(["Villa", "Plot", "Industrial Building", "Shop/Showroom"])("accepts %s", async (propertyType) => {
    const auth = await adminHeader();

    const res = await request(app).get("/api/admin/properties").query({ propertyType }).set("Authorization", auth);

    expect(res.status).toBe(200);
  });

  it.each(["Penthouse", "Builder Floor", "Commercial"])(
    "rejects %s: the model has no such type, so no listing can match it",
    async (propertyType) => {
      const auth = await adminHeader();

      const res = await request(app).get("/api/admin/properties").query({ propertyType }).set("Authorization", auth);

      expect(res.status).toBe(400);
    }
  );
});

describe("bulk approve counts", () => {
  it("'hidden' is how many of the approved listings stay hidden (suspended agent), not how many were attempted", async () => {
    const auth = await adminHeader();
    const suspended = await createCustomer({ emailVerified: true, agent: { status: "suspended" } });
    await customerListing(suspended, { status: "pending", listedBy: "agent" });
    const normal = await createProperty({ status: "pending" });
    const heldListing = await Property.findOne({ ownerModel: "Customer" });

    const res = await request(app)
      .put("/api/admin/bulk-approve")
      .set("Authorization", auth)
      .send(withVersions({ ids: [String(normal._id), String(heldListing._id)] }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ matched: 2, modified: 2, hidden: 1 });
    expect((await saved(heldListing)).status).toBe("suspended");
    expect((await saved(normal)).status).toBe("approved");
  });
});

describe("self-review is part of the single update", () => {
  it("403s an admin approving their own listing and leaves it untouched", async () => {
    const admin = await createAdminUser();
    const own = await createProperty({ status: "pending", userId: admin._id });

    const res = await request(app)
      .put(`/api/admin/approve/${own._id}`).send({ version: 0 })
      .set("Authorization", `Bearer ${signToken(admin)}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot review a property you submitted/i);
    expect((await saved(own)).status).toBe("pending");
  });
});
