// frontend-vite/src/hooks/__tests__/useDebounceHook.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDebounce } from "../useDebounceHook";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello"));
    expect(result.current).toBe("hello");
  });

  it("does not update the value before the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    vi.advanceTimersByTime(299);

    expect(result.current).toBe("a");
  });

  it("updates the value once the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    vi.advanceTimersByTime(300);

    expect(result.current).toBe("ab");
  });

  it("resets the timer on rapid successive changes (only the last value wins)", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ap" });
    vi.advanceTimersByTime(150);
    rerender({ value: "app" });
    vi.advanceTimersByTime(150);
    rerender({ value: "appl" });
    vi.advanceTimersByTime(150);

    // None of the intermediate values should have committed yet.
    expect(result.current).toBe("a");

    vi.advanceTimersByTime(150);
    expect(result.current).toBe("appl");
  });

  it("uses the default 350ms delay when none is provided", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    vi.advanceTimersByTime(349);
    expect(result.current).toBe("a");

    vi.advanceTimersByTime(1);
    expect(result.current).toBe("b");
  });

  it("clears the pending timeout on unmount (no state update after unmount)", () => {
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "b" });
    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});