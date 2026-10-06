import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import CompareBar from "../CompareBar";
import {
  renderWithRouter,
  skyline,
  greenValley,
} from "../../../test/compareTestUtils";

const renderBar = (overrides = {}) => {
  const props = {
    compareList: [skyline, greenValley],
    removeFromCompare: vi.fn(),
    setCompareList: vi.fn(),
    isOpen: true,
    onClose: vi.fn(),
    ...overrides,
  };
  const utils = renderWithRouter(<CompareBar {...props} />);
  return { ...utils, props };
};

describe("CompareBar", () => {
  it("renders nothing when closed", () => {
    renderBar({ isOpen: false });
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it("renders nothing when the list is empty, even if open", () => {
    renderBar({ compareList: [] });
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it("lists each property with its short price and the selected count", () => {
    renderBar();

    expect(screen.getByText("Skyline Heights")).toBeInTheDocument();
    expect(screen.getByText("Green Valley")).toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("removes a property by id", () => {
    const { props } = renderBar();

    fireEvent.click(screen.getByRole("button", { name: "Remove Green Valley from compare" }));

    expect(props.removeFromCompare).toHaveBeenCalledWith("p2");
  });

  it("clears all properties", () => {
    const { props } = renderBar();

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));

    expect(props.setCompareList).toHaveBeenCalledWith([]);
  });

  it("navigates to /compare on Compare Now", () => {
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /compare now/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/compare");
  });

  it("calls onClose from the hide button", () => {
    const { props } = renderBar();

    fireEvent.click(screen.getByRole("button", { name: "Hide compare bar" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
