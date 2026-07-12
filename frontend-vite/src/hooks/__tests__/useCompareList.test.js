// frontend-vite/src/hooks/__tests__/useCompareList.test.js
//
// Framework: Vitest + @testing-library/react
// Why Vitest: this is a Vite project, so Vitest gives native ESM/JSX support,
// the same jsdom environment, and Jest-compatible APIs (vi ~= jest) without
// needing a separate Babel/Jest transform pipeline. All `vi.*` calls below
// map 1:1 to `jest.*` if this project ever moves to Jest.

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import useCompareList from "../useCompareList";

const STORAGE_KEY = "compareList";

const property = (id, extra = {}) => ({ _id: id, title: `Property ${id}`, ...extra });

describe("useCompareList", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // Silence expected console.error calls from the hook's own catch blocks
    // so test output stays clean; we still assert on them explicitly where relevant.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // ---------------------------------------------------------------------
  // Initialization (lazy useState initializer)
  // ---------------------------------------------------------------------
  describe("initialization", () => {
    it("initializes with an empty array when localStorage has no saved list", () => {
      // Why: this is the first-visit / fresh-browser path — the most common
      // real-world state — and must not crash or return undefined.
      const { result } = renderHook(() => useCompareList());
      expect(result.current.compareList).toEqual([]);
    });

    it("initializes from valid JSON already present in localStorage", () => {
      // Why: verifies the hook correctly hydrates state on mount, e.g. after
      // a page refresh, which is the whole point of persisting to localStorage.
      const saved = [property("p1"), property("p2")];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useCompareList());
      expect(result.current.compareList).toEqual(saved);
    });

    it("falls back to an empty array and logs an error when localStorage contains corrupted JSON", () => {
      // Why: localStorage is user/extension-editable and can contain garbage
      // (partial writes, manual tampering, old incompatible shape). The hook
      // must degrade gracefully rather than crash the whole app on mount.
      localStorage.setItem(STORAGE_KEY, "{not-valid-json");

      const { result } = renderHook(() => useCompareList());

      expect(result.current.compareList).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to parse compare list:",
        expect.any(Error)
      );
    });

    it("falls back to an empty array when localStorage.getItem itself throws", () => {
      // Why: some browsers (Safari private mode, disabled storage, some
      // in-app webviews) throw on any localStorage access, not just on parse.
      // This is a distinct failure mode from "bad JSON" and needs its own test.
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const { result } = renderHook(() => useCompareList());

      expect(result.current.compareList).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to parse compare list:",
        expect.any(Error)
      );
    });
  });

  // ---------------------------------------------------------------------
  // Persistence effect (useEffect -> localStorage.setItem)
  // ---------------------------------------------------------------------
  describe("persistence to localStorage", () => {
    it("writes the current compareList to localStorage whenever it changes", () => {
      // Why: this is the hook's core contract — in-memory state and
      // localStorage must stay in sync so a refresh doesn't lose data.
      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property("p1"));
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([property("p1")]);
    });

    it("writes an empty array to localStorage on initial mount (even before any changes)", () => {
      // Why: the effect runs on mount too (empty dependency change from
      // undefined -> []), so a brand-new session should still write "[]"
      // rather than leaving a stale/missing key.
      renderHook(() => useCompareList());
      expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");
    });

    it("logs an error but does not throw when localStorage.setItem fails (e.g. quota exceeded)", () => {
      // Why: localStorage has a hard size limit (~5-10MB). Hitting it should
      // never crash the compare feature — it should fail silently with a log.
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useCompareList());

      expect(() => {
        act(() => {
          result.current.addToCompare(property("p1"));
        });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        "Failed to save compare list:",
        expect.any(Error)
      );
    });
  });

  // ---------------------------------------------------------------------
  // addToCompare
  // ---------------------------------------------------------------------
  describe("addToCompare", () => {
    it("adds a new property to an empty list", () => {
      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property("p1"));
      });

      expect(result.current.compareList).toEqual([property("p1")]);
    });

    it("appends to an existing list, preserving prior entries and order", () => {
      const { result } = renderHook(() => useCompareList());

      act(() => result.current.addToCompare(property("p1")));
      act(() => result.current.addToCompare(property("p2")));

      expect(result.current.compareList).toEqual([property("p1"), property("p2")]);
    });

    it("does not add a duplicate property (matched by _id) and leaves the list unchanged", () => {
      // Why: business rule — a property can't appear twice in the compare
      // list, even if the passed object reference/content differs slightly.
      const { result } = renderHook(() => useCompareList());

      act(() => result.current.addToCompare(property("p1", { price: 100 })));
      act(() => result.current.addToCompare(property("p1", { price: 999 }))); // same _id, different payload

      expect(result.current.compareList).toHaveLength(1);
      expect(result.current.compareList[0].price).toBe(100); // original entry untouched
    });

    it("allows adding up to exactly 4 properties (boundary: at limit)", () => {
      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property("p1"));
        result.current.addToCompare(property("p2"));
        result.current.addToCompare(property("p3"));
        result.current.addToCompare(property("p4"));
      });

      expect(result.current.compareList).toHaveLength(4);
    });

    it("silently rejects a 5th property once the list already has 4 (boundary: over limit)", () => {
      // Why: this is the hook's other key business rule (max 4 for
      // side-by-side comparison UI). Must not throw, must not add the 5th.
      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property("p1"));
        result.current.addToCompare(property("p2"));
        result.current.addToCompare(property("p3"));
        result.current.addToCompare(property("p4"));
        result.current.addToCompare(property("p5"));
      });

      expect(result.current.compareList).toHaveLength(4);
      expect(result.current.compareList.map((p) => p._id)).not.toContain("p5");
    });
  });

  // ---------------------------------------------------------------------
  // removeFromCompare
  // ---------------------------------------------------------------------
  describe("removeFromCompare", () => {
    it("removes the property matching the given id", () => {
      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property("p1"));
        result.current.addToCompare(property("p2"));
      });
      act(() => result.current.removeFromCompare("p1"));

      expect(result.current.compareList).toEqual([property("p2")]);
    });

    it("is a no-op when the id is not present in the list", () => {
      // Why: guards against errors from stale UI state (e.g. double-click on
      // a "remove" button after the item was already removed elsewhere).
      const { result } = renderHook(() => useCompareList());

      act(() => result.current.addToCompare(property("p1")));
      act(() => result.current.removeFromCompare("does-not-exist"));

      expect(result.current.compareList).toEqual([property("p1")]);
    });

    it("handles removeFromCompare called on an already-empty list without throwing", () => {
      const { result } = renderHook(() => useCompareList());

      expect(() => {
        act(() => result.current.removeFromCompare("p1"));
      }).not.toThrow();
      expect(result.current.compareList).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // Exposed setCompareList escape hatch
  // ---------------------------------------------------------------------
  describe("setCompareList", () => {
    it("allows fully replacing the list directly, bypassing addToCompare's rules", () => {
      // Why: the hook explicitly exposes the raw setter (per the code
      // comment "now also returning setCompareList"). Consumers may use it
      // for bulk operations (e.g. "clear all"), so it must work as a normal
      // setState function, including functional updates.
      const { result } = renderHook(() => useCompareList());

      act(() => result.current.setCompareList([property("a"), property("b")]));
      expect(result.current.compareList).toEqual([property("a"), property("b")]);

      act(() => result.current.setCompareList([]));
      expect(result.current.compareList).toEqual([]);
    });
  });
});