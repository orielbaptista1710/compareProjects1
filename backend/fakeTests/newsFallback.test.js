// backend/fakeTests/newsFallback.test.js
//
// GNews calls time out after 5 s, and when GNews fails (down, or the free
// plan's daily quota is used up) the last good article list is served instead
// of a 500. GNews is mocked; the controller is re-imported per test so its
// in-memory cache and last-good copy start empty.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));
vi.mock("axios", () => ({ default: { get: axiosGet } }));

const ARTICLE = {
  title: "Housing sales rise",
  description: "d",
  image: null,
  publishedAt: "2026-10-01T00:00:00Z",
  url: "https://news.example/a",
  source: { name: "Example" },
};
const ok = () => ({ data: { articles: [ARTICLE] } });
const fail = () => Object.assign(new Error("Request failed with status code 403"), { response: { status: 403 } });

let app;

beforeEach(async () => {
  vi.resetModules();
  axiosGet.mockReset();
  const { default: logger } = await import("../utils/logger.js");
  vi.spyOn(logger, "error").mockImplementation(() => {});
  const { getRealEstateNews } = await import("../controllers/newsController.js");
  app = express();
  app.get("/news", getRealEstateNews);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const getNews = () => request(app).get("/news");
const expireCache = () => vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000 + 1000); // past the 3 h TTL

describe("GET /api/news/real-estate", () => {
  it("calls GNews with a timeout, so a hung GNews can't hang the request", async () => {
    axiosGet.mockResolvedValue(ok());

    const res = await getNews();

    expect(res.status).toBe(200);
    expect(axiosGet.mock.calls[0][1].timeout).toBe(5000);
  });

  it("500s when GNews fails and there has never been a good response", async () => {
    axiosGet.mockRejectedValue(fail());

    const res = await getNews();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to fetch news" });
  });

  it("serves the last good articles when GNews fails after the cache expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    axiosGet.mockResolvedValueOnce(ok());
    expect((await getNews()).status).toBe(200);

    expireCache();
    axiosGet.mockRejectedValueOnce(fail());
    const res = await getNews();

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Housing sales rise");
  });

  it("doesn't retry GNews on every request while it's failing", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    axiosGet.mockResolvedValueOnce(ok());
    await getNews();

    expireCache();
    axiosGet.mockRejectedValue(fail());
    await getNews(); // fails, serves the stale copy for 10 min
    await getNews();
    await getNews();

    expect(axiosGet).toHaveBeenCalledTimes(2);
  });
});
