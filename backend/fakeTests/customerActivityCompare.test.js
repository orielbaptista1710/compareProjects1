// backend/fakeTests/customerActivityCompare.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

// protectCustomer verifies Firebase ID tokens via firebase-admin, which we don't
// want to hit for real in tests. verifyIdToken is shared between the mock factory
// (via vi.hoisted, since factories can't close over normal module-scope consts)
// and the test bodies below, which configure what each "token" resolves to.
const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock("../config/firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken }),
  },
}));

const { default: app } = await import("./helpers/customerActivityApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer, createProperty, createUser } = await import("./helpers/fixtures.js");
const { default: Customer } = await import("../models/Customer.js");

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
});

// Any bearer token authenticates as this Firebase uid, for tests that just need
// *a* valid session rather than testing auth itself.
function tokenFor(uid) {
  verifyIdToken.mockImplementation(async (t) => {
    if (t !== `token-for-${uid}`) throw new Error("bad token");
    return { uid };
  });
  return `token-for-${uid}`;
}

describe("GET /api/customerActivity/my-activity", () => {
  it("401s with no token", async () => {
    const res = await request(app).get("/api/customerActivity/my-activity");
    expect(res.status).toBe(401);
  });

  it("401s when the Firebase token is invalid", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid token"));

    const res = await request(app)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", "Bearer garbage");

    expect(res.status).toBe(401);
  });

  it("401s when the token is valid but no Customer document matches its uid", async () => {
    verifyIdToken.mockResolvedValue({ uid: "no-such-customer" });

    const res = await request(app)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", "Bearer whatever");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/customer not found/i);
  });

  it("returns the customer's saved heart and compare properties", async () => {
    const propA = await createProperty({ title: "Prop A" });
    const propB = await createProperty({ title: "Prop B" });
    const customer = await createCustomer({
      heartProperties: [propA._id],
      compareProperties: [propB._id],
    });
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.heartedIds).toEqual([propA._id.toString()]);
    expect(res.body.heartProperties).toHaveLength(1);
    expect(res.body.heartProperties[0].title).toBe("Prop A");
    expect(res.body.compareProperties).toHaveLength(1);
    expect(res.body.compareProperties[0].title).toBe("Prop B");
  });

  it("paginates heartProperties (default page size 20) while heartedIds stays the full list", async () => {
    const developer = await createUser();
    const props = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        createProperty({ title: `Prop ${i}`, userId: developer._id })
      )
    );
    const customer = await createCustomer({ heartProperties: props.map((p) => p._id) });
    const token = tokenFor(customer.firebaseUid);

    const page1 = await request(app)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page1.body.heartedIds).toHaveLength(25);
    expect(page1.body.heartProperties).toHaveLength(20);
    expect(page1.body.heartPagination).toEqual({ page: 1, limit: 20, total: 25, hasMore: true });
    // Order matches the customer's stored array order (Prop 0 first), not
    // insertion/_id order from the $in query.
    expect(page1.body.heartProperties[0].title).toBe("Prop 0");
    expect(page1.body.heartProperties[19].title).toBe("Prop 19");

    const page2 = await request(app)
      .get("/api/customerActivity/my-activity?heartPage=2")
      .set("Authorization", `Bearer ${token}`);

    expect(page2.status).toBe(200);
    expect(page2.body.heartProperties).toHaveLength(5);
    expect(page2.body.heartProperties[0].title).toBe("Prop 20");
    expect(page2.body.heartPagination).toEqual({ page: 2, limit: 20, total: 25, hasMore: false });
  });

  it("clamps ?heartLimit server-side instead of trusting the client", async () => {
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .get("/api/customerActivity/my-activity?heartLimit=1000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.heartPagination.limit).toBe(50);
  });
});

describe("PUT /api/customerActivity/compare", () => {
  it("401s with no token", async () => {
    const res = await request(app)
      .put("/api/customerActivity/compare")
      .send({ propertyIds: [] });

    expect(res.status).toBe(401);
  });

  it("400s when propertyIds is not an array", async () => {
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .put("/api/customerActivity/compare")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyIds: "not-an-array" });

    expect(res.status).toBe(400);
  });

  it("silently drops ids that aren't valid ObjectIds instead of erroring", async () => {
    const prop = await createProperty();
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .put("/api/customerActivity/compare")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyIds: [prop._id.toString(), "not-a-valid-id"] });

    expect(res.status).toBe(200);
    expect(res.body.compareProperties).toHaveLength(1);
    expect(res.body.compareProperties[0]._id).toBe(prop._id.toString());
  });

  it("caps the compare list at 4 server-side even if the client sends more (don't trust the client)", async () => {
    // Share one developer across properties instead of letting createProperty mint a
    // fresh User (and bcrypt-hash a password) per call — 6 parallel bcrypt hashes was
    // slow enough to blow past the default test timeout.
    const developer = await createUser();
    const props = await Promise.all(
      Array.from({ length: 6 }, () => createProperty({ userId: developer._id }))
    );
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .put("/api/customerActivity/compare")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyIds: props.map((p) => p._id.toString()) });

    expect(res.status).toBe(200);
    expect(res.body.compareProperties).toHaveLength(4);

    const stored = await Customer.findById(customer._id);
    expect(stored.compareProperties).toHaveLength(4);
  });

  it("fully replaces the previously saved compare list rather than merging into it", async () => {
    // This is exactly the semantics the frontend's CompareSync login-merge race
    // depended on getting right: PUT overwrites wholesale, so a merge sent before
    // the real server list has loaded silently discards whatever was there before.
    const oldProp = await createProperty({ title: "Old" });
    const newProp = await createProperty({ title: "New" });
    const customer = await createCustomer({ compareProperties: [oldProp._id] });
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .put("/api/customerActivity/compare")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyIds: [newProp._id.toString()] });

    expect(res.status).toBe(200);
    const ids = res.body.compareProperties.map((p) => p._id);
    expect(ids).toEqual([newProp._id.toString()]);
    expect(ids).not.toContain(oldProp._id.toString());
  });
});
