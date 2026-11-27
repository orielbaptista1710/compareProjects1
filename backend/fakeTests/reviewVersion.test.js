// An admin can only decide on the version of a listing they saw (FORM-02).
// Every real edit raises the listing's contentVersion; approve and reject
// carry the version the admin was looking at and are refused (409) when the
// poster has edited since. The poster's own save is refused the same way when
// a review or another edit lands between its read and its write.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { CONSENT, createAdminUser, createCustomer, createProperty, signToken } = await import("./helpers/fixtures.js");
const { default: Property } = await import("../models/Property.js");

verifyIdToken.mockImplementation(async (token) => {
  if (!token.startsWith("token-for-")) {
    throw Object.assign(new Error("bad token"), { code: "auth/argument-error" });
  }
  return { uid: token.slice("token-for-".length) };
});

beforeAll(startTestDb);
afterAll(stopTestDb);
afterEach(async () => {
  vi.restoreAllMocks();
  await clearTestDb();
});

const adminHeader = async () => `Bearer ${signToken(await createAdminUser())}`;
const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const owner = () => createCustomer({ emailVerified: true });
const ownerListing = (customer, overrides = {}) =>
  createProperty({ userId: customer._id, ownerModel: "Customer", listedBy: "owner", developerName: undefined, ...overrides });

const edit = (customer, listing, body) =>
  request(app).put(`/api/customers/listings/${listing._id}`).set("Authorization", bearer(customer)).send({ ...CONSENT, ...body });
const approve = (auth, listing, body) =>
  request(app).put(`/api/admin/approve/${listing._id}`).set("Authorization", auth).send(body);
const reject = (auth, listing, body) =>
  request(app).put(`/api/admin/reject/${listing._id}`).set("Authorization", auth).send(body);
const saved = (listing) => Property.findById(listing._id).lean();

// Runs `meanwhile` after the controller has read the listing and before it
// saves it, as if someone else acted in between.
const betweenReadAndSave = (meanwhile) => {
  const original = Property.findOne.bind(Property);
  vi.spyOn(Property, "findOne").mockImplementationOnce((...args) => {
    const query = original(...args);
    return {
      then: (resolve, reject_) =>
        query
          .exec()
          .then(async (doc) => {
            await meanwhile();
            return doc;
          })
          .then(resolve, reject_),
    };
  });
};

describe("the listing's version", () => {
  it("goes up on every edit that changes something, and not on one that doesn't", async () => {
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending", title: "First title" });
    expect((await saved(listing)).contentVersion).toBe(0);

    await edit(customer, listing, { title: "Second title" });
    expect((await saved(listing)).contentVersion).toBe(1);

    await edit(customer, listing, { title: "Second title" }); // no change
    expect((await saved(listing)).contentVersion).toBe(1);
  });

  it("can't be set by the poster", async () => {
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending" });

    await edit(customer, listing, { title: "New title here", contentVersion: 99 });

    expect((await saved(listing)).contentVersion).toBe(1);
  });

  it("is in the admin list, so the table can send it back", async () => {
    const auth = await adminHeader();
    await createProperty({ status: "pending", contentVersion: 3 });

    const res = await request(app).get("/api/admin/properties").set("Authorization", auth);

    expect(res.body.data[0].contentVersion).toBe(3);
  });
});

describe("approve and reject", () => {
  it("409 when the poster edited after the admin opened the listing, and nothing is decided", async () => {
    const auth = await adminHeader();
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending", title: "Clean title" });
    // The admin loads version 0, then the poster edits
    await edit(customer, listing, { title: "Edited after the admin looked" });

    for (const send of [approve, reject]) {
      const res = await send(auth, listing, { version: 0, rejectionReason: "No photos" });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/edited after you opened it/i);
    }

    const after = await saved(listing);
    expect(after.status).toBe("pending");
    expect(after.reviewedAt).toBeUndefined();
    expect(after.reviewHistory).toEqual([]);
  });

  it("goes through for the version the admin saw", async () => {
    const auth = await adminHeader();
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending" });
    await edit(customer, listing, { title: "Edited before the admin looked" });

    const res = await approve(auth, listing, { version: 1 });

    expect(res.status).toBe(200);
    expect((await saved(listing)).status).toBe("approved");
  });

  it("treats a listing saved before versions existed as version 0", async () => {
    const auth = await adminHeader();
    const listing = await createProperty({ status: "pending" });
    await Property.collection.updateOne({ _id: listing._id }, { $unset: { contentVersion: "" } });

    const res = await approve(auth, listing, { version: 0 });

    expect(res.status).toBe(200);
  });

  it.each([
    ["missing", {}],
    ["negative", { version: -1 }],
    ["not a number", { version: "abc" }],
    ["a fraction", { version: 1.5 }],
  ])("400 when the version is %s", async (_, body) => {
    const auth = await adminHeader();
    const listing = await createProperty({ status: "pending" });

    const res = await approve(auth, listing, body);

    expect(res.status).toBe(400);
    expect((await saved(listing)).status).toBe("pending");
  });
});

describe("bulk approve and reject", () => {
  it("skips a listing edited since the admin's page loaded, counts it, and decides the rest", async () => {
    const auth = await adminHeader();
    const customer = await owner();
    const untouched = await ownerListing(customer, { status: "pending" });
    const edited = await ownerListing(customer, { status: "pending", title: "Clean title" });
    const versions = { [untouched._id]: 0, [edited._id]: 0 };
    await edit(customer, edited, { title: "Edited after the page loaded" });

    const res = await request(app)
      .put("/api/admin/bulk-approve")
      .set("Authorization", auth)
      .send({ ids: [String(untouched._id), String(edited._id)], versions });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ modified: 1, changed: 1 });
    expect((await saved(untouched)).status).toBe("approved");
    expect((await saved(edited)).status).toBe("pending");
  });

  it("decides nothing for a listing sent without a version", async () => {
    const auth = await adminHeader();
    const listing = await createProperty({ status: "pending" });

    const res = await request(app)
      .put("/api/admin/bulk-reject")
      .set("Authorization", auth)
      .send({ ids: [String(listing._id)], rejectionReason: "Blurry photos" });

    expect(res.body).toMatchObject({ modified: 0, changed: 1 });
    expect((await saved(listing)).status).toBe("pending");
  });
});

describe("the poster's save", () => {
  it("409 when an approve lands between reading and saving: the new content is not approved", async () => {
    const auth = await adminHeader();
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending", title: "Reviewed title" });

    betweenReadAndSave(async () => {
      const res = await approve(auth, listing, { version: 0 });
      expect(res.status).toBe(200);
    });
    const res = await edit(customer, listing, { title: "Swapped in after review" });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/changed while you were editing/i);
    const after = await saved(listing);
    expect(after.status).toBe("approved");
    expect(after.title).toBe("Reviewed title");
  });

  it("409 when another edit (a second tab) lands first, keeping that edit", async () => {
    const customer = await owner();
    const listing = await ownerListing(customer, { status: "pending", title: "Original title" });

    betweenReadAndSave(() =>
      Property.updateOne({ _id: listing._id }, { title: "Saved from the other tab", contentVersion: 1 })
    );
    const res = await edit(customer, listing, { title: "Saved from this tab" });

    expect(res.status).toBe(409);
    expect((await saved(listing)).title).toBe("Saved from the other tab");
  });
});
