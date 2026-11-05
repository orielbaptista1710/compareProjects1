// backend/fakeTests/passwordResetRequest.test.js
//
// The developer/admin "Forgot password?" popup posts here (AUTH-05). The route
// used to be unmounted, so the popup always got a 404.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import passwordResetRequestRoutes from "../routes/passwordResetRequestRoutes.js";
import errorHandler from "../middleware/errorMiddleware.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import { startTestDb, stopTestDb, clearTestDb } from "./helpers/db.js";
import { createUser } from "./helpers/fixtures.js";

const app = express();
app.use(express.json());
app.use("/api/password-reset-requests", passwordResetRequestRoutes);
app.use(errorHandler);

beforeAll(startTestDb);
afterAll(stopTestDb);
afterEach(clearTestDb);

describe("POST /api/password-reset-requests", () => {
  it("stores the request and answers the same for known and unknown usernames", async () => {
    const user = await createUser();

    const known = await request(app)
      .post("/api/password-reset-requests")
      .send({ username: user.username, phone: "9876543210" });
    const unknown = await request(app)
      .post("/api/password-reset-requests")
      .send({ username: "nobody-here", phone: "9876543210" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body); // no username enumeration
    expect(await PasswordResetRequest.countDocuments()).toBe(2);
  });

  it("rejects an invalid body with 400", async () => {
    const res = await request(app)
      .post("/api/password-reset-requests")
      .send({ username: "", phone: "1" });

    expect(res.status).toBe(400);
  });
});

describe("server.js", () => {
  it("mounts the password reset route", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("../server.js", import.meta.url), "utf8");
    expect(source).toMatch(/^app\.use\('\/api\/password-reset-requests', passwordResetRequestRoutes\)/m);
  });
});
