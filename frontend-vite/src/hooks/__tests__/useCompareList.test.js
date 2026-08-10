// frontend-vite/src/hooks/__tests__/useCompareList.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCompareList from "../useCompareList";

const property = (id) => ({ _id: id, title: `Property ${id}` });

describe("useCompareList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("initializes with an empty list when localStorage is empty", () => {
    const { result } = renderHook(() => useCompareList());
    expect(result.current.compareList).toEqual([]);
  });

  it("hydrates from localStorage on mount", () => {
    window.localStorage.setItem(
      "compareList",
      JSON.stringify([property("a"), property("b")])
    );
    const { result } = renderHook(() => useCompareList());
    expect(result.current.compareList).toHaveLength(2);
    expect(result.current.compareList[0]._id).toBe("a");
  });

  it("falls back to an empty list when localStorage holds corrupted JSON", () => {
    window.localStorage.setItem("compareList", "{not valid json");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useCompareList());

    expect(result.current.compareList).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("persists the list to localStorage whenever it changes", () => {
    const { result } = renderHook(() => useCompareList());

    act(() => {
      result.current.addToCompare(property("a"));
    });

    expect(JSON.parse(window.localStorage.getItem("compareList"))).toEqual([
      property("a"),
    ]);
  });

  it("does not add a duplicate property", () => {
    const { result } = renderHook(() => useCompareList());

    act(() => {
      result.current.addToCompare(property("a"));
      result.current.addToCompare(property("a"));
    });

    expect(result.current.compareList).toHaveLength(1);
  });

  it("caps the list at 4 properties", () => {
    const { result } = renderHook(() => useCompareList());

    act(() => {
      ["a", "b", "c", "d", "e"].forEach((id) =>
        result.current.addToCompare(property(id))
      );
    });

    expect(result.current.compareList).toHaveLength(4);
    expect(result.current.compareList.map((p) => p._id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("removes a property by id", () => {
    const { result } = renderHook(() => useCompareList());

    act(() => {
      result.current.addToCompare(property("a"));
      result.current.addToCompare(property("b"));
    });
    act(() => {
      result.current.removeFromCompare("a");
    });

    expect(result.current.compareList.map((p) => p._id)).toEqual(["b"]);
  });

  it("exposes setCompareList for direct control (e.g. a 'clear all' button)", () => {
    const { result } = renderHook(() => useCompareList());

    act(() => {
      result.current.setCompareList([property("x")]);
    });

    expect(result.current.compareList).toEqual([property("x")]);
  });

  it("does not throw when localStorage.setItem fails (e.g. quota exceeded / private mode)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(
      () => {
        throw new DOMException("QuotaExceededError");
      }
    );

    const { result } = renderHook(() => useCompareList());

    expect(() => {
      act(() => {
        result.current.addToCompare(property("a"));
      });
    }).not.toThrow();

    // The in-memory state still updates even though persistence failed —
    // this documents current behavior; decide if that's the UX you want.
    expect(result.current.compareList).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});