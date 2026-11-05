// backend/fakeTests/agentApplication.test.js
//
// Agent status only comes from /agent-signup (firebase-signup with
// agentApplication, on a brand-new account); a rejected agent may re-apply
// (/api/customers/agent-application); a customer account never becomes an
// agent. An admin approves (verified email only), rejects or suspends them
// (/api/admin/agents). Only an approved agent's new listings are 'agent'.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { createCustomer, createUser, createAdminUser, createProperty, signToken } = await import("./helpers/fixtures.js");
const { default: Customer } = await import("../models/Customer.js");
const { default: Property } = await import("../models/Property.js");

const acceptTestTokens = () =>
  verifyIdToken.mockImplementation(async (token) => ({ uid: token.slice("token-for-".length) }));

beforeAll(startTestDb);
afterAll(stopTestDb);
afterEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
  acceptTestTokens();
});
acceptTestTokens();

const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const APPLICATION = { agencyName: "Prime Realty", reraAgentId: "A51800012345" };

const apply = (customer, body = APPLICATION) =>
  request(app).post("/api/customers/agent-application").set("Authorization", bearer(customer)).send(body);

const adminAuth = async () => `Bearer ${signToken(await createAdminUser())}`;

const signup = (uid, body = {}) =>
  request(app)
    .post("/api/customers/firebase-signup")
    .send({ token: `token-for-${uid}`, customerName: "Ravi", customerPhone: "+919800000001", ...body });

describe("POST /api/customers/firebase-signup with agentApplication (/agent-signup)", () => {
  it("creates a new account as a pending agent, shown on /me", async () => {
    const res = await signup("new-agent", { agentApplication: APPLICATION });
    const me = await request(app).get("/api/customers/me").set("Authorization", "Bearer token-for-new-agent");

    expect(res.status).toBe(200);
    expect(res.body.customer.agent).toMatchObject({ status: "pending", ...APPLICATION });
    expect(res.body.customer.agent.appliedAt).toBeTruthy();
    expect(me.body.customer.agent.status).toBe("pending");
    expect(me.body.customer.isActive).toBe(true);
  });

  it("stores the name as plain text and rejects a non-text name (400)", async () => {
    const res = await signup("tagged-name", { customerName: "Ravi <script>alert(1)</script>" });
    const bad = await signup("object-name", { customerName: { $gt: "" } });

    expect(res.status).toBe(200);
    expect(res.body.customer.customerName).toBe("Ravi");
    expect(bad.status).toBe(400);
  });

  it("refuses signup for a suspended account, so it can't change its profile (403)", async () => {
    const customer = await createCustomer({ isActive: false, customerName: "Original" });

    const res = await signup(customer.firebaseUid, { customerName: "Changed" });

    expect(res.status).toBe(403);
    expect((await Customer.findById(customer._id).lean()).customerName).toBe("Original");
  });

  it("a plain customer signup stays a customer (agent status 'none')", async () => {
    const res = await signup("new-owner");

    expect(res.status).toBe(200);
    expect(res.body.customer.agent.status).toBe("none");
  });

  it("never turns an existing customer account into an agent (409)", async () => {
    const customer = await createCustomer();

    const res = await signup(customer.firebaseUid, { agentApplication: APPLICATION });

    expect(res.status).toBe(409);
    const saved = await Customer.findById(customer._id).lean();
    expect(saved.agent?.status ?? "none").toBe("none");
  });

  it("rejects a missing agency name or RERA id without creating the account (400)", async () => {
    const res = await signup("bad-agent", { agentApplication: { agencyName: "" } });

    expect(res.status).toBe(400);
    expect(await Customer.exists({ firebaseUid: "bad-agent" })).toBeNull();
  });
});

describe("POST /api/customers/agent-application (re-apply)", () => {
  it("is refused for a customer account — customers can't become agents (403)", async () => {
    const customer = await createCustomer();

    const res = await apply(customer);

    expect(res.status).toBe(403);
    const saved = await Customer.findById(customer._id).lean();
    expect(saved.agent?.status ?? "none").toBe("none");
  });

  it("can't apply again while pending (409)", async () => {
    const customer = await createCustomer({ agent: { status: "pending" } });

    const res = await apply(customer);

    expect(res.status).toBe(409);
  });

  it("rejects a missing agency name or RERA id (400)", async () => {
    const customer = await createCustomer({ agent: { status: "rejected" } });

    const res = await apply(customer, { agencyName: "" });

    expect(res.status).toBe(400);
  });

  it("lets a rejected applicant re-apply and clears the old reason", async () => {
    const customer = await createCustomer({ agent: { status: "rejected", rejectionReason: "RERA id not found" } });

    const res = await apply(customer);

    expect(res.status).toBe(200);
    const saved = await Customer.findById(customer._id).lean();
    expect(saved.agent.status).toBe("pending");
    expect(saved.agent.rejectionReason).toBeUndefined();
  });
});

describe("/api/admin/agents", () => {
  it("lists pending applications oldest first", async () => {
    const auth = await adminAuth();
    await createCustomer({ customerName: "Second", agent: { status: "pending", appliedAt: new Date("2026-02-01") } });
    await createCustomer({ customerName: "First", agent: { status: "pending", appliedAt: new Date("2026-01-01") } });
    await createCustomer({ customerName: "Not an agent" });

    const res = await request(app).get("/api/admin/agents").set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((c) => c.customerName)).toEqual(["First", "Second"]);
  });

  it("approving makes the customer's new listings 'agent' listings", async () => {
    const auth = await adminAuth();
    const customer = await createCustomer({ emailVerified: true, agent: { status: "pending" } });

    const review = await request(app).put(`/api/admin/agents/${customer._id}/approve`).set("Authorization", auth);
    const post = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(customer))
      .send({
        title: "Office in BKC",
        description: "Grade A office space.",
        state: "Maharashtra",
        city: "Mumbai",
        locality: "BKC",
        address: "1 Test Road",
        pincode: "400051",
        price: 50000000,
        propertyType: "Villa",
      });

    expect(review.status).toBe(200);
    expect(review.body.customer.agent.status).toBe("approved");
    expect(review.body.customer.agent.reviewedBy).toBeTruthy();
    expect(post.status).toBe(201);
    expect(post.body.property.listedBy).toBe("agent");
  });

  it("won't approve an agent who hasn't verified their email (409)", async () => {
    const auth = await adminAuth();
    const customer = await createCustomer({ emailVerified: false, agent: { status: "pending" } });

    const res = await request(app).put(`/api/admin/agents/${customer._id}/approve`).set("Authorization", auth);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/verified their email/);
    const saved = await Customer.findById(customer._id).lean();
    expect(saved.agent.status).toBe("pending");
  });

  it("stores the rejection reason", async () => {
    const auth = await adminAuth();
    const customer = await createCustomer({ agent: { status: "pending" } });

    const res = await request(app)
      .put(`/api/admin/agents/${customer._id}/reject`)
      .set("Authorization", auth)
      .send({ rejectionReason: "RERA id not found" });

    expect(res.status).toBe(200);
    expect(res.body.customer.agent.status).toBe("rejected");
    expect(res.body.customer.agent.rejectionReason).toBe("RERA id not found");
  });

  it("suspending hides the agent's approved listings; reinstating brings back exactly those", async () => {
    const auth = await adminAuth();
    const agent = await createCustomer({ emailVerified: true, agent: { status: "approved" } });
    const listing = (status) =>
      createProperty({ userId: agent._id, ownerModel: "Customer", listedBy: "agent", developerName: undefined, status });
    const live = await listing("approved");
    const waiting = await listing("pending");
    const statusOf = async (p) => (await Property.findById(p._id).lean()).status;

    const suspend = await request(app).put(`/api/admin/agents/${agent._id}/suspend`).set("Authorization", auth);
    expect(suspend.status).toBe(200);
    expect(await statusOf(live)).toBe("suspended");
    expect(await statusOf(waiting)).toBe("pending");

    const reinstate = await request(app).put(`/api/admin/agents/${agent._id}/approve`).set("Authorization", auth);
    expect(reinstate.status).toBe(200);
    expect(await statusOf(live)).toBe("approved");
    expect(await statusOf(waiting)).toBe("pending");
  });

  it("re-running suspend finishes hiding listings a failed first attempt left public", async () => {
    const auth = await adminAuth();
    // As if the agent update succeeded but the listings update didn't.
    const agent = await createCustomer({ emailVerified: true, agent: { status: "suspended" } });
    const leftOver = await createProperty({
      userId: agent._id, ownerModel: "Customer", listedBy: "agent", developerName: undefined, status: "approved",
    });

    const retry = await request(app).put(`/api/admin/agents/${agent._id}/suspend`).set("Authorization", auth);

    expect(retry.status).toBe(409); // already suspended
    expect((await Property.findById(leftOver._id).lean()).status).toBe("suspended");
  });

  it("approving a suspended agent's listing records it but keeps it hidden (single and bulk)", async () => {
    const auth = await adminAuth();
    const agent = await createCustomer({ emailVerified: true, agent: { status: "suspended" } });
    const listing = (status) =>
      createProperty({ userId: agent._id, ownerModel: "Customer", listedBy: "agent", developerName: undefined, status });
    const waiting = await listing("pending");
    const hidden = await listing("suspended");
    const another = await listing("pending");
    const statusOf = async (p) => (await Property.findById(p._id).lean()).status;

    const single = await request(app).put(`/api/admin/approve/${waiting._id}`).set("Authorization", auth);
    const bulk = await request(app)
      .put("/api/admin/bulk-approve")
      .set("Authorization", auth)
      .send({ ids: [String(hidden._id), String(another._id)] });

    expect(single.status).toBe(200);
    expect(single.body.message).toMatch(/hidden until the posting agent is reinstated/);
    expect(await statusOf(waiting)).toBe("suspended");
    // `hidden` was already approved (stored as suspended), so the bulk skips it.
    expect(bulk.body.hidden).toBe(1);
    expect(await statusOf(hidden)).toBe("suspended");
    expect(await statusOf(another)).toBe("suspended");

    // Reinstating the agent brings all of them out.
    await request(app).put(`/api/admin/agents/${agent._id}/approve`).set("Authorization", auth);
    expect(await statusOf(waiting)).toBe("approved");
    expect(await statusOf(another)).toBe("approved");
  });

  it("refuses a move the current status doesn't allow (409)", async () => {
    const auth = await adminAuth();
    const customer = await createCustomer({ agent: { status: "pending" } });

    const res = await request(app).put(`/api/admin/agents/${customer._id}/suspend`).set("Authorization", auth);

    expect(res.status).toBe(409);
  });

  it("rejects an unknown action (400) and an unknown customer (404)", async () => {
    const auth = await adminAuth();
    const customer = await createCustomer({ agent: { status: "pending" } });

    const badAction = await request(app).put(`/api/admin/agents/${customer._id}/promote`).set("Authorization", auth);
    const missing = await request(app).put(`/api/admin/agents/${(await createUser())._id}/approve`).set("Authorization", auth);

    expect(badAction.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it("is admin-only: a developer token gets 403", async () => {
    const developer = await createUser({ role: "developer" });

    const res = await request(app).get("/api/admin/agents").set("Authorization", `Bearer ${signToken(developer)}`);

    expect(res.status).toBe(403);
  });
});
