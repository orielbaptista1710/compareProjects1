// backend/fakeTests/crmAuth.test.js
//
// CRM staff login and sessions (/api/crm/auth/*). Prisma is mocked, so
// nothing here touches Postgres. bcrypt is real (low cost for speed).
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcryptjs";

const prismaMock = vi.hoisted(() => ({
  crmUser: { findUnique: vi.fn(), update: vi.fn() },
  crmSession: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));

const { default: authRoutes } = await import("../routes/crm/authRoutes.js");
const { crmLoginLimiter, crmApiLimiter } = await import("../middleware/rateLimiters.js");
const { MAX_FAILED_LOGINS } = await import("../services/crm/crmAuthService.js");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/crm/auth", authRoutes);

const PASSWORD = "correct-horse-battery";
const USER = {
  id: "9b2d7e41-0c3a-4f5e-8a1b-6d7c8e9f0a1b",
  email: "asha@company.example",
  name: "Asha Rao",
  role: "sales_rep",
  password: bcrypt.hashSync(PASSWORD, 4),
  isActive: true,
  failedLogins: 0,
  lockedUntil: null,
};

const login = (body) => request(app).post("/api/crm/auth/login").send(body);
const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

const sessionRow = (overrides = {}) => ({
  id: "sess-1",
  revokedAt: null,
  expiresAt: future(),
  user: { id: USER.id, email: USER.email, name: USER.name, role: USER.role, isActive: true },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.crmUser.update.mockResolvedValue({ failedLogins: 1 });
  prismaMock.crmSession.create.mockResolvedValue({});
  prismaMock.crmSession.updateMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/crm/auth/login", () => {
  it("logs in, sets a hardened cookie and stores only the token hash", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValue(USER);

    const res = await login({ email: "  Asha@Company.example ", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      user: { id: USER.id, email: USER.email, name: USER.name, role: USER.role },
    });
    expect(prismaMock.crmUser.findUnique).toHaveBeenCalledWith({ where: { email: USER.email } });

    const cookie = res.headers["set-cookie"][0];
    expect(cookie).toMatch(/^crm_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/crm/);

    const token = cookie.split(";")[0].split("=")[1];
    const { data } = prismaMock.crmSession.create.mock.calls[0][0];
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.tokenHash).not.toBe(token);
    expect(prismaMock.crmSession.deleteMany.mock.calls[0][0].where.userId).toBe(USER.id);
  });

  it("returns 400 for a malformed body", async () => {
    const res = await login({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(prismaMock.crmUser.findUnique).not.toHaveBeenCalled();
  });

  it("gives the same 401 for an unknown email and a wrong password", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValueOnce(null);
    const unknown = await login({ email: "nobody@company.example", password: PASSWORD });

    prismaMock.crmUser.findUnique.mockResolvedValueOnce(USER);
    const wrong = await login({ email: USER.email, password: "wrong-password" });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.headers["set-cookie"]).toBeUndefined();
  });

  it("refuses a deactivated account with 401", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValue({ ...USER, isActive: false });
    const res = await login({ email: USER.email, password: PASSWORD });
    expect(res.status).toBe(401);
    expect(prismaMock.crmSession.create).not.toHaveBeenCalled();
  });

  it("counts a wrong password and locks the account on the last allowed failure", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValue(USER);
    prismaMock.crmUser.update.mockResolvedValueOnce({ failedLogins: MAX_FAILED_LOGINS });

    await login({ email: USER.email, password: "wrong-password" });

    expect(prismaMock.crmUser.update.mock.calls[0][0].data).toEqual({ failedLogins: { increment: 1 } });
    const lock = prismaMock.crmUser.update.mock.calls[1][0].data;
    expect(lock.failedLogins).toBe(0);
    expect(lock.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it("answers a locked account like a wrong password (401), even with the right password", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValue({ ...USER, lockedUntil: future() });
    const res = await login({ email: USER.email, password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
    expect(prismaMock.crmSession.create).not.toHaveBeenCalled();
  });

  it("lets the user in again once the lock has expired", async () => {
    prismaMock.crmUser.findUnique.mockResolvedValue({ ...USER, lockedUntil: past() });
    const res = await login({ email: USER.email, password: PASSWORD });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/crm/auth/me", () => {
  const me = (cookie) => {
    const req = request(app).get("/api/crm/auth/me");
    return cookie ? req.set("Cookie", cookie) : req;
  };

  it("returns 401 without a cookie", async () => {
    const res = await me();
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });

  it("returns the user for a valid session", async () => {
    prismaMock.crmSession.findUnique.mockResolvedValue(sessionRow());
    const res = await me("crm_session=abc");
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: USER.id, email: USER.email, name: USER.name, role: USER.role });
  });

  it.each([
    ["unknown", null],
    ["revoked", sessionRow({ revokedAt: past() })],
    ["expired", sessionRow({ expiresAt: past() })],
    ["deactivated user", sessionRow({ user: { ...sessionRow().user, isActive: false } })],
  ])("returns 401 for a %s session", async (_label, row) => {
    prismaMock.crmSession.findUnique.mockResolvedValue(row);
    const res = await me("crm_session=abc");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/crm/auth/logout", () => {
  it("returns 401 without a session", async () => {
    const res = await request(app).post("/api/crm/auth/logout");
    expect(res.status).toBe(401);
    expect(prismaMock.crmSession.updateMany).not.toHaveBeenCalled();
  });

  it("revokes the session and clears the cookie", async () => {
    prismaMock.crmSession.findUnique.mockResolvedValue(sessionRow());

    const res = await request(app).post("/api/crm/auth/logout").set("Cookie", "crm_session=abc");

    expect(res.status).toBe(204);
    expect(prismaMock.crmSession.updateMany).toHaveBeenCalledWith({
      where: { id: "sess-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(res.headers["set-cookie"][0]).toMatch(/^crm_session=;/);
  });
});

describe("CRM router", () => {
  it("guards every non-auth CRM route with a session", async () => {
    const { default: crmRoutes } = await import("../routes/crmRoutes.js");
    const crmApp = express().use(cookieParser()).use("/api/crm", crmRoutes);

    const res = await request(crmApp).get("/api/crm/leads");

    expect(res.status).toBe(401);
  });

  // Owners, agents, developers and website admins have website logins only;
  // none of them is a CRM session, so none of them gets into the CRM.
  it.each([
    ["developer/admin cookie", { Cookie: "token=eyJhbGciOiJIUzI1NiJ9.e30.sig" }],
    ["customer Firebase token", { Authorization: "Bearer eyJhbGciOiJSUzI1NiJ9.e30.sig" }],
  ])("refuses a website %s", async (_label, headers) => {
    const { default: crmRoutes } = await import("../routes/crmRoutes.js");
    const crmApp = express().use(cookieParser()).use("/api/crm", crmRoutes);

    for (const path of ["/api/crm/leads", "/api/crm/auth/me"]) {
      const res = await request(crmApp).get(path).set(headers);
      expect(res.status).toBe(401);
    }
    expect(prismaMock.crmSession.findUnique).not.toHaveBeenCalled();
  });
});

describe("rate limiters", () => {
  const handlersFor = (path, method) =>
    authRoutes.stack.find((l) => l.route?.path === path && l.route.methods[method]).route.stack.map((l) => l.handle);

  it("login uses the CRM login limiter", () => {
    expect(handlersFor("/login", "post")).toContain(crmLoginLimiter);
  });

  it.each([["/logout", "post"], ["/me", "get"]])("%s uses the CRM API limiter", (path, method) => {
    expect(handlersFor(path, method)).toContain(crmApiLimiter);
  });
});
