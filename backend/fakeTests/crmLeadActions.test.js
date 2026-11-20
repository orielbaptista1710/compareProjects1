// backend/fakeTests/crmLeadActions.test.js
//
// CRM write actions and pick-lists: PATCH /leads/:id, POST /leads/:id/assign,
// POST /leads/:id/reveal, GET /staff, GET /zones. Prisma is mocked: these tests
// check who may do what and what gets written, not Postgres itself.
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  crmUser: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  crmSession: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  lead: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  leadActivity: { create: vi.fn(), createMany: vi.fn() },
  auditLog: { create: vi.fn() },
  zone: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));

const { default: crmRoutes } = await import("../routes/crmRoutes.js");

const app = express().use(cookieParser()).use(express.json()).use("/api/crm", crmRoutes);

const USER_ID = "9b2d7e41-0c3a-4f5e-8a1b-6d7c8e9f0a1b";
const LEAD_ID = "3f1c2a9e-5b7d-4c1a-9e0f-1a2b3c4d5e6f";
const REP_ID = "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

const loginAs = (role) =>
  prismaMock.crmSession.findUnique.mockResolvedValue({
    id: "sess-1",
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: USER_ID, email: "staff@company.example", name: "Staff", role, isActive: true },
  });

const send = (method, path, body) => {
  const req = request(app)[method](path).set("Cookie", "crm_session=abc");
  return body === undefined ? req : req.send(body);
};

const detailRow = (overrides = {}) => ({
  id: LEAD_ID,
  name: "Priya Sharma",
  phone: "+919876543210",
  email: "priya@example.com",
  category: "buyer",
  stage: "contacted",
  assignedTo: null,
  zoneId: null,
  lastActivityAt: null,
  createdAt: new Date("2026-11-16T08:15:00Z"),
  assignee: null,
  zone: null,
  _count: { enquiries: 1 },
  lostReason: null,
  enquiries: [],
  ...overrides,
});

const repScope = { assignedTo: USER_ID };
const zonalScope = { zone: { staff: { some: { userId: USER_ID, isManager: true } } } };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock));
  prismaMock.lead.updateMany.mockResolvedValue({ count: 1 });
});

describe("PATCH /api/crm/leads/:leadId", () => {
  const patch = (body, id = LEAD_ID) => send("patch", `/api/crm/leads/${id}`, body);
  const current = (overrides = {}) => ({ stage: "new", category: "buyer", firstContactedAt: null, ...overrides });

  it("changes the stage within the caller's scope and writes an activity", async () => {
    loginAs("sales_rep");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current())
      .mockResolvedValueOnce(detailRow({ stage: "contacted" }));

    const res = await patch({ stage: "contacted" });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe("contacted");
    expect(prismaMock.lead.findFirst.mock.calls[0][0].where.AND).toEqual([repScope, { id: LEAD_ID }]);
    const { where, data } = prismaMock.lead.updateMany.mock.calls[0][0];
    expect(where).toEqual({ AND: [repScope, { id: LEAD_ID }] });
    expect(data).toMatchObject({ stage: "contacted", lostReason: null });
    expect(data.firstContactedAt).toBeInstanceOf(Date);
    expect(data.lastActivityAt).toBeInstanceOf(Date);
    expect(prismaMock.leadActivity.createMany.mock.calls[0][0].data).toEqual([
      { leadId: LEAD_ID, crmUserId: USER_ID, activityType: "stage_change", notes: "new → contacted" },
    ]);
  });

  it("scopes a zonal manager to their zones", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce(current()).mockResolvedValueOnce(detailRow());
    await patch({ stage: "qualified" });
    expect(prismaMock.lead.findFirst.mock.calls[0][0].where.AND[0]).toEqual(zonalScope);
  });

  it("needs a reason to mark a lead lost, and stores it as plain text", async () => {
    loginAs("crm_manager");
    expect((await patch({ stage: "lost" })).status).toBe(400);

    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current({ stage: "contacted" }))
      .mockResolvedValueOnce(detailRow({ stage: "lost", lostReason: "Bought elsewhere" }));
    const res = await patch({ stage: "lost", lostReason: "<b>Bought</b> elsewhere" });
    expect(res.status).toBe(200);
    expect(prismaMock.lead.updateMany.mock.calls[0][0].data.lostReason).toBe("Bought elsewhere");
    expect(prismaMock.leadActivity.createMany.mock.calls[0][0].data[0].notes).toBe(
      "contacted → lost: Bought elsewhere",
    );
  });

  it("clears the lost reason when a lead is reopened", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current({ stage: "lost", firstContactedAt: new Date() }))
      .mockResolvedValueOnce(detailRow());
    await patch({ stage: "contacted" });
    const { data } = prismaMock.lead.updateMany.mock.calls[0][0];
    expect(data.lostReason).toBeNull();
    expect(data).not.toHaveProperty("firstContactedAt");
  });

  it("accepts null as a lost reason when reopening a lead", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current({ stage: "lost", lostReason: "Bought elsewhere" }))
      .mockResolvedValueOnce(detailRow());
    expect((await patch({ stage: "contacted", lostReason: null })).status).toBe(200);
    expect(prismaMock.lead.updateMany.mock.calls[0][0].data.lostReason).toBeNull();
  });

  it("rejects null as a lost reason when the stage is lost", async () => {
    loginAs("crm_manager");
    expect((await patch({ stage: "lost", lostReason: null })).status).toBe(400);
  });

  it("changes the reason on a lead that is already lost, with an activity", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current({ stage: "lost", lostReason: "Old reason" }))
      .mockResolvedValueOnce(detailRow({ stage: "lost", lostReason: "New reason" }));
    const res = await patch({ stage: "lost", lostReason: "New reason" });
    expect(res.status).toBe(200);
    expect(prismaMock.lead.updateMany.mock.calls[0][0].data).toMatchObject({
      stage: "lost",
      lostReason: "New reason",
    });
    expect(prismaMock.leadActivity.createMany.mock.calls[0][0].data[0].notes).toBe(
      "Lost reason changed to: New reason",
    );
  });

  it("writes nothing for a lost lead when the reason is unchanged", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce(current({ stage: "lost", lostReason: "Same" }))
      .mockResolvedValueOnce(detailRow({ stage: "lost", lostReason: "Same" }));
    expect((await patch({ stage: "lost", lostReason: "Same" })).status).toBe(200);
    expect(prismaMock.lead.updateMany).not.toHaveBeenCalled();
  });

  it("answers 404 and writes no activity when the lead leaves scope before the write", async () => {
    loginAs("sales_rep");
    prismaMock.lead.findFirst.mockResolvedValueOnce(current());
    prismaMock.lead.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await patch({ stage: "contacted" });
    expect(res.status).toBe(404);
    expect(prismaMock.leadActivity.createMany).not.toHaveBeenCalled();
  });

  it("answers 404, never an empty 200, when the re-read finds nothing", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce(current()).mockResolvedValueOnce(null);
    const res = await patch({ stage: "contacted" });
    expect(res.status).toBe(404);
  });

  it("corrects the category and records it", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce(current()).mockResolvedValueOnce(detailRow());
    const res = await patch({ category: "developer_partner" });
    expect(res.status).toBe(200);
    expect(prismaMock.lead.updateMany.mock.calls[0][0].data.category).toBe("developer_partner");
    expect(prismaMock.leadActivity.createMany.mock.calls[0][0].data[0]).toMatchObject({
      activityType: "note",
      notes: "Category corrected: buyer → developer_partner",
    });
  });

  it("writes nothing when nothing changes", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce(current()).mockResolvedValueOnce(detailRow());
    const res = await patch({ stage: "new" });
    expect(res.status).toBe(200);
    expect(prismaMock.lead.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.leadActivity.createMany).not.toHaveBeenCalled();
  });

  it("never lets an admin change a lead", async () => {
    loginAs("admin");
    const res = await patch({ stage: "contacted" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("answers 404 for a lead outside the caller's scope", async () => {
    loginAs("sales_rep");
    prismaMock.lead.findFirst.mockResolvedValueOnce(null);
    const res = await patch({ stage: "contacted" });
    expect(res.status).toBe(404);
    expect(prismaMock.lead.updateMany).not.toHaveBeenCalled();
  });

  it("answers a malformed id with 404, without querying", async () => {
    loginAs("crm_manager");
    const res = await patch({ stage: "contacted" }, "not-a-uuid");
    expect(res.status).toBe(404);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["an empty body", {}],
    ["an unknown stage", { stage: "archived" }],
    ["an unknown field", { stage: "contacted", assignedTo: USER_ID }],
    ["a lost reason without stage lost", { stage: "contacted", lostReason: "x" }],
    ["a lost reason over 300 characters", { stage: "lost", lostReason: "x".repeat(301) }],
    ["a lost reason that is only markup", { stage: "lost", lostReason: "<b></b>" }],
  ])("returns 400 for %s", async (_label, body) => {
    loginAs("crm_manager");
    const res = await patch(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const res = await request(app).patch(`/api/crm/leads/${LEAD_ID}`).send({ stage: "contacted" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/crm/leads/:leadId/assign", () => {
  const assign = (body, id = LEAD_ID) => send("post", `/api/crm/leads/${id}/assign`, body);

  it("lets a crm_manager assign to any active sales rep, with an activity and audit row", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst
      .mockResolvedValueOnce({ assignedTo: null })
      .mockResolvedValueOnce(detailRow({ assignedTo: REP_ID, assignee: { name: "Asha Rao" } }));
    prismaMock.crmUser.findFirst.mockResolvedValue({ name: "Asha Rao" });

    const res = await assign({ assigneeId: REP_ID });

    expect(res.status).toBe(200);
    expect(res.body.assigneeName).toBe("Asha Rao");
    expect(prismaMock.crmUser.findFirst.mock.calls[0][0].where).toEqual({
      id: REP_ID,
      isActive: true,
      role: "sales_rep",
    });
    expect(prismaMock.lead.updateMany.mock.calls[0][0].data).toMatchObject({ assignedTo: REP_ID });
    expect(prismaMock.leadActivity.create.mock.calls[0][0].data).toEqual({
      leadId: LEAD_ID,
      crmUserId: USER_ID,
      activityType: "assignment",
      notes: "Assigned to Asha Rao",
    });
    expect(prismaMock.auditLog.create.mock.calls[0][0].data).toEqual({
      actorId: USER_ID,
      action: "lead.assign",
      targetType: "lead",
      targetId: LEAD_ID,
    });
  });

  it("limits a zonal manager to their zones' leads and reps", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce({ assignedTo: null }).mockResolvedValueOnce(detailRow());
    prismaMock.crmUser.findFirst.mockResolvedValue({ name: "Asha Rao" });

    await assign({ assigneeId: REP_ID });

    expect(prismaMock.lead.findFirst.mock.calls[0][0].where.AND[0]).toEqual(zonalScope);
    expect(prismaMock.crmUser.findFirst.mock.calls[0][0].where.zones).toEqual({
      some: { zone: { staff: { some: { userId: USER_ID, isManager: true } } } },
    });
  });

  it("answers 404 for an assignee that isn't an eligible rep", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce({ assignedTo: null });
    prismaMock.crmUser.findFirst.mockResolvedValue(null);
    const res = await assign({ assigneeId: REP_ID });
    expect(res.status).toBe(404);
    expect(prismaMock.lead.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("answers 404 for a lead outside the caller's scope, without looking up the assignee", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce(null);
    const res = await assign({ assigneeId: REP_ID });
    expect(res.status).toBe(404);
    expect(prismaMock.crmUser.findFirst).not.toHaveBeenCalled();
  });

  it("writes nothing when the lead already has that assignee", async () => {
    loginAs("crm_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce({ assignedTo: REP_ID }).mockResolvedValueOnce(detailRow());
    prismaMock.crmUser.findFirst.mockResolvedValue({ name: "Asha Rao" });
    const res = await assign({ assigneeId: REP_ID });
    expect(res.status).toBe(200);
    expect(prismaMock.lead.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("answers 404 and writes no activity when the lead leaves scope before the write", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValueOnce({ assignedTo: null });
    prismaMock.crmUser.findFirst.mockResolvedValue({ name: "Asha Rao" });
    prismaMock.lead.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await assign({ assigneeId: REP_ID });
    expect(res.status).toBe(404);
    expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it.each(["sales_rep", "admin", "intern"])("refuses %s with 403", async (role) => {
    loginAs(role);
    const res = await assign({ assigneeId: REP_ID });
    expect(res.status).toBe(403);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing assigneeId", {}],
    ["a malformed assigneeId", { assigneeId: "asha" }],
    ["an unknown field", { assigneeId: REP_ID, stage: "lost" }],
  ])("returns 400 for %s", async (_label, body) => {
    loginAs("crm_manager");
    const res = await assign(body);
    expect(res.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("answers a malformed lead id with 404", async () => {
    loginAs("crm_manager");
    expect((await assign({ assigneeId: REP_ID }, "nope")).status).toBe(404);
  });
});

describe("POST /api/crm/leads/:leadId/reveal", () => {
  const reveal = (id = LEAD_ID) => send("post", `/api/crm/leads/${id}/reveal`, {});

  it("gives an admin the real contact and audits it first", async () => {
    loginAs("admin");
    prismaMock.lead.findFirst.mockResolvedValue({ phone: "+919876543210", email: "priya@example.com" });

    const res = await reveal();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ phone: "+919876543210", email: "priya@example.com" });
    const audit = prismaMock.auditLog.create.mock.calls[0][0].data;
    expect(audit).toEqual({ actorId: USER_ID, action: "lead.reveal", targetType: "lead", targetId: LEAD_ID });
    expect(JSON.stringify(audit)).not.toContain("9876543210");
  });

  it("returns no contact when the audit write fails", async () => {
    loginAs("admin");
    prismaMock.lead.findFirst.mockResolvedValue({ phone: "+919876543210", email: null });
    prismaMock.auditLog.create.mockRejectedValue(new Error("db down"));
    const res = await reveal();
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("9876543210");
  });

  it.each(["crm_manager", "zonal_manager", "sales_rep", "intern"])("refuses %s with 403", async (role) => {
    loginAs(role);
    const res = await reveal();
    expect(res.status).toBe(403);
    expect(prismaMock.lead.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("answers 404 for a missing lead without writing an audit row", async () => {
    loginAs("admin");
    prismaMock.lead.findFirst.mockResolvedValue(null);
    expect((await reveal()).status).toBe(404);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("answers a malformed id with 404", async () => {
    loginAs("admin");
    expect((await reveal("nope")).status).toBe(404);
  });
});

describe("GET /api/crm/staff", () => {
  const rows = [{ id: REP_ID, name: "Asha Rao", role: "sales_rep" }];

  it("gives a crm_manager every active rep", async () => {
    loginAs("crm_manager");
    prismaMock.crmUser.findMany.mockResolvedValue(rows);
    const res = await send("get", "/api/crm/staff");
    expect(res.body).toEqual({ data: rows });
    const call = prismaMock.crmUser.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ role: "sales_rep", isActive: true });
    expect(call.select).toEqual({ id: true, name: true, role: true });
    expect(call.take).toBe(200);
  });

  it("gives a zonal manager only reps in zones they manage", async () => {
    loginAs("zonal_manager");
    prismaMock.crmUser.findMany.mockResolvedValue(rows);
    await send("get", "/api/crm/staff");
    expect(prismaMock.crmUser.findMany.mock.calls[0][0].where.zones).toEqual({
      some: { zone: { staff: { some: { userId: USER_ID, isManager: true } } } },
    });
  });

  it.each(["sales_rep", "admin", "intern"])("refuses %s with 403", async (role) => {
    loginAs(role);
    const res = await send("get", "/api/crm/staff");
    expect(res.status).toBe(403);
    expect(prismaMock.crmUser.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    expect((await request(app).get("/api/crm/staff")).status).toBe(401);
  });
});

describe("GET /api/crm/zones", () => {
  const rows = [{ id: LEAD_ID, name: "Bengaluru East", city: "Bengaluru" }];

  it.each([
    ["admin", {}],
    ["crm_manager", {}],
    ["zonal_manager", { staff: { some: { userId: USER_ID, isManager: true } } }],
    ["sales_rep", { staff: { some: { userId: USER_ID } } }],
  ])("scopes %s", async (role, where) => {
    loginAs(role);
    prismaMock.zone.findMany.mockResolvedValue(rows);
    const res = await send("get", "/api/crm/zones");
    expect(res.body).toEqual({ data: rows });
    expect(prismaMock.zone.findMany.mock.calls[0][0].where).toEqual(where);
  });

  it("refuses a role it doesn't know", async () => {
    loginAs("intern");
    expect((await send("get", "/api/crm/zones")).status).toBe(403);
    expect(prismaMock.zone.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    expect((await request(app).get("/api/crm/zones")).status).toBe(401);
  });
});
