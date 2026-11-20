// backend/fakeTests/crmLeads.test.js
//
// CRM lead inbox and detail (GET /api/crm/leads, /api/crm/leads/:leadId).
// Prisma is mocked: these tests check what each role is allowed to query and
// what the API returns, not Postgres itself.
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  crmUser: { findUnique: vi.fn(), update: vi.fn() },
  crmSession: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  lead: { findMany: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));

const { default: crmRoutes } = await import("../routes/crmRoutes.js");
const { ENQUIRY_LIMIT } = await import("../services/crm/leadsService.js");

const app = express().use(cookieParser()).use("/api/crm", crmRoutes);

const USER_ID = "9b2d7e41-0c3a-4f5e-8a1b-6d7c8e9f0a1b";
const LEAD_ID = "3f1c2a9e-5b7d-4c1a-9e0f-1a2b3c4d5e6f";

const loginAs = (role) =>
  prismaMock.crmSession.findUnique.mockResolvedValue({
    id: "sess-1",
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: USER_ID, email: "staff@company.example", name: "Staff", role, isActive: true },
  });

const get = (path) => request(app).get(path).set("Cookie", "crm_session=abc");

const leadRow = (overrides = {}) => ({
  id: LEAD_ID,
  name: "Priya Sharma",
  phone: "+919876543210",
  email: "priya@example.com",
  category: "buyer",
  stage: "new",
  assignedTo: USER_ID,
  zoneId: null,
  lastActivityAt: new Date("2026-11-17T10:30:00Z"),
  createdAt: new Date("2026-11-16T08:15:00Z"),
  assignee: { name: "Asha Rao" },
  zone: null,
  _count: { enquiries: 2 },
  ...overrides,
});

const listWhere = () => prismaMock.lead.findMany.mock.calls[0][0].where.AND;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.lead.findMany.mockResolvedValue([leadRow()]);
});

describe("GET /api/crm/leads: who sees what", () => {
  it.each([
    ["crm_manager", {}],
    ["admin", {}],
    ["zonal_manager", { zone: { staff: { some: { userId: USER_ID, isManager: true } } } }],
    ["sales_rep", { assignedTo: USER_ID }],
  ])("%s is scoped to its leads", async (role, scope) => {
    loginAs(role);
    const res = await get("/api/crm/leads");
    expect(res.status).toBe(200);
    expect(listWhere()[0]).toEqual(scope);
  });

  it("refuses a role it doesn't know, without querying leads", async () => {
    loginAs("intern");
    const res = await get("/api/crm/leads");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
    expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const res = await request(app).get("/api/crm/leads");
    expect(res.status).toBe(401);
  });

  it("tells browsers and proxies not to store the response", async () => {
    loginAs("crm_manager");
    const res = await get("/api/crm/leads");
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});

describe("GET /api/crm/leads: contact details", () => {
  it("shows contacts to a crm_manager, in the contract's shape", async () => {
    loginAs("crm_manager");
    const res = await get("/api/crm/leads");
    expect(res.body).toEqual({
      data: [
        {
          id: LEAD_ID,
          name: "Priya Sharma",
          phone: "+919876543210",
          email: "priya@example.com",
          contactMasked: false,
          category: "buyer",
          stage: "new",
          assignedTo: USER_ID,
          assigneeName: "Asha Rao",
          zoneId: null,
          zoneName: null,
          enquiryCount: 2,
          lastActivityAt: "2026-11-17T10:30:00.000Z",
          createdAt: "2026-11-16T08:15:00.000Z",
        },
      ],
      nextCursor: null,
    });
  });

  it("masks phone and email for an admin", async () => {
    loginAs("admin");
    const [lead] = (await get("/api/crm/leads")).body.data;
    expect(lead.phone).toBe("+91******3210");
    expect(lead.email).toBe("p***@example.com");
    expect(lead.contactMasked).toBe(true);
  });

  it("lets an admin search by name only, never by number", async () => {
    loginAs("admin");
    await get("/api/crm/leads?q=98765");
    expect(listWhere()).toContainEqual({ name: { contains: "98765", mode: "insensitive" } });
  });

  it("lets other roles search by name or phone", async () => {
    loginAs("crm_manager");
    await get("/api/crm/leads?q=98765");
    expect(listWhere()).toContainEqual({
      OR: [{ name: { contains: "98765", mode: "insensitive" } }, { phone: { contains: "98765" } }],
    });
  });
});

describe("GET /api/crm/leads: filters and paging", () => {
  it("applies the filters on top of the scope", async () => {
    loginAs("sales_rep");
    await get(`/api/crm/leads?stage=lost&category=developer_partner&zoneId=${LEAD_ID}`);
    expect(listWhere()).toEqual([
      { assignedTo: USER_ID },
      { stage: "lost" },
      { category: "developer_partner" },
      { zoneId: LEAD_ID },
    ]);
  });

  it("unassigned=true asks for leads with no assignee", async () => {
    loginAs("crm_manager");
    await get("/api/crm/leads?unassigned=true");
    expect(listWhere()).toContainEqual({ assignedTo: null });
  });

  it.each([
    ["an unknown stage", "stage=archived"],
    ["a repeated filter (array)", "stage=new&stage=lost"],
    ["unassigned with assignedTo", `unassigned=true&assignedTo=${USER_ID}`],
    ["a limit over 50", "limit=51"],
    ["a malformed zone id", "zoneId=not-a-uuid"],
    ["a cursor we didn't issue", "cursor=hello"],
  ])("returns 400 for %s", async (_label, query) => {
    loginAs("crm_manager");
    const res = await get(`/api/crm/leads?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
  });

  it("pages newest first with an opaque cursor", async () => {
    loginAs("crm_manager");
    const rows = [
      leadRow({ id: "a3", createdAt: new Date("2026-11-03T00:00:00Z") }),
      leadRow({ id: "a2", createdAt: new Date("2026-11-02T00:00:00Z") }),
      leadRow({ id: "a1", createdAt: new Date("2026-11-01T00:00:00Z") }),
    ];
    prismaMock.lead.findMany.mockResolvedValueOnce(rows);

    const first = await get("/api/crm/leads?limit=2");
    expect(first.body.data.map((l) => l.id)).toEqual(["a3", "a2"]);
    expect(first.body.nextCursor).toEqual(expect.any(String));
    const call = prismaMock.lead.findMany.mock.calls[0][0];
    expect(call.take).toBe(3);
    expect(call.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);

    prismaMock.lead.findMany.mockResolvedValueOnce([rows[2]]);
    const second = await get(`/api/crm/leads?limit=2&cursor=${first.body.nextCursor}`);
    expect(second.body).toMatchObject({ data: [{ id: "a1" }], nextCursor: null });
    expect(prismaMock.lead.findMany.mock.calls[1][0].where.AND).toContainEqual({
      OR: [
        { createdAt: { lt: new Date("2026-11-02T00:00:00Z") } },
        { createdAt: new Date("2026-11-02T00:00:00Z"), id: { lt: "a2" } },
      ],
    });
  });
});

describe("GET /api/crm/leads/:leadId", () => {
  const enquiry = {
    id: "e1",
    channel: "web",
    source: "developer_popup",
    propertyId: null,
    propertyTitle: null,
    listerType: null,
    city: "Pune",
    locality: "Baner",
    pincode: "411045",
    budget: null,
    message: "Partnership",
    loanInterest: null,
    createdAt: new Date("2026-11-16T08:15:00Z"),
    rawPayload: { companyName: "Acme Developers", developerPhone: "9876543210" },
  };

  it("returns the lead with its enquiries, scoped and bounded", async () => {
    loginAs("zonal_manager");
    prismaMock.lead.findFirst.mockResolvedValue({ ...leadRow(), lostReason: null, enquiries: [enquiry] });

    const res = await get(`/api/crm/leads/${LEAD_ID}`);

    expect(res.status).toBe(200);
    const { where, select } = prismaMock.lead.findFirst.mock.calls[0][0];
    expect(where.AND).toEqual([{ zone: { staff: { some: { userId: USER_ID, isManager: true } } } }, { id: LEAD_ID }]);
    expect(select.enquiries.take).toBe(ENQUIRY_LIMIT);
    expect(res.body.lostReason).toBeNull();
    expect(res.body.enquiries[0].companyName).toBe("Acme Developers");
    // The raw form data never leaves the server.
    expect(res.body.enquiries[0]).not.toHaveProperty("rawPayload");
    expect(JSON.stringify(res.body)).not.toContain("developerPhone");
  });

  it("hides the message and company name from an admin (masked contacts)", async () => {
    loginAs("admin");
    prismaMock.lead.findFirst.mockResolvedValue({ ...leadRow(), lostReason: null, enquiries: [enquiry] });

    const res = await get(`/api/crm/leads/${LEAD_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.enquiries[0].message).toBeNull();
    expect(res.body.enquiries[0].companyName).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain("Acme Developers");
  });

  it("returns 404 for a lead that is missing or outside the caller's scope", async () => {
    loginAs("sales_rep");
    prismaMock.lead.findFirst.mockResolvedValue(null);
    const res = await get(`/api/crm/leads/${LEAD_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("answers a malformed id with the same 404, without querying", async () => {
    loginAs("crm_manager");
    const res = await get("/api/crm/leads/not-a-uuid");
    expect(res.status).toBe(404);
    expect(prismaMock.lead.findFirst).not.toHaveBeenCalled();
  });

  it("masks the admin's view of a lead, including enquiry messages", async () => {
    loginAs("admin");
    const message = "Call me on 9876543210";
    prismaMock.lead.findFirst.mockResolvedValue({ ...leadRow(), lostReason: null, enquiries: [{ ...enquiry, message }] });
    const res = await get(`/api/crm/leads/${LEAD_ID}`);
    expect(res.body.phone).toBe("+91******3210");
    expect(res.body.contactMasked).toBe(true);
    expect(res.body.enquiries[0].message).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain("9876543210");
  });

  it("answers a role it doesn't know with 404, without querying", async () => {
    loginAs("intern");
    const res = await get(`/api/crm/leads/${LEAD_ID}`);
    expect(res.status).toBe(404);
    expect(prismaMock.lead.findFirst).not.toHaveBeenCalled();
  });
});
