// frontend-vite/src/hooks/__tests__/useHeartProperty.test.js
//
// IMPORTANT — pre-existing bug documented by this suite:
// `useHeartProperty.js` calls `success(...)` and `error(...)` on the toggle
// path, but only `toast` (default export) is imported from "react-hot-toast".
// `success` / `error` are undefined identifiers, so ANY authenticated call to
// handleToggleHeart currently throws an uncaught ReferenceError — on both the
// success path (from `success(...)`) and the failure path (the catch block
// itself calls the equally-undefined `error(...)`).
//
// Per the task constraints we are not modifying app code, so the tests below
// assert the *actual current behavior* (it throws). This gives you a safety
// net: the moment someone fixes the bug (e.g. swaps in `toast.success` /
// `toast.error`), these specific tests will fail loudly and tell you to
// update them — which is exactly what you want from a regression suite.
//
// Recommended fix (not applied here):
//   success(isSaved ? "Removed from shortlist" : "Added to shortlist")
//     -> toast.success(isSaved ? "Removed from shortlist" : "Added to shortlist")
//   error("Something went wrong.")
//     -> toast.error("Something went wrong.")

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useNavigate } from "react-router-dom";
import useHeartProperty from "../useHeartProperty";
import { CustomerActivityContext } from "../../contexts/CustomerActivityContext";
import { AuthContext } from "../../contexts/AuthContext";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

// react-hot-toast is imported by the hook module; mocked so tests don't
// depend on its real implementation (e.g. DOM portal rendering) and so we
// can assert on it if/when the bug above gets fixed.
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function makeWrapper({ heartProperties = [], toggleHeart = vi.fn(), currentUser = null } = {}) {
  const Wrapper = ({ children }) => (
    <AuthContext.Provider value={{ currentUser }}>
      <CustomerActivityContext.Provider value={{ heartProperties, toggleHeart }}>
        {children}
      </CustomerActivityContext.Provider>
    </AuthContext.Provider>
  );
  return Wrapper;
}

describe("useHeartProperty", () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------
  // isSaved derivation
  // ---------------------------------------------------------------------
  describe("isSaved", () => {
    it("returns false when propertyId is not provided", () => {
      const { result } = renderHook(() => useHeartProperty(undefined), {
        wrapper: makeWrapper({ heartProperties: [{ _id: "p1" }] }),
      });
      expect(result.current.isSaved).toBe(false);
    });

    it("returns false when propertyId is 0 (falsy-but-technically-valid edge case)", () => {
      // Why: `!propertyId` treats 0 the same as undefined/null. Worth pinning
      // down explicitly since a numeric/falsy id is a realistic edge case
      // depending on how IDs are generated upstream.
      const { result } = renderHook(() => useHeartProperty(0), {
        wrapper: makeWrapper({ heartProperties: [{ _id: 0 }] }),
      });
      expect(result.current.isSaved).toBe(false);
    });

    it("returns true when heartProperties contains an object whose _id matches propertyId", () => {
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ heartProperties: [{ _id: "p1" }, { _id: "p2" }] }),
      });
      expect(result.current.isSaved).toBe(true);
    });

    it("returns true when heartProperties contains bare id strings instead of objects", () => {
      // Why: the code explicitly supports `(p._id || p)`, meaning
      // heartProperties may be an array of plain id strings (not full
      // property objects) depending on how the context is populated.
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ heartProperties: ["p1", "p2"] }),
      });
      expect(result.current.isSaved).toBe(true);
    });

    it("returns false when propertyId does not match any entry", () => {
      const { result } = renderHook(() => useHeartProperty("p99"), {
        wrapper: makeWrapper({ heartProperties: [{ _id: "p1" }] }),
      });
      expect(result.current.isSaved).toBe(false);
    });

    it("returns false when heartProperties is empty", () => {
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ heartProperties: [] }),
      });
      expect(result.current.isSaved).toBe(false);
    });

    it("matches across type differences via toString() (e.g. numeric propertyId vs string _id)", () => {
      // Why: MongoDB ObjectIds and numeric/string ids are compared via
      // .toString(), so a numeric propertyId must still match a string _id.
      const { result } = renderHook(() => useHeartProperty(123), {
        wrapper: makeWrapper({ heartProperties: [{ _id: "123" }] }),
      });
      expect(result.current.isSaved).toBe(true);
    });

    it("recomputes isSaved when heartProperties changes (memoization dependency check)", () => {
      const wrapper = ({ children, heartProperties }) => (
        <AuthContext.Provider value={{ currentUser: null }}>
          <CustomerActivityContext.Provider value={{ heartProperties, toggleHeart: vi.fn() }}>
            {children}
          </CustomerActivityContext.Provider>
        </AuthContext.Provider>
      );

      const { result, rerender } = renderHook(({ heartProperties }) => useHeartProperty("p1"), {
        wrapper,
        initialProps: { heartProperties: [] },
      });
      expect(result.current.isSaved).toBe(false);

      rerender({ heartProperties: [{ _id: "p1" }] });
      expect(result.current.isSaved).toBe(true);
    });
  });

  // ---------------------------------------------------------------------
  // handleToggleHeart — unauthenticated path
  // ---------------------------------------------------------------------
  describe("handleToggleHeart when logged out", () => {
    it("does not call toggleHeart and redirects to /customer-login after a 1500ms delay", async () => {
      vi.useFakeTimers();
      const toggleHeart = vi.fn();
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: null, toggleHeart }),
      });

      act(() => {
        result.current.handleToggleHeart();
      });

      expect(toggleHeart).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled(); // not yet — still within the delay

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/customer-login");
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("does not navigate before the 1500ms delay elapses (boundary check)", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: null }),
      });

      act(() => {
        result.current.handleToggleHeart();
      });
      act(() => {
        vi.advanceTimersByTime(1499);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // handleToggleHeart — authenticated path (documents the ReferenceError bug)
  // ---------------------------------------------------------------------
  describe("handleToggleHeart when logged in (documents existing success()/error() bug)", () => {
    it("calls toggleHeart with the current propertyId before hitting the broken notification call", async () => {
      const toggleHeart = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: { id: "u1" }, toggleHeart }),
      });

      // We still expect a rejection (see bug tests below), but toggleHeart
      // itself must have been invoked correctly before the crash.
      await act(async () => {
        await result.current.handleToggleHeart().catch(() => {});
      });

      expect(toggleHeart).toHaveBeenCalledWith("p1");
    });

    it("BUG: rejects with a ReferenceError when toggleHeart succeeds, because success() is not defined/imported", async () => {
      const toggleHeart = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: { id: "u1" }, toggleHeart }),
      });

      await expect(result.current.handleToggleHeart()).rejects.toThrow(ReferenceError);
    });

    it("BUG: rejects with a ReferenceError when toggleHeart fails, because the catch block's error() is also not defined/imported", async () => {
      const toggleHeart = vi.fn().mockRejectedValue(new Error("network down"));
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: { id: "u1" }, toggleHeart }),
      });

      await expect(result.current.handleToggleHeart()).rejects.toThrow(ReferenceError);
      expect(toggleHeart).toHaveBeenCalledWith("p1");
    });

    it("does not redirect to login when the user is authenticated, even though the call ultimately throws", async () => {
      const toggleHeart = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: makeWrapper({ currentUser: { id: "u1" }, toggleHeart }),
      });

      await result.current.handleToggleHeart().catch(() => {});

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});