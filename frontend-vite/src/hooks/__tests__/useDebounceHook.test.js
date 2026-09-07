import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import { act, renderHook } from "@testing-library/react";
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
      {
        initialProps: { value: "a" },
      }
    );

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("a");
  });

  it("updates the value once the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: "a" },
      }
    );

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("ab");
  });

  it("resets the timer on rapid successive changes so only the last value wins", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: "a" },
      }
    );

    rerender({ value: "ap" });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    rerender({ value: "app" });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    rerender({ value: "appl" });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // The last value has not waited the full 300ms yet.
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe("appl");
  });

  it("uses the default 350ms delay when no delay is provided", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: {
          value: "a",
        },
      }
    );

    rerender({ value: "b" });

    act(() => {
      vi.advanceTimersByTime(349);
    });

    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("b");
  });

  it("cleans up the pending timer when unmounted", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: {
          value: "a",
        },
      }
    );

    rerender({ value: "b" });

    unmount();

    expect(clearSpy).toHaveBeenCalled();

    clearSpy.mockRestore();
  });
});