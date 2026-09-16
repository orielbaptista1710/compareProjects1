// backend/fakeTests/customerActivityHeart.test.js
//
// heartProperties previously had no server-side cap at all (unlike the
// existing 4-item cap on compareProperties), so a scripted/abusive client
// could grow a customer document unbounded. These tests cover the new
// MAX_HEART_PROPERTIES cap in POST /toggle-heart/:propertyId.
//
// toggle-heart's response also changed from a populated `heartProperties`
// array to a plain `heartedIds` array of strings — it no longer runs a
// second query to fetch full Property documents just to report which ids
// are hearted (see the route file for why).
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest"; 
import mongoose from "mongoose";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock("../config/firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken }),
  },
}));

const { default: app } = await import("./helpers/customerActivityApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer, createProperty } = await import("./helpers/fixtures.js");

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

function tokenFor(uid) {
  verifyIdToken.mockImplementation(async (t) => {
    if (t !== `token-for-${uid}`) throw new Error("bad token");
    return { uid };
  });
  return `token-for-${uid}`;
}

describe("POST /api/customerActivity/toggle-heart/:propertyId", () => {
  it("hearts a property when under the cap", async () => {
    const prop = await createProperty();
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .post(`/api/customerActivity/toggle-heart/${prop._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isHearted).toBe(true);
    expect(res.body.heartedIds).toEqual([prop._id.toString()]);
  });

  it("rejects adding a new property once at the 200-item cap", async () => {
    const existingIds = Array.from({ length: 200 }, () => new mongoose.Types.ObjectId());
    const customer = await createCustomer({ heartProperties: existingIds });
    const newProp = await createProperty();
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .post(`/api/customerActivity/toggle-heart/${newProp._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/200/);
  });

  it("still allows un-hearting (removal) even when already at the cap", async () => {
    const alreadyHearted = await createProperty();
    const existingIds = Array.from({ length: 199 }, () => new mongoose.Types.ObjectId());
    const customer = await createCustomer({
      heartProperties: [...existingIds, alreadyHearted._id],
    });
    const token = tokenFor(customer.firebaseUid);

    const res = await request(app)
      .post(`/api/customerActivity/toggle-heart/${alreadyHearted._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isHearted).toBe(false);
    // heartedIds is always the raw id array now (no populate), so this is
    // safe to assert directly even though the 199 filler ids are synthetic
    // and don't correspond to real Property documents.
    expect(res.body.heartedIds).toHaveLength(199);
    expect(res.body.heartedIds).not.toContain(alreadyHearted._id.toString());
  });
});
