// frontend-vite/src/hooks/__tests__/useEscapeKey.test.js
//
// NOTE: In the source tree this hook (useEscapeKey) is currently exported
// from a file named `useOutsideClick.js`, which already contains a
// *different* hook (`useOutsideClick`, tested separately below). That's a
// naming collision waiting to bite someone doing a find/replace or import
// autocomplete. Recommend renaming this file to `useEscapeKey.js` — the
// import path below assumes that rename; adjust if you keep the old name.
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEscapeKey } from "../useEscapeKey";

const pressKey = (key) => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key }));
};

describe("useEscapeKey", () => {
  it("calls onClose when Escape is pressed while active", () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    pressKey("Escape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for other keys", () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    pressKey("Enter");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not attach a listener (or call onClose) when isActive is false", () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(false, onClose));

    pressKey("Escape");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not throw when onClose is missing", () => {
    expect(() => {
      renderHook(() => useEscapeKey(true, undefined));
      pressKey("Escape");
    }).not.toThrow();
  });

  it("removes the listener on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onClose));

    unmount();
    pressKey("Escape");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("re-attaches with the latest onClose after it changes", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onClose }) => useEscapeKey(true, onClose),
      { initialProps: { onClose: first } }
    );

    rerender({ onClose: second });
    pressKey("Escape");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});