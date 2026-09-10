import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";
import toastError from "../toastError";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function errorWithStatus(status, data) {
  return { response: { status, data } };
}

describe("toastError", () => {
  it("shows a fixed message for 403 (deactivated account), ignoring the server's own message", () => {
    toastError(errorWithStatus(403, { message: "ignored" }));
    expect(toast.error).toHaveBeenCalledWith(
      "Your account has been deactivated. Contact admin."
    );
  });

  it("shows a fixed message for 429 (rate limited)", () => {
    toastError(errorWithStatus(429));
    expect(toast.error).toHaveBeenCalledWith("Too many requests. Please slow down.");
  });

  it("shows a fixed message for 401 (session expired)", () => {
    toastError(errorWithStatus(401));
    expect(toast.error).toHaveBeenCalledWith("Session expired. Please log in again.");
  });

  it("shows a fixed message for 404, not the backend's own message", () => {
    toastError(errorWithStatus(404, { message: "Property not found" }));
    expect(toast.error).toHaveBeenCalledWith("Resource not found.");
  });

  it("shows a fixed message for 500", () => {
    toastError(errorWithStatus(500));
    expect(toast.error).toHaveBeenCalledWith("Server error. Please try again shortly.");
  });

  it("shows a network-unreachable message when there is no response at all (request never reached the server)", () => {
    toastError({});
    expect(toast.error).toHaveBeenCalledWith(
      "Server unreachable. Try again in 30 seconds."
    );
  });

  it("surfaces the backend's own message for other statuses (e.g. 400)", () => {
    toastError(errorWithStatus(400, { message: "ids must be a non-empty array" }));
    expect(toast.error).toHaveBeenCalledWith("ids must be a non-empty array");
  });

  it("falls back to the caller-provided fallback when the backend sends no message", () => {
    toastError(errorWithStatus(400, {}), "Failed to do the thing");
    expect(toast.error).toHaveBeenCalledWith("Failed to do the thing");
  });

  it("falls back to the default message when neither a server message nor a custom fallback is given", () => {
    toastError(errorWithStatus(400, {}));
    expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
  });
});
