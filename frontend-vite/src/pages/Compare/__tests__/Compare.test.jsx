import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import Compare from "../Compare";
import {
  renderWithRouter,
  skyline,
  greenValley,
} from "../../../test/compareTestUtils";

const renderCompare = (compareList, overrides = {}) => {
  const props = {
    compareList,
    setCompareList: vi.fn(),
    removeFromCompare: vi.fn(),
    ...overrides,
  };
  renderWithRouter(<Compare {...props} />, { initialPath: "/compare" });
  return props;
};

describe("Compare page", () => {
  it("shows the empty state and links to properties when nothing is selected", () => {
    renderCompare([]);

    expect(screen.getByText("Nothing to compare yet")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /browse properties/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });

  it("renders a header card per property and fills remaining slots up to 4", () => {
    renderCompare([skyline, greenValley]);

    expect(screen.getAllByRole("button", { name: "Remove from comparison" })).toHaveLength(2);
    // 2 empty slots in the header row + 2 in the content grid
    expect(screen.getAllByRole("button", { name: "Add property to compare" })).toHaveLength(4);
  });

  it("shows the summary once two properties are selected", () => {
    renderCompare([skyline, greenValley]);

    expect(
      screen.getByRole("heading", { name: /Skyline Heights vs Green Valley/i })
    ).toBeInTheDocument();
  });

  it("loads the Overview tab by default and switches tabs on click", async () => {
    renderCompare([skyline, greenValley]);

    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(await screen.findAllByText("Pricing")).toHaveLength(2);

    fireEvent.click(screen.getByRole("tab", { name: "Location" }));

    expect(screen.getByRole("tab", { name: "Location" })).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("aria-selected", "false");
    expect(await screen.findByText("Andheri")).toBeInTheDocument();
    expect(screen.getByText("Baner")).toBeInTheDocument();
  });

  it("removes a single property by id", () => {
    const { removeFromCompare } = renderCompare([skyline, greenValley]);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove from comparison" })[1]);

    expect(removeFromCompare).toHaveBeenCalledWith("p2");
    // Remove must not also trigger the card's navigate-to-property click
    expect(screen.getByTestId("location")).toHaveTextContent("/compare");
  });

  it("navigates to the property page when a header card is clicked", () => {
    renderCompare([skyline, greenValley]);

    fireEvent.click(screen.getByText("Skyline Heights", { selector: "h3" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/property/p1");
  });

  it("clears the whole list with Clear All", () => {
    const { setCompareList } = renderCompare([skyline, greenValley]);

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));

    expect(setCompareList).toHaveBeenCalledWith([]);
  });

  it("sends the user to /properties from Add More", () => {
    renderCompare([skyline]);

    fireEvent.click(screen.getByRole("button", { name: /add more/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });

  it("sends the user to /properties from an empty slot", () => {
    renderCompare([skyline]);

    fireEvent.click(screen.getAllByRole("button", { name: "Add property to compare" })[0]);
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });
});
