// backend/fakeTests/gracefulShutdown.test.js
//
// On SIGTERM (every Render deploy) in-flight requests must finish before the
// databases close; previously the databases closed first and those requests failed.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import logger from "../utils/logger.js";
import { createShutdown } from "../utils/gracefulShutdown.js";

beforeEach(() => {
  vi.spyOn(logger, "info").mockImplementation(() => {});
  vi.spyOn(logger, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("graceful shutdown", () => {
  it("lets an in-flight request finish before closing the databases", async () => {
    const order = [];
    let requestStarted;
    const started = new Promise((resolve) => { requestStarted = resolve; });

    const app = express();
    app.get("/slow", async (req, res) => {
      requestStarted();
      await wait(200);
      order.push("response sent");
      res.json({ ok: true });
    });
    const server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    const exit = vi.fn();
    const shutdown = createShutdown({
      getServer: () => server,
      closeResources: async () => { order.push("databases closed"); },
      exit,
    });

    const response = fetch(`http://127.0.0.1:${server.address().port}/slow`);
    await started;
    const done = shutdown("SIGTERM");

    expect((await response).status).toBe(200);
    await done;
    expect(order).toEqual(["response sent", "databases closed"]);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("closes the databases even if the server never started", async () => {
    const closeResources = vi.fn(async () => {});
    const exit = vi.fn();

    await createShutdown({ getServer: () => undefined, closeResources, exit })("SIGINT");

    expect(closeResources).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("ignores a second signal while already shutting down", async () => {
    const closeResources = vi.fn(async () => {});
    const shutdown = createShutdown({ getServer: () => undefined, closeResources, exit: vi.fn() });

    await Promise.all([shutdown("SIGTERM"), shutdown("SIGTERM")]);

    expect(closeResources).toHaveBeenCalledTimes(1);
  });

  it("passes a crash's exit code through", async () => {
    const exit = vi.fn();
    await createShutdown({ getServer: () => undefined, closeResources: async () => {}, exit })(
      "uncaughtException",
      1
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  
  it("keeps a crash's exit code when it arrives during a SIGTERM shutdown", async () => {
    const exit = vi.fn();
    const shutdown = createShutdown({
      getServer: () => ({ close: (cb) => setTimeout(cb, 50) }), // in-flight requests still finishing
      closeResources: async () => {},
      exit,
    }); 

    const done = shutdown("SIGTERM");
    shutdown("uncaughtException", 1);
    await done;

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("forces an exit if closing hangs past the timeout", async () => {
    const exit = vi.fn();
    createShutdown({
      getServer: () => undefined,
      closeResources: () => new Promise(() => {}), // never finishes
      timeoutMs: 50,
      exit,
    })("SIGTERM");

    await wait(120);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
