import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEscapeKey } from "../useEscapeKey";

describe("useEscapeKey", () => {
  it("calls onClose when Escape is pressed while active", () => {
    // Arrange:
    // Create a mock function so we can check whether the hook calls it.
    const onClose = vi.fn();

    renderHook(() => useEscapeKey(true, onClose));

    // Act:
    // Simulate the real browser event that happens when the user
    // presses the Escape key.
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape" })
      );
    });

    // Assert:
    // The modal close callback should be called exactly once.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when a different key is pressed", () => {
    const onClose = vi.fn();

    renderHook(() => useEscapeKey(true, onClose));

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter" })
      );
    });

    // Only Escape should trigger the close behavior.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing when the hook is inactive", () => {
    const onClose = vi.fn();

    renderHook(() => useEscapeKey(false, onClose));

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape" })
      );
    });

    // An inactive modal should not respond to Escape.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not throw when onClose is missing", () => {
    // The current hook explicitly guards against a missing callback:
    //
    // if (!isActive || !onClose) return;
    //
    // This test protects that safety behavior from being accidentally
    // removed during a future refactor.
    renderHook(() => useEscapeKey(true, undefined));

    expect(() => {
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape" })
        );
      });
    }).not.toThrow();
  });

  it("stops responding after the hook becomes inactive", () => {
    const onClose = vi.fn();

    const { rerender } = renderHook(
      ({ isActive }) => useEscapeKey(isActive, onClose),
      {
        initialProps: { isActive: true },
      }
    );

    // First confirm that Escape works while active.
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape" })
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    // Simulate the modal closing or becoming inactive.
    rerender({ isActive: false });

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape" })
      );
    });

    // No additional call should happen after deactivation.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the keyboard listener when unmounted", () => {
    const onClose = vi.fn();

    const { unmount } = renderHook(() =>
      useEscapeKey(true, onClose)
    );

    // React Testing Library runs the useEffect cleanup during unmount.
    unmount();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape" })
      );
    });

    // If cleanup works, the event listener no longer exists.
    expect(onClose).not.toHaveBeenCalled();
  });
});