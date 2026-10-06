import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";

import ComparePanel from "../ComparePanel";
import {
  renderWithRouter,
  skyline,
  greenValley,
} from "../../../../../test/compareTestUtils";

const renderPanel = (overrides = {}) => {
  const props = {
    compareList: [skyline, greenValley],
    onClose: vi.fn(),
    removeFromCompare: vi.fn(),
    ...overrides,
  };
  renderWithRouter(<ComparePanel {...props} />, { initialPath: "/properties" });
  return props;
};

const rowCells = (label) =>
  within(screen.getByRole("rowheader", { name: label }).closest("tr")).getAllByRole("cell");

describe("ComparePanel", () => {
  it("renders nothing for an empty list", () => {
    renderPanel({ compareList: [] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores null entries in the list", () => {
    renderPanel({ compareList: [skyline, null] });
    expect(screen.getByRole("heading", { name: /comparing 1 properties/i })).toBeInTheDocument();
  });

  it("renders one column per property across every comparison row", () => {
    renderPanel();

    for (const label of ["Property", "Price", "Location", "BHK / Area", "Status", "RERA", "Amenities"]) {
      expect(rowCells(label)).toHaveLength(2);
    }
    expect(rowCells("RERA")[0]).toHaveTextContent("Approved");
    expect(rowCells("RERA")[1]).toHaveTextContent("Not listed");
    expect(rowCells("BHK / Area")[0]).toHaveTextContent("2 BHK · 1000 sqft");
  });

  it("removes a property but stays open while others remain", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Remove Skyline Heights" }));

    expect(props.removeFromCompare).toHaveBeenCalledWith("p1");
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes itself when the last property is removed", () => {
    const props = renderPanel({ compareList: [skyline] });

    fireEvent.click(screen.getByRole("button", { name: "Remove Skyline Heights" }));

    expect(props.onClose).toHaveBeenCalled();
  });

  it("closes on the close button, Escape, and outside click", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Close comparison panel" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(document.body);

    expect(props.onClose).toHaveBeenCalledTimes(3);
  });

  it("navigates to the property page when a thumbnail is clicked", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("img", { name: "View Green Valley" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/property/p2");
  });

  it("links to the full comparison page", () => {
    renderPanel();
    expect(screen.getByRole("link", { name: /full comparison/i })).toHaveAttribute("href", "/compare");
  });
});
