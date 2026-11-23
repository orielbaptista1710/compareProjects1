import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useDebouncedCallback } from "../useDebouncedCallback";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDebouncedCallback", () => {
  it("calls the callback once, after the wait, with the last arguments", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 500));

    act(() => {
      result.current("a");
      result.current("ab");
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("ab");
  });

  it("keeps a pending call alive across re-renders and runs the latest callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 500), {
      initialProps: { cb: first },
    });

    act(() => result.current("typed"));
    // A re-render with a new callback (e.g. the URL changed) must not drop the call.
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(500));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("typed");
  });

  it("returns the same function across re-renders", () => {
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 500), {
      initialProps: { cb: vi.fn() },
    });
    const before = result.current;
    rerender({ cb: vi.fn() });
    expect(result.current).toBe(before);
  });

  it("does not call after cancel() or unmount", () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 500));

    act(() => result.current("x"));
    act(() => result.current.cancel());
    act(() => vi.advanceTimersByTime(500));
    expect(fn).not.toHaveBeenCalled();

    act(() => result.current("y"));
    unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(fn).not.toHaveBeenCalled();
  });
});
