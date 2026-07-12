// frontend-vite/src/hooks/__tests__/useOutsideClick.test.js

import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useOutsideClick } from "../useOutsideClick";

describe("useOutsideClick", () => {
  let insideEl;
  let outsideEl;

  beforeEach(() => {
    insideEl = document.createElement("div");
    outsideEl = document.createElement("div");
    document.body.appendChild(insideEl);
    document.body.appendChild(outsideEl);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------
  // Listener attachment / detachment (guard clauses + cleanup)
  // ---------------------------------------------------------------------
  describe("listener attachment", () => {
    it("does not attach mousedown/touchstart listeners when isActive is false", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const onClose = vi.fn();
      const ref = { current: insideEl };

      renderHook(() => useOutsideClick(false, [ref], onClose));

      const relevantCalls = addSpy.mock.calls.filter(([type]) =>
        ["mousedown", "touchstart"].includes(type)
      );
      expect(relevantCalls).toHaveLength(0);
    });

    it("does not attach listeners when refs is an empty array", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const onClose = vi.fn();

      renderHook(() => useOutsideClick(true, [], onClose));

      const relevantCalls = addSpy.mock.calls.filter(([type]) =>
        ["mousedown", "touchstart"].includes(type)
      );
      expect(relevantCalls).toHaveLength(0);
    });

    it("does not attach listeners or throw when refs is undefined", () => {
      // Why: the hook uses `refs?.length` specifically to guard against a
      // caller passing no refs array at all — must be a safe no-op.
      const onClose = vi.fn();
      expect(() => {
        renderHook(() => useOutsideClick(true, undefined, onClose));
      }).not.toThrow();
    });

    it("attaches both mousedown and touchstart listeners when isActive is true and refs are provided", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const ref = { current: insideEl };

      renderHook(() => useOutsideClick(true, [ref], vi.fn()));

      const types = addSpy.mock.calls.map(([type]) => type);
      expect(types).toContain("mousedown");
      expect(types).toContain("touchstart");
    });

    it("removes both listeners on unmount", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");
      const ref = { current: insideEl };

      const { unmount } = renderHook(() => useOutsideClick(true, [ref], vi.fn()));
      unmount();

      const types = removeSpy.mock.calls.map(([type]) => type);
      expect(types).toContain("mousedown");
      expect(types).toContain("touchstart");
    });

    it("re-registers listeners when isActive toggles from false to true", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const ref = { current: insideEl };

      const { rerender } = renderHook(({ isActive }) => useOutsideClick(isActive, [ref], vi.fn()), {
        initialProps: { isActive: false },
      });
      expect(addSpy.mock.calls.filter(([t]) => t === "mousedown")).toHaveLength(0);

      rerender({ isActive: true });
      expect(addSpy.mock.calls.filter(([t]) => t === "mousedown").length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------
  // Click-outside / click-inside behavior
  // ---------------------------------------------------------------------
  describe("click detection", () => {
    it("calls onClose when a mousedown occurs outside all provided refs", () => {
      const onClose = vi.fn();
      const ref = { current: insideEl };
      renderHook(() => useOutsideClick(true, [ref], onClose));

      fireEvent.mouseDown(outsideEl);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when a mousedown occurs inside a provided ref", () => {
      const onClose = vi.fn();
      const ref = { current: insideEl };
      renderHook(() => useOutsideClick(true, [ref], onClose));

      fireEvent.mouseDown(insideEl);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onClose on touchstart outside the ref, same as mousedown", () => {
      const onClose = vi.fn();
      const ref = { current: insideEl };
      renderHook(() => useOutsideClick(true, [ref], onClose));

      fireEvent.touchStart(outsideEl);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when clicking inside ANY of multiple provided refs", () => {
      // Why: e.g. a dropdown trigger button + its panel are often two
      // separate refs; clicking either must count as "inside".
      const secondInsideEl = document.createElement("div");
      document.body.appendChild(secondInsideEl);

      const onClose = vi.fn();
      const refs = [{ current: insideEl }, { current: secondInsideEl }];
      renderHook(() => useOutsideClick(true, refs, onClose));

      fireEvent.mouseDown(secondInsideEl);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onClose when clicking outside all refs in a multi-ref setup", () => {
      const secondInsideEl = document.createElement("div");
      document.body.appendChild(secondInsideEl);

      const onClose = vi.fn();
      const refs = [{ current: insideEl }, { current: secondInsideEl }];
      renderHook(() => useOutsideClick(true, refs, onClose));

      fireEvent.mouseDown(outsideEl);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("treats a click as 'outside' (and does not throw) when a ref's current is null", () => {
      // Why: refs attached to conditionally-rendered elements are frequently
      // null (e.g. before the element mounts). The `ref.current &&` guard
      // must prevent a TypeError on `.contains()`.
      const onClose = vi.fn();
      const refs = [{ current: null }];
      renderHook(() => useOutsideClick(true, refs, onClose));

      expect(() => fireEvent.mouseDown(outsideEl)).not.toThrow();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not throw when onClose is undefined (optional chaining)", () => {
      const ref = { current: insideEl };
      renderHook(() => useOutsideClick(true, [ref], undefined));

      expect(() => fireEvent.mouseDown(outsideEl)).not.toThrow();
    });

    it("does not call onClose for events after unmount", () => {
      // Why: guards against "setState on unmounted component"-style bugs if
      // onClose triggers a state update after the owning component is gone.
      const onClose = vi.fn();
      const ref = { current: insideEl };
      const { unmount } = renderHook(() => useOutsideClick(true, [ref], onClose));

      unmount();
      fireEvent.mouseDown(outsideEl);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});