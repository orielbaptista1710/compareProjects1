// backend/fakeTests/originCheck.test.js
// SEC-06: cross-site writes are refused; same-site, no-Origin and reads pass.
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import originCheck from "../middleware/originCheck.js";

const ALLOWED = "http://localhost:5173";
const EVIL = "https://evil-site.example";

const app = express();
app.use(originCheck([ALLOWED]));
app.all("/action", (req, res) => res.json({ ran: true }));

describe("originCheck (CSRF)", () => {
  it("allows a write from the allowed frontend", async () => {
    const res = await request(app).post("/action").set("Origin", ALLOWED);
    expect(res.status).toBe(200);
  });

  it.each(["post", "put", "patch", "delete"])("refuses a %s from an unknown site", async (method) => {
    const res = await request(app)[method]("/action").set("Origin", EVIL);
    expect(res.status).toBe(403);
    expect(res.body.ran).toBeUndefined();
  });

  it("allows a write with no Origin header (curl, server-to-server)", async () => {
    const res = await request(app).post("/action");
    expect(res.status).toBe(200);
  });

  it("allows reads from any site", async () => {
    const res = await request(app).get("/action").set("Origin", EVIL);
    expect(res.status).toBe(200);
  });

  it("does not treat a lookalike origin as allowed", async () => {
    const res = await request(app).post("/action").set("Origin", `${ALLOWED}.evil-site.example`);
    expect(res.status).toBe(403);
  });
});
