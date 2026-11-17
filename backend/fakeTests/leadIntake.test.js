// backend/fakeTests/leadIntake.test.js
//
// Public lead intake (docs/review SEC-07, SEC-08): consent must be an explicit
// tick, duplicates match on phone OR email, the response doesn't echo the
// stored row, and both lead routes carry the IP and per-phone limiters.
// Prisma is mocked, so nothing here touches Postgres.
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const prismaMock = vi.hoisted(() => {
  const m = {
    enquiry: { findFirst: vi.fn(), create: vi.fn() },
    lead: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    zoneArea: { findUnique: vi.fn() },
  };
  m.$transaction = vi.fn((fn) => fn(m)); // the callback gets the same mock
  return m;
});
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));

const propertyMock = vi.hoisted(() => ({ findById: vi.fn() }));
vi.mock("../models/Property.js", () => ({ default: propertyMock }));

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

// What Prisma hands back for the new enquiry (only the id is selected).
const STORED_ROW = { id: "enquiry-uuid-1" };
const LEAD_ROW = { id: "lead-uuid-1", email: null, zoneId: null };

// The Mongo property the snapshot is read from.
const PROPERTY = {
  title: "3 BHK in Whitefield",
  city: "Bengaluru",
  locality: "Whitefield",
  pincode: "560066",
  listedBy: "agent",
  userId: "64b7f0c2a1b2c3d4e5f60999",
};
const mongoReturns = (doc) =>
  propertyMock.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(doc) }) });

const createdEnquiry = () => prismaMock.enquiry.create.mock.calls[0][0].data;
const createdLead = () => prismaMock.lead.create.mock.calls[0][0].data;

beforeEach(() => {
  prismaMock.enquiry.findFirst.mockReset().mockResolvedValue(null);
  prismaMock.enquiry.create.mockReset().mockResolvedValue(STORED_ROW);
  prismaMock.lead.findUnique.mockReset().mockResolvedValue(null);
  prismaMock.lead.create.mockReset().mockResolvedValue(LEAD_ROW);
  prismaMock.lead.update.mockReset().mockResolvedValue(LEAD_ROW);
  prismaMock.zoneArea.findUnique.mockReset().mockResolvedValue(null);
  mongoReturns(PROPERTY);
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
    expect(prismaMock.enquiry.create).not.toHaveBeenCalled();
  });

  it("records which consent wording applied and when", async () => {
    const res = await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(res.status).toBe(201);
    expect(createdEnquiry().consentVersion).toEqual(expect.any(String));
    expect(createdEnquiry().consentAt).toBeInstanceOf(Date);
  });

  it("rejects a developer lead without consent", async () => {
    const res = await request(app)
      .post("/api/leads/developer")
      .send({ ...DEVELOPER, developerContactConsent: false });

    expect(res.status).toBe(400);
    expect(prismaMock.enquiry.create).not.toHaveBeenCalled();
  });
});

describe("customer lead input rules", () => {
  it("rejects a propertyId that isn't an ObjectId", async () => {
    const res = await request(app)
      .post("/api/leads/customer")
      .send({ ...CUSTOMER, propertyId: "../../etc" });

    expect(res.status).toBe(400);
  });

  it("lowercases the email and stores the phone as +91 E.164", async () => {
    await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(createdLead().email).toBe("asha@example.com");
    expect(createdLead().phone).toBe("+919876543210");
  });
});

describe("lead and enquiry storage", () => {
  it("takes lister and location from Mongo, not from the client", async () => {
    await request(app)
      .post("/api/leads/customer")
      .send({ ...CUSTOMER, listerType: "developer", listerId: "evil", city: "Elsewhere" });

    expect(createdEnquiry()).toMatchObject({
      listerType: "agent",
      listerId: PROPERTY.userId,
      city: "Bengaluru",
      pincode: "560066",
    });
  });

  it("still stores the enquiry when the property lookup fails", async () => {
    propertyMock.findById.mockImplementation(() => {
      throw new Error("mongo down");
    });

    const res = await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(res.status).toBe(201);
    expect(createdEnquiry().listerType).toBeNull();
  });

  it("puts the lead in the zone that owns the property's pincode", async () => {
    prismaMock.zoneArea.findUnique.mockResolvedValue({ zoneId: "zone-1" });

    await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(createdLead().zoneId).toBe("zone-1");
  });

  it("adds an enquiry to the existing lead for the same phone, keeping its name", async () => {
    prismaMock.lead.findUnique.mockResolvedValue({ ...LEAD_ROW, name: "First Name" });

    await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(prismaMock.lead.create).not.toHaveBeenCalled();
    expect(prismaMock.lead.update.mock.calls[0][0].data.name).toBeUndefined();
    expect(createdEnquiry().leadId).toBe(LEAD_ROW.id);
  });

  it("files a developer popup as a developer_partner lead", async () => {
    await request(app).post("/api/leads/developer").send(DEVELOPER);

    expect(createdLead().category).toBe("developer_partner");
  });
});

describe("lead spam protection (SEC-08)", () => {
  it("dedupes customer leads on phone OR email for the same property", async () => {
    await request(app).post("/api/leads/customer").send(CUSTOMER);

    const { where } = prismaMock.enquiry.findFirst.mock.calls[0][0];
    expect(where.lead.OR).toEqual([{ phone: "+919876543210" }, { email: "asha@example.com" }]);
    expect(where.propertyId).toBe(CUSTOMER.propertyId);
  });

  it("dedupes developer leads on phone OR email", async () => {
    await request(app).post("/api/leads/developer").send(DEVELOPER);

    const { where } = prismaMock.enquiry.findFirst.mock.calls[0][0];
    expect(where.lead.OR).toEqual([{ phone: "+919123456780" }, { email: DEVELOPER.developerEmail }]);
  });

  it("doesn't create a second enquiry when a recent one exists", async () => {
    prismaMock.enquiry.findFirst.mockResolvedValue(STORED_ROW);

    const res = await request(app).post("/api/leads/customer").send(CUSTOMER);

    expect(res.status).toBe(200);
    expect(prismaMock.enquiry.create).not.toHaveBeenCalled();
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
