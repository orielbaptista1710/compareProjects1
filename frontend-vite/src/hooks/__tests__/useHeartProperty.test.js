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



// frontend-vite/src/hooks/__tests__/useHeartProperty.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CustomerActivityContext } from "../../contexts/CustomerActivityContext";
import { AuthContext } from "../../contexts/AuthContext";
import useHeartProperty from "../useHeartProperty";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function wrapper({ heartProperties = [], toggleHeart = vi.fn(), currentUser = null }) {
  return ({ children }) => (
    <MemoryRouter>
      <AuthContext.Provider value={{ currentUser }}>
        <CustomerActivityContext.Provider value={{ heartProperties, toggleHeart }}>
          {children}
        </CustomerActivityContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("useHeartProperty", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.useRealTimers();
  });

  it("reports isSaved=false when propertyId is not in heartProperties", () => {
    const { result } = renderHook(() => useHeartProperty("p1"), {
      wrapper: wrapper({ heartProperties: [{ _id: "p2" }] }),
    });
    expect(result.current.isSaved).toBe(false);
  });

  it("reports isSaved=true when propertyId matches an entry (object form)", () => {
    const { result } = renderHook(() => useHeartProperty("p1"), {
      wrapper: wrapper({ heartProperties: [{ _id: "p1" }] }),
    });
    expect(result.current.isSaved).toBe(true);
  });

  it("reports isSaved=true when heartProperties holds raw id strings", () => {
    const { result } = renderHook(() => useHeartProperty("p1"), {
      wrapper: wrapper({ heartProperties: ["p1"] }),
    });
    expect(result.current.isSaved).toBe(true);
  });

  it("returns false (not throw) when propertyId is falsy", () => {
    const { result } = renderHook(() => useHeartProperty(undefined), {
      wrapper: wrapper({ heartProperties: [{ _id: "p1" }] }),
    });
    expect(result.current.isSaved).toBe(false);
  });

  it("redirects unauthenticated users to /customer-login instead of toggling", async () => {
    vi.useFakeTimers();
    const toggleHeart = vi.fn();
    const { result } = renderHook(() => useHeartProperty("p1"), {
      wrapper: wrapper({ currentUser: null, toggleHeart }),
    });

    await act(async () => {
      result.current.handleToggleHeart();
      vi.advanceTimersByTime(1500);
    });

    expect(toggleHeart).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/customer-login");
    vi.useRealTimers();
  });

  it("calls toggleHeart with the property id for a logged-in user", async () => {
    const toggleHeart = vi.fn().mockResolvedValue();
    const { result } = renderHook(() => useHeartProperty("p1"), {
      wrapper: wrapper({ currentUser: { uid: "u1" }, toggleHeart }),
    });

    await act(async () => {
      await result.current.handleToggleHeart();
    });

    expect(toggleHeart).toHaveBeenCalledWith("p1");
  });

  // --- This test documents a real bug, it is expected to currently FAIL ---
  //
  // handleToggleHeart calls bare `success(...)` / `error(...)` instead of
  // `toast.success(...)` / `toast.error(...)`. Neither is imported, so on
  // every successful toggle the hook throws a ReferenceError, and inside
  // the catch block it throws AGAIN calling the equally-undefined `error`.
  // That second throw is unhandled — it isn't caught by anything — so it
  // surfaces as an unhandled promise rejection in production on literally
  // every heart-toggle. Fix: `import { toast } from "react-hot-toast"` and
  // call `toast.success` / `toast.error`.
  it.fails(
    "does not throw a ReferenceError after a successful toggle (KNOWN BUG — fix toast import)",
    async () => {
      const toggleHeart = vi.fn().mockResolvedValue();
      const { result } = renderHook(() => useHeartProperty("p1"), {
        wrapper: wrapper({ currentUser: { uid: "u1" }, toggleHeart }),
      });

      await act(async () => {
        await result.current.handleToggleHeart();
      });
      // If this line is reached without throwing, the bug is fixed —
      // flip this test from `it.fails` to `it` once toast is wired up.
    }
  );
});