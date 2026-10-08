// backend/fakeTests/loginHardening.test.js
//
// Developer/admin login hardening: per-username failed-login limit, equal
// bcrypt work for unknown and real usernames (no timing enumeration), and
// 400 (not 500) for non-string credentials.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/fixtures.js";
import authRoutes from "../routes/authRoutes.js";
import {
  loginUsernameLimiter,
  loginUsernameKey,
  LOGIN_USERNAME_LIMIT,
} from "../middleware/rateLimiters.js";

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await clearTestDb();
});

describe("per-username login limit", () => {
  it("is wired onto POST /api/auth/login", () => {
    const loginLayer = authRoutes.stack.find(
      (layer) => layer.route?.path === "/login" && layer.route?.methods?.post
    );
    const handles = loginLayer.route.stack.map((layer) => layer.handle);
    expect(handles).toContain(loginUsernameLimiter);
  });

  it("keys on the normalised username and ignores non-strings", () => {
    expect(loginUsernameKey({ body: { username: "  DevUser " } })).toBe("login-user:devuser");
    expect(loginUsernameKey({ body: { username: { $ne: null } } })).toBeNull();
    expect(loginUsernameKey({ body: { username: "   " } })).toBeNull();
    expect(loginUsernameKey({})).toBeNull();
  });

  // The shared limiters are switched off under NODE_ENV=test, so this builds
  // one from the real per-username settings to check how it counts.
  function limitedApp() {
    const limited = express();
    limited.use(express.json());
    limited.post("/login", rateLimit(LOGIN_USERNAME_LIMIT), (req, res) =>
      res.status(req.body.password === "right" ? 200 : 401).json({})
    );
    return (username, password) => request(limited).post("/login").send({ username, password });
  }

  it("blocks a username after the max failures, without affecting other usernames", async () => {
    const send = limitedApp();
    for (let i = 0; i < LOGIN_USERNAME_LIMIT.max; i++) {
      expect((await send("victim", "wrong")).status).toBe(401);
    }
    expect((await send("victim", "wrong")).status).toBe(429);
    expect((await send("VICTIM", "right")).status).toBe(429); // same account, any casing
    expect((await send("someone-else", "wrong")).status).toBe(401);
  });

  it("doesn't count successful logins", async () => {
    const send = limitedApp();
    for (let i = 0; i < 20; i++) expect((await send("dev", "right")).status).toBe(200);
    expect((await send("dev", "wrong")).status).toBe(401);
  });
});

describe("POST /api/auth/login input and timing", () => {
  it("runs bcrypt even when the username doesn't exist (same work as a wrong password)", async () => {
    const compare = vi.spyOn(bcrypt, "compare");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "doesnotexist", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(compare).toHaveBeenCalledTimes(1);
  });

  it("400s (not 500) for non-string username or password", async () => {
    await createUser({ username: "realuser", password: "Password123!" });

    const objectUsername = await request(app)
      .post("/api/auth/login")
      .send({ username: { $ne: null }, password: "Password123!" });
    const numberPassword = await request(app)
      .post("/api/auth/login")
      .send({ username: "realuser", password: 12345 });

    expect(objectUsername.status).toBe(400);
    expect(numberPassword.status).toBe(400);
  });

  it("400s (not 500) when there's no JSON body at all", async () => {
    const res = await request(app).post("/api/auth/login");
    expect(res.status).toBe(400);
  });
});
