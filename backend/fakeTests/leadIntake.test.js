// backend/fakeTests/leadIntake.test.js
//
// Public lead intake (docs/review SEC-07, SEC-08): consent must be an explicit
// tick, duplicates match on phone OR email, the response doesn't echo the
// stored row, and both lead routes carry the IP and per-phone limiters.
// Prisma is mocked, so nothing here touches Postgres.
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  lead: { findFirst: vi.fn(), create: vi.fn() },
}));
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));

const { default: leadRoutes } = await import("../routes/leadRoutes.js");
const { leadLimiter, leadPhoneLimiter, leadPhoneKey, clientIp, LEAD_PHONE_LIMIT } = await import(
  "../middleware/rateLimiters.js"
);
const { rateLimit } = await import("express-rate-limit");

const app = express();
app.use(express.json());
app.use("/api/leads", leadRoutes);

const CUSTOMER = {
  customerName: "Asha Rao",
  customerEmail: "Asha@Example.com",
  customerPhone: "9876543210",
  source: "property_page_contact",
  propertyId: "64b7f0c2a1b2c3d4e5f60718",
  customerContactConsent: true,
};

const DEVELOPER = {
  developerFullName: "Ravi Builder",
  developerEmail: "ravi@builder.example",
  developerPhone: "9123456780",
  developerContactConsent: true,
  source: "developer_popup",
};

// What Prisma hands back: the full row, including fields a visitor mustn't see.
const STORED_ROW = {
  id: "lead-uuid-1",
  ipAddress: "203.0.113.9",
  userAgent: "Mozilla/5.0",
  stage: "new",
  assignedTo: null,
};

beforeEach(() => {
  prismaMock.lead.findFirst.mockReset().mockResolvedValue(null);
  prismaMock.lead.create.mockReset().mockResolvedValue(STORED_ROW);
});

describe("customer lead consent (SEC-07)", () => {
  const withoutConsent = { ...CUSTOMER };
  delete withoutConsent.customerContactConsent;

  it.each([
    ["missing", withoutConsent],
    ["false", { ...CUSTOMER, customerContactConsent: false }],
    ["a string", { ...CUSTOMER, customerContactConsent: "true" }],
  ])("rejects a lead whose consent is %s", async (_label, body) => {
    const res = await request(app).post("/api/leads/customer").send(body);

    expect(res.status).toBe(400);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it("stores the lead with the consent the user actually gave", async () => {
    const res = await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(res.status).toBe(201);
    expect(prismaMock.lead.create.mock.calls[0][0].data.contactConsent).toBe(true);
  });

  it("rejects a developer lead without consent", async () => {
    const res = await request(app)
      .post("/api/leads/developer")
      .send({ ...DEVELOPER, developerContactConsent: false });

    expect(res.status).toBe(400);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });
});

describe("customer lead input rules", () => {
  it("rejects a propertyId that isn't an ObjectId", async () => {
    const res = await request(app)
      .post("/api/leads/customer")
      .send({ ...CUSTOMER, propertyId: "../../etc" });

    expect(res.status).toBe(400);
  });

  it("lowercases the email so dedupe can match it", async () => {
    await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(prismaMock.lead.create.mock.calls[0][0].data.email).toBe("asha@example.com");
  });
});

describe("lead spam protection (SEC-08)", () => {
  it("dedupes customer leads on phone OR email for the same property", async () => {
    await request(app).post("/api/leads/customer").send(CUSTOMER);

    const { where } = prismaMock.lead.findFirst.mock.calls[0][0];
    expect(where.OR).toEqual([{ email: "asha@example.com" }, { phone: "9876543210" }]);
    expect(where.propertyId).toBe(CUSTOMER.propertyId);
  });

  it("dedupes developer leads on phone OR email", async () => {
    await request(app).post("/api/leads/developer").send(DEVELOPER);

    const { where } = prismaMock.lead.findFirst.mock.calls[0][0];
    expect(where.OR).toEqual([{ email: DEVELOPER.developerEmail }, { phone: DEVELOPER.developerPhone }]);
  });

  it("doesn't create a second lead when a recent one exists", async () => {
    prismaMock.lead.findFirst.mockResolvedValue(STORED_ROW);

    const res = await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(res.status).toBe(200);
    expect(prismaMock.lead.create).not.toHaveBeenCalled();
  });

  it.each([
    ["customer", CUSTOMER],
    ["developer", DEVELOPER],
  ])("the %s response returns only the new id, not the stored row", async (type, body) => {
    const res = await request(app).post(`/api/leads/${type}`).send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, id: STORED_ROW.id });
  });

  it.each(["/customer", "/developer"])("%s uses both the IP and the per-phone limiter", (path) => {
    const layer = leadRoutes.stack.find((l) => l.route?.path === path && l.route.methods.post);
    const handlers = layer.route.stack.map((l) => l.handle);

    expect(handlers).toContain(leadLimiter);
    expect(handlers).toContain(leadPhoneLimiter);
  });

  it("keys the per-phone limiter on the digits of either form's phone field", () => {
    expect(leadPhoneKey({ body: { customerPhone: "98765 43210" } })).toBe("lead-phone:9876543210");
    expect(leadPhoneKey({ body: { developerPhone: "9123456780" } })).toBe("lead-phone:9123456780");
    expect(leadPhoneKey({ body: {} })).toBeNull();
    expect(leadPhoneKey({ body: { customerPhone: { $gt: "" } } })).toBeNull();
  });

  // The shared limiters are switched off under NODE_ENV=test, so this builds
  // one from the real per-phone settings to check how it counts.
  it("per-phone limit: rejected requests don't count, accepted ones cap at the max", async () => {
    const limited = express();
    limited.use(express.json());
    limited.post("/lead", rateLimit(LEAD_PHONE_LIMIT), (req, res) =>
      res.status(req.body.valid ? 201 : 400).json({})
    );
    const send = (valid) => request(limited).post("/lead").send({ customerPhone: "9876543210", valid });

    for (let i = 0; i < 20; i++) expect((await send(false)).status).toBe(400); // junk: never blocks
    for (let i = 0; i < LEAD_PHONE_LIMIT.max; i++) expect((await send(true)).status).toBe(201);
    expect((await send(true)).status).toBe(429);
  });

  it("counts every address in one IPv6 block as the same client (all limiters)", () => {
    const a = clientIp({ ip: "2405:201:abcd:1200:1111:2222:3333:4444" });
    const b = clientIp({ ip: "2405:201:abcd:1200:9999:8888:7777:6666" });

    expect(a).toBe(b);
    expect(clientIp({ ip: "2405:201:abcd:1300::1" })).not.toBe(a);
    expect(clientIp({ ip: "203.0.113.9" })).toBe("203.0.113.9");
  });
});
