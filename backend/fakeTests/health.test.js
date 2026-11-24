// backend/fakeTests/health.test.js
//
// /api/health is Render's health check (Mongo only, must never depend on Postgres).
// /api/health/deep is for uptime monitors (Mongo + Postgres, 503 if either is down).
// Prisma is mocked and Mongo's connection state is faked, so no real database is used.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";

const prismaMock = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
vi.mock("../config/prisma.js", () => ({ default: prismaMock }));
vi.mock("../utils/logger.js", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { default: healthRoutes, checkPostgres, POSTGRES_TIMEOUT_MS } = await import(
  "../routes/healthRoutes.js"
);

const app = express();
app.use("/api/health", healthRoutes);

let readyState;
beforeEach(() => {
  prismaMock.$queryRaw.mockReset();
  readyState = vi.spyOn(mongoose.connection, "readyState", "get");
});
afterEach(() => {
  readyState.mockRestore();
});

describe("GET /api/health (Render)", () => {
  it("is 200 when Mongo is connected, and never queries Postgres", async () => {
    readyState.mockReturnValue(1);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", mongo: true });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it("is 503 when Mongo is not connected", async () => {
    readyState.mockReturnValue(0);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", mongo: false });
  });
});

describe("GET /api/health/deep (uptime monitor)", () => {
  it("is 200 when Mongo and Postgres are both up", async () => {
    readyState.mockReturnValue(1);
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await request(app).get("/api/health/deep");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", mongo: true, postgres: true });
  });

  it("is 503 when Postgres is down, and does not leak the error", async () => {
    readyState.mockReturnValue(1);
    prismaMock.$queryRaw.mockRejectedValue(new Error("connect ECONNREFUSED secret-host:5432"));
    const res = await request(app).get("/api/health/deep");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", mongo: true, postgres: false });
    expect(JSON.stringify(res.body)).not.toContain("secret-host");
  });

  it("is 503 when Mongo is down but Postgres is up", async () => {
    readyState.mockReturnValue(0);
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await request(app).get("/api/health/deep");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", mongo: false, postgres: true });
  });

  it("while Postgres is down, /api/health still says 200 (Render must not restart the site)", async () => {
    readyState.mockReturnValue(1);
    prismaMock.$queryRaw.mockRejectedValue(new Error("down"));
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});

describe("checkPostgres timeout", () => {
  it("reports down instead of hanging when Postgres never answers", async () => {
    vi.useFakeTimers();
    try {
      prismaMock.$queryRaw.mockReturnValue(new Promise(() => {})); // never resolves
      const pending = checkPostgres();
      await vi.advanceTimersByTimeAsync(POSTGRES_TIMEOUT_MS);
      await expect(pending).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
