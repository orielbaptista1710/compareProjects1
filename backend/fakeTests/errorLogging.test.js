// backend/fakeTests/errorLogging.test.js
//
// Errors must not leak internals to the client or customer contact details
// into the logs: 500s send a generic message, duplicate-key and validation
// errors log field names only, and a DB failure behind protectCustomer is a
// 500 (server problem), not a 401 (bad token).
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock("../config/firebaseAdmin.js", () => ({
  default: {
    auth: () => ({ verifyIdToken }),
  },
}));

const { default: customerApp } = await import("./helpers/customerRoutesApp.js");
const { default: activityApp } = await import("./helpers/customerActivityApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer } = await import("./helpers/fixtures.js");
const { default: Customer } = await import("../models/Customer.js");
const { default: logger } = await import("../utils/logger.js");
const { safeErrorMeta } = await import("../utils/safeError.js");

beforeAll(async () => {
  await startTestDb();
  await Customer.init(); // build the unique indexes so duplicates really fail
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await clearTestDb();
});

function tokenFor(uid) {
  verifyIdToken.mockImplementation(async (t) => {
    if (t !== `token-for-${uid}`) throw new Error("bad token");
    return { uid };
  });
  return `token-for-${uid}`;
}

const PHONE = "+919876543210";

describe("safeErrorMeta", () => {
  it("keeps only field names for a duplicate-key error", () => {
    const err = Object.assign(new Error(`E11000 duplicate key error dup key: { customerPhone: "${PHONE}" }`), {
      name: "MongoServerError",
      code: 11000,
      keyPattern: { customerPhone: 1 },
      keyValue: { customerPhone: PHONE },
    });

    const meta = safeErrorMeta(err);
    expect(meta.fields).toEqual(["customerPhone"]);
    expect(JSON.stringify(meta)).not.toContain("9876543210");
  });

  it("keeps only field names for a validation error", () => {
    const err = new Customer({ firebaseUid: "u1", customerName: "Asha", customerPhone: "not-a-phone-555" }).validateSync();

    const meta = safeErrorMeta(err);
    expect(meta.fields).toEqual(["customerPhone"]);
    expect(JSON.stringify(meta)).not.toContain("not-a-phone-555");
  });

  it("keeps message and stack for an ordinary bug", () => {
    const meta = safeErrorMeta(new TypeError("x is undefined"));
    expect(meta.message).toBe("x is undefined");
    expect(meta.stack).toBeTruthy();
  });
});

describe("customer routes logging", () => {
  it("a duplicate phone at signup is logged by field name, never the number", async () => {
    await createCustomer({ customerPhone: PHONE });
    const token = tokenFor("new-uid");
    const logged = vi.spyOn(logger, "error").mockImplementation(() => {});

    const res = await request(customerApp)
      .post("/api/customers/firebase-signup")
      .send({ token, customerName: "Asha", customerPhone: PHONE });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Phone number is already registered.");
    const logLine = JSON.stringify(logged.mock.calls);
    expect(logLine).toContain("customerPhone");
    expect(logLine).not.toContain("9876543210");
  });

  it("GET /my-activity hides the error text from the client on a 500", async () => {
    const customer = await createCustomer();
    const token = tokenFor(customer.firebaseUid);
    vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(Customer, "findById").mockImplementation(() => {
      throw new Error("connect ECONNREFUSED secret-host.mongodb.net:27017");
    });

    const res = await request(activityApp)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });
});

describe("protectCustomer", () => {
  it("500s (not 401) when the DB lookup fails after a valid token", async () => {
    verifyIdToken.mockResolvedValue({ uid: "some-uid" });
    vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(Customer, "findOne").mockRejectedValue(new Error("db down"));

    const res = await request(activityApp)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", "Bearer whatever");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("401s a rejected token and logs only the Firebase error code", async () => {
    verifyIdToken.mockRejectedValue(
      Object.assign(new Error("Decoding Firebase ID token failed"), { code: "auth/argument-error" })
    );
    const warned = vi.spyOn(logger, "warn").mockImplementation(() => {});

    const res = await request(activityApp)
      .get("/api/customerActivity/my-activity")
      .set("Authorization", "Bearer garbage");

    expect(res.status).toBe(401);
    expect(warned).toHaveBeenCalledWith("Customer token rejected", { code: "auth/argument-error" });
  });
});
