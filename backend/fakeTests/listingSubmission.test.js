// A new listing sent twice (double click, a retry after a timeout) is created
// once (FORM-11). The form sends a random submissionId and reuses it when it
// sends again; the API hands back the listing that id already created.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer, createUser, createProperty, signToken } = await import("./helpers/fixtures.js");
const { default: Property } = await import("../models/Property.js");

verifyIdToken.mockImplementation(async (token) => {
  if (!token.startsWith("token-for-")) {
    throw Object.assign(new Error("bad token"), { code: "auth/argument-error" });
  }
  return { uid: token.slice("token-for-".length) };
});

beforeAll(async () => {
  await startTestDb();
  await Property.createIndexes(); // the unique submission index
});
afterAll(stopTestDb);
afterEach(clearTestDb);

const LISTING = {
  title: "2 BHK Flat in Andheri West, Mumbai",
  propertyType: "Flats/Apartments",
  description: "Sunny two bedroom flat near the station.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri West",
  address: "12 Test Road",
  pincode: "400053",
  price: 9500000,
  furnishing: "Unfurnished",
};
const DEVELOPER_LISTING = { ...LISTING, possessionStatus: "Ready to Move", developerName: "Dev Co", unitsAvailable: 4 };

const owner = () => createCustomer({ emailVerified: true });
const post = (customer, body) =>
  request(app).post("/api/customers/listings").set("Authorization", `Bearer token-for-${customer.firebaseUid}`).send(body);

describe("sending a new listing twice", () => {
  it("creates it once and returns the same listing the second time", async () => {
    const customer = await owner();
    const submissionId = randomUUID();

    const first = await post(customer, { ...LISTING, submissionId });
    const second = await post(customer, { ...LISTING, submissionId });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.replayed).toBe(true);
    expect(second.body.property._id).toBe(first.body.property._id);
    expect(await Property.countDocuments()).toBe(1);
  });

  it("creates it once when both copies arrive at the same moment", async () => {
    const customer = await owner();
    const submissionId = randomUUID();

    const responses = await Promise.all([
      post(customer, { ...LISTING, submissionId }),
      post(customer, { ...LISTING, submissionId }),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(await Property.countDocuments()).toBe(1);
  });

  it("returns the earlier listing even when the pending limit is now reached", async () => {
    const customer = await owner();
    const submissionId = randomUUID();
    const first = await post(customer, { ...LISTING, submissionId });
    // Nine more pending listings: the cap of 10 is reached
    for (let i = 0; i < 9; i++) {
      await createProperty({ userId: customer._id, ownerModel: "Customer", listedBy: "owner", status: "pending" });
    }

    const retry = await post(customer, { ...LISTING, submissionId });

    expect(retry.status).toBe(200);
    expect(retry.body.property._id).toBe(first.body.property._id);
  });

  it("works for developers too", async () => {
    const token = signToken(await createUser());
    const submissionId = randomUUID();
    const send = () =>
      request(app).post("/api/properties/add").set("Authorization", `Bearer ${token}`).send({ ...DEVELOPER_LISTING, submissionId });

    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(200);
    expect(await Property.countDocuments()).toBe(1);
  });
});

describe("what a submissionId can't do", () => {
  it("never returns another account's listing", async () => {
    const submissionId = randomUUID();
    const first = await post(await owner(), { ...LISTING, submissionId });

    const other = await post(await owner(), { ...LISTING, submissionId });

    expect(other.status).toBe(201);
    expect(other.body.property._id).not.toBe(first.body.property._id);
    expect(await Property.countDocuments()).toBe(2);
  });

  it("creates separate listings for different ids, or no id", async () => {
    const customer = await owner();

    await post(customer, { ...LISTING, submissionId: randomUUID() });
    await post(customer, { ...LISTING, submissionId: randomUUID() });
    await post(customer, LISTING);
    await post(customer, LISTING);

    expect(await Property.countDocuments()).toBe(4);
  });

  it.each([
    ["a query operator", { $ne: null }],
    ["a non-UUID string", "not-a-uuid"],
    ["a number", 12345],
  ])("is ignored when it is %s", async (_, submissionId) => {
    const customer = await owner();
    await post(customer, LISTING); // a listing without an id, which { $ne: null } would match

    const res = await post(customer, { ...LISTING, submissionId });

    expect(res.status).toBe(201);
    expect(await Property.countDocuments()).toBe(2);
    const stored = await Property.find().select("+submissionId").lean();
    expect(stored.every((p) => p.submissionId === undefined)).toBe(true);
  });

  it("is never sent back to the poster", async () => {
    const customer = await owner();
    const submissionId = randomUUID();

    const created = await post(customer, { ...LISTING, submissionId });
    const replayed = await post(customer, { ...LISTING, submissionId });
    const list = await request(app)
      .get("/api/customers/listings")
      .set("Authorization", `Bearer token-for-${customer.firebaseUid}`);

    expect(created.body.property).not.toHaveProperty("submissionId");
    expect(replayed.body.property).not.toHaveProperty("submissionId");
    expect(list.body[0]).not.toHaveProperty("submissionId");
  });

  it("can't be set by an edit", async () => {
    const customer = await owner();
    const listing = await createProperty({ userId: customer._id, ownerModel: "Customer", listedBy: "owner" });

    await request(app)
      .put(`/api/customers/listings/${listing._id}`)
      .set("Authorization", `Bearer token-for-${customer.firebaseUid}`)
      .send({ price: 8000000, submissionId: randomUUID() });

    const stored = await Property.findById(listing._id).select("+submissionId").lean();
    expect(stored.submissionId).toBeUndefined();
  });

  it("needs a signed-in poster", async () => {
    const res = await request(app).post("/api/customers/listings").send({ ...LISTING, submissionId: randomUUID() });

    expect(res.status).toBe(401);
  });
});
