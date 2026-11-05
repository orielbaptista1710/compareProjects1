import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mocked so the real firebase SDK never loads for this test — we only care
// about how api.js reacts to CustomerAuth.currentUser, not Firebase itself.
vi.mock("../config/firebase", () => ({
  CustomerAuth: { currentUser: null },
}));  

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

import { CustomerAuth } from "../config/firebase";
import API, { isDeveloperRoute } from "../api/api";
import toast from "react-hot-toast";

beforeEach(() => {
  CustomerAuth.currentUser = null;
});

describe("isDeveloperRoute", () => {
  it.each([
    ["/api/auth/me", true],
    ["/api/auth/login", true],
    ["/api/properties/my-properties", true],
    ["/api/admin/properties", true],
    ["/api/customers/me", false],
    ["/api/customerActivity/my-activity", false],
    ["/api/news", false],
    [undefined, false],
  ])("classifies %s as a developer/admin route = %s", (url, expected) => {
    expect(isDeveloperRoute(url)).toBe(expected);
  });
});

describe("request interceptor — Firebase token scoping (regression test: this previously leaked a Firebase bearer token into developer/admin requests, which protect.js would try and fail to verify as a JWT)", () => {
  function getRequestInterceptor() {
    return API.interceptors.request.handlers[0].fulfilled;
  }

  it("does not attach a Firebase Authorization header to a developer/admin route, even when a customer is signed in", async () => {
    CustomerAuth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue("firebase-token-123"),
    };
    const interceptor = getRequestInterceptor();

    const config = await interceptor({ url: "/api/auth/me", headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
    expect(CustomerAuth.currentUser.getIdToken).not.toHaveBeenCalled();
  });

  it("attaches a Firebase Authorization header to a customer route when a customer is signed in", async () => {
    CustomerAuth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue("firebase-token-123"),
    };
    const interceptor = getRequestInterceptor();

    const config = await interceptor({ url: "/api/customers/me", headers: {} });

    expect(config.headers.Authorization).toBe("Bearer firebase-token-123");
  });

  it("attaches no Authorization header at all when no customer is signed in", async () => {
    CustomerAuth.currentUser = null;
    const interceptor = getRequestInterceptor();

    const config = await interceptor({ url: "/api/customers/me", headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe("response interceptor — 401 handling", () => {
  const getErrorInterceptor = () => API.interceptors.response.handlers[0].rejected;
  const unauthorized = (url) => ({ response: { status: 401 }, config: { url } });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // the redirect is on a timer; never let it fire in jsdom
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("an expired developer/admin session says so and schedules a redirect to /login", async () => {
    const error = unauthorized("/api/properties/my-properties");

    await expect(getErrorInterceptor()(error)).rejects.toBe(error);

    expect(toast.error).toHaveBeenCalledWith("Session expired. Please log in again.");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("a customer 401 never sends the customer to the developer /login page", async () => {
    const error = unauthorized("/api/customers/me");

    await expect(getErrorInterceptor()(error)).rejects.toBe(error);

    expect(toast.error).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
