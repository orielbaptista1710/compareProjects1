import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { useOutsideClick } from "../useOutsideClick";

describe("useOutsideClick", () => {
  function createTestElements() {
    // Create real DOM elements because the hook uses:
    //
    // ref.current.contains(e.target)
    //
    // Using real elements makes this test closer to real browser behavior.
    const insideElement = document.createElement("div");
    const outsideElement = document.createElement("div");

    document.body.appendChild(insideElement);
    document.body.appendChild(outsideElement);

    return {
      insideElement,
      outsideElement,
    };
  }

  function cleanupTestElements(...elements) {
    elements.forEach((element) => element.remove());
  }

  it("calls onClose when clicking outside the referenced element", () => {
    const onClose = vi.fn();
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    renderHook(() => useOutsideClick(true, [ref], onClose));

    act(() => {
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    cleanupTestElements(insideElement, outsideElement);
  });

  it("does not call onClose when clicking inside the referenced element", () => {
    const onClose = vi.fn();
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    renderHook(() => useOutsideClick(true, [ref], onClose));

    act(() => {
      insideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).not.toHaveBeenCalled();

    cleanupTestElements(insideElement, outsideElement);
  });

  it("does not call onClose when the hook is inactive", () => {
    const onClose = vi.fn();
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    renderHook(() => useOutsideClick(false, [ref], onClose));

    act(() => {
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).not.toHaveBeenCalled();

    cleanupTestElements(insideElement, outsideElement);
  });

  it("treats clicks inside any referenced element as inside", () => {
    const onClose = vi.fn();

    const firstRef = createRef();
    const secondRef = createRef();

    const firstElement = document.createElement("div");
    const secondElement = document.createElement("div");
    const outsideElement = document.createElement("div");

    document.body.appendChild(firstElement);
    document.body.appendChild(secondElement);
    document.body.appendChild(outsideElement);

    firstRef.current = firstElement;
    secondRef.current = secondElement;

    renderHook(() =>
      useOutsideClick(true, [firstRef, secondRef], onClose)
    );

    // Clicking inside the first referenced element should not close.
    act(() => {
      firstElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    // Clicking inside the second referenced element should not close.
    act(() => {
      secondElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).not.toHaveBeenCalled();

    // Clicking outside both should close.
    act(() => {
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    cleanupTestElements(
      firstElement,
      secondElement,
      outsideElement
    );
  });

  it("calls onClose when touching outside the referenced element", () => {
    const onClose = vi.fn();
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    renderHook(() => useOutsideClick(true, [ref], onClose));

    act(() => {
      outsideElement.dispatchEvent(
        new Event("touchstart", { bubbles: true })
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    cleanupTestElements(insideElement, outsideElement);
  });

  it("does nothing when refs are missing", () => {
    const onClose = vi.fn();

    expect(() => {
      renderHook(() =>
        useOutsideClick(true, undefined, onClose)
      );
    }).not.toThrow();

    // No listener should exist because refs are invalid.
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not throw when onClose is missing", () => {
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    renderHook(() =>
      useOutsideClick(true, [ref], undefined)
    );

    expect(() => {
      act(() => {
        outsideElement.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true })
        );
      });
    }).not.toThrow();

    cleanupTestElements(insideElement, outsideElement);
  });

  it("stops responding to outside clicks after unmount", () => {
    const onClose = vi.fn();
    const ref = createRef();

    const { insideElement, outsideElement } = createTestElements();

    ref.current = insideElement;

    const { unmount } = renderHook(() =>
      useOutsideClick(true, [ref], onClose)
    );

    unmount();

    act(() => {
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
    });

    // The document event listeners should have been removed.
    expect(onClose).not.toHaveBeenCalled();

    cleanupTestElements(insideElement, outsideElement);
  });
});