// frontend-vite/src/hooks/__tests__/useOutsideClick.test.js
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOutsideClick } from "../useOutsideClick";

function makeRef(el) {
  return { current: el };
}

const click = (target) => {
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
};

describe("useOutsideClick", () => {
  it("calls onClose when the click target is outside all refs", () => {
    const inside = document.createElement("div");
    document.body.appendChild(inside);
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const onClose = vi.fn();
    renderHook(() => useOutsideClick(true, [makeRef(inside)], onClose));

    click(outside);

    expect(onClose).toHaveBeenCalledTimes(1);

    document.body.removeChild(inside);
    document.body.removeChild(outside);
  });

  it("does not call onClose when the click target is inside a ref", () => {
    const inside = document.createElement("div");
    const child = document.createElement("span");
    inside.appendChild(child);
    document.body.appendChild(inside);

    const onClose = vi.fn();
    renderHook(() => useOutsideClick(true, [makeRef(inside)], onClose));

    click(child); // click on a nested descendant should still count as "inside"

    expect(onClose).not.toHaveBeenCalled();

    document.body.removeChild(inside);
  });

  it("checks against every ref in a multi-ref array", () => {
    const refA = document.createElement("div");
    const refB = document.createElement("div");
    document.body.append(refA, refB);

    const onClose = vi.fn();
    renderHook(() =>
      useOutsideClick(true, [makeRef(refA), makeRef(refB)], onClose)
    );

    click(refB); // inside the second ref — should NOT close
    expect(onClose).not.toHaveBeenCalled();

    refA.remove();
    refB.remove();
  });

  it("does nothing when isActive is false", () => {
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const onClose = vi.fn();
    renderHook(() => useOutsideClick(false, [makeRef(outside)], onClose));

    click(outside);

    expect(onClose).not.toHaveBeenCalled();
    document.body.removeChild(outside);
  });

  it("does nothing when refs is empty or missing", () => {
    const onClose = vi.fn();
    renderHook(() => useOutsideClick(true, [], onClose));

    click(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("also responds to touchstart", () => {
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const onClose = vi.fn();
    renderHook(() => useOutsideClick(true, [makeRef(outside)], onClose));

    outside.dispatchEvent(new Event("touchstart", { bubbles: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
    document.body.removeChild(outside);
  });

  it("removes both listeners on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() =>
      useOutsideClick(true, [makeRef(document.body)], vi.fn())
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
  });
});