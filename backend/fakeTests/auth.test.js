// backend/fakeTests/auth.test.js
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./helpers/testApp.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser, createAdminUser } from "./helpers/fixtures.js";
import User from "../models/User.js";

beforeAll(async () => { 
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

// Raw Set-Cookie headers look like "token=abc; Path=/; HttpOnly; SameSite=Lax".
// Requests only need the "name=value" part.
function findSetCookie(res, name) {
  return res.headers["set-cookie"]?.find((c) => c.startsWith(`${name}=`));
}
function cookieHeaderFor(setCookieString) {
  return setCookieString.split(";")[0];
}
function attr(setCookieString, name) {
  return setCookieString.match(new RegExp(`;\\s*${name}=([^;]+)`, "i"))?.[1];
}

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and sets an httpOnly session cookie", async () => {
    await createUser({ username: "devuser", password: "Password123!" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "devuser", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("devuser");
    expect(res.body.user.password).toBeUndefined();

    const cookie = findSetCookie(res, "token");
    expect(cookie).toBeTruthy();
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("gives a wrong password and an unknown username the same status and message (no user-enumeration via the response)", async () => {
    await createUser({ username: "realuser", password: "Password123!" });

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ username: "realuser", password: "WrongPassword!" });

    const unknownUser = await request(app)
      .post("/api/auth/login")
      .send({ username: "doesnotexist", password: "Password123!" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownUser.body.message);
  });

  it("blocks a deactivated account with 403", async () => {
    await createUser({
      username: "inactiveuser",
      password: "Password123!",
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "inactiveuser", password: "Password123!" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it("400s when username or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "onlyusername" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("401s with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("401s with a garbage token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", ["token=garbage"]);

    expect(res.status).toBe(401);
  });

  it("401s with a token forged using a different secret (proves JWT_SECRET is actually enforced)", async () => {
    const admin = await createAdminUser();
    const forged = jwt.sign(
      { id: admin._id.toString(), role: "admin" },
      "a-completely-different-secret"
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${forged}`]);

    expect(res.status).toBe(401);
  });

  it("returns the user's current role for a valid session cookie", async () => {
    await createAdminUser({ username: "admin1", password: "Password123!" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin1", password: "Password123!" });
    const cookie = cookieHeaderFor(findSetCookie(login, "token"));

    const res = await request(app).get("/api/auth/me").set("Cookie", [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });

  it("403s if the account is deactivated after the token was already issued (deactivation takes effect immediately, not just at next login)", async () => {
    const user = await createUser({ username: "user1", password: "Password123!" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "user1", password: "Password123!" });
    const cookie = cookieHeaderFor(findSetCookie(login, "token"));

    await User.findByIdAndUpdate(user._id, { isActive: false });

    const res = await request(app).get("/api/auth/me").set("Cookie", [cookie]);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the token cookie with attributes matching how login set it (regression test: previously logout silently no-opped because the clearing cookie's SameSite/Secure attributes didn't match the one login set, so browsers dropped the clear instruction)", async () => {
    await createUser({ username: "logoutuser", password: "Password123!" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "logoutuser", password: "Password123!" });
    const loginCookie = findSetCookie(login, "token");

    const logout = await request(app).post("/api/auth/logout");
    const clearCookie = findSetCookie(logout, "token");

    expect(logout.status).toBe(200);
    expect(clearCookie).toBeTruthy();
    expect(attr(clearCookie, "SameSite")).toBe(attr(loginCookie, "SameSite"));
    expect(clearCookie.includes("HttpOnly")).toBe(loginCookie.includes("HttpOnly"));
    expect(/;\s*Secure/i.test(clearCookie)).toBe(/;\s*Secure/i.test(loginCookie));
    expect(clearCookie).toMatch(/Expires=/i);
  });
});
