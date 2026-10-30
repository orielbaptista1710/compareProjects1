import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";

import Compare from "../Compare";
import API from "../../../api/api";
import {
  renderWithRouter,
  makeProperty,
  skyline,
  greenValley,
} from "../../../test/compareTestUtils";

vi.mock("../../../api/api", () => ({
  default: { get: vi.fn() },
}));

beforeEach(() => {
  API.get.mockReset();
  API.get.mockResolvedValue({ data: [] });
});

const renderCompare = (compareList, overrides = {}) => {
  const props = {
    compareList,
    setCompareList: vi.fn(),
    removeFromCompare: vi.fn(),
    addToCompare: vi.fn(),
    ...overrides,
  };
  renderWithRouter(<Compare {...props} />, { initialPath: "/compare" });
  return props;
};

describe("Compare page", () => {
  it("shows the empty state and links to properties when nothing is selected", () => {
    renderCompare([]);

    expect(screen.getByText("Nothing to compare yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /browse properties/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });

  it("renders one column header per selected property", () => {
    renderCompare([skyline, greenValley]);

    expect(screen.getAllByRole("button", { name: "Remove from comparison" })).toHaveLength(2);
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });

  it("shows the free slots up to 4, falling back to Add Property with no suggestions", async () => {
    renderCompare([skyline, greenValley]);

    expect(screen.getByText((_, el) => el?.className === "ct-corner__slots" && el.textContent === "2 of 4 slots used"))
      .toBeInTheDocument();
    // jsdom applies our CSS at desktop width: the 2 slot columns are visible and
    // the phone-only strip is in the DOM but hidden.
    expect(await screen.findAllByRole("button", { name: "Add property to compare" })).toHaveLength(2);
    expect(screen.getByText("2 slots left")).not.toBeVisible();
  });

  it("recommends related properties, skipping compared ones and ranking the same type first", async () => {
    const villa = makeProperty({ _id: "p7", title: "Palm Villa", propertyType: "Villa" });
    const flat = makeProperty({ _id: "p8", title: "Lake View Flat" });
    API.get.mockResolvedValue({ data: [greenValley, villa, flat] });
    const { addToCompare } = renderCompare([skyline, greenValley]);

    const slotCells = await waitFor(() => {
      const cells = document.querySelectorAll("thead .ct-slot");
      expect(within(cells[0]).getByText("Lake View Flat")).toBeInTheDocument();
      return cells;
    });
    expect(API.get).toHaveBeenCalledWith("/api/properties/related/p1");
    expect(within(slotCells[1]).getByText("Palm Villa")).toBeInTheDocument();
    expect(screen.queryAllByText("Green Valley", { selector: ".rec-slot__title" })).toHaveLength(0);

    fireEvent.click(within(slotCells[0]).getByRole("button", { name: /add to compare/i }));
    expect(addToCompare).toHaveBeenCalledWith(flat);
  });

  it("falls back to Add Property when suggestions fail to load", async () => {
    API.get.mockRejectedValue(new Error("network"));
    renderCompare([skyline]);

    expect(await screen.findAllByRole("button", { name: "Add property to compare" })).toHaveLength(3);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
  });

  it("doesn't fetch suggestions when all 4 slots are used", () => {
    renderCompare(["p1", "p2", "p3", "p4"].map((_id) => ({ ...skyline, _id })));

    expect(API.get).not.toHaveBeenCalled();
    expect(screen.queryByText(/slots used/)).not.toBeInTheDocument();
  });

  it("shows the summary once two properties are selected", () => {
    renderCompare([skyline, greenValley]);

    expect(
      screen.getByRole("heading", { name: /Skyline Heights vs Green Valley/i })
    ).toBeInTheDocument();
  });

  it("renders every section at once, with values side by side", () => {
    renderCompare([skyline, greenValley]);

    for (const title of ["Overview", "Price & Size", "Location", "Amenities & Features"]) {
      expect(screen.getByRole("rowheader", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole("cell", { name: "Andheri" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Baner" })).toBeInTheDocument();
  });

  it("turns on Only differences mode for the table area", () => {
    renderCompare([skyline, greenValley]);
    const main = document.querySelector(".compare-page__main");
    expect(main).not.toHaveAttribute("data-diff-only");

    fireEvent.click(screen.getByRole("checkbox", { name: "Only differences" }));
    expect(main).toHaveAttribute("data-diff-only", "true");
  });

  it("disables Only differences with a single property", () => {
    renderCompare([skyline]);
    expect(screen.getByRole("checkbox", { name: "Only differences" })).toBeDisabled();
  });

  it("turns Only differences off when removing down to one property", () => {
    // Real list state, so removing a property re-renders the page
    const Harness = () => {
      const [list, setList] = useState([skyline, greenValley]);
      return (
        <Compare
          compareList={list}
          setCompareList={setList}
          removeFromCompare={(id) => setList((l) => l.filter((p) => p._id !== id))}
          addToCompare={vi.fn()}
        />
      );
    };
    renderWithRouter(<Harness />, { initialPath: "/compare" });

    fireEvent.click(screen.getByRole("checkbox", { name: "Only differences" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Remove from comparison" })[1]);

    expect(document.querySelector(".compare-page__main")).not.toHaveAttribute("data-diff-only");
    expect(screen.getByRole("checkbox", { name: "Only differences" })).not.toBeChecked();
  });

  it("ignores empty entries from a corrupted saved list", () => {
    renderCompare([null, skyline, {}, greenValley]);

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "Andheri" })).toBeInTheDocument();
  });

  it("goes back to /properties from the back arrow on a direct visit", () => {
    renderCompare([skyline]);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });

  it("goes back to the previous in-app page from the back arrow", () => {
    renderWithRouter(
      <Compare compareList={[skyline]} setCompareList={vi.fn()} removeFromCompare={vi.fn()} addToCompare={vi.fn()} />,
      { initialEntries: ["/property/p1", "/compare"] }
    );

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/property/p1");
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

  it("disables Add More once the compare limit is reached", () => {
    const four = ["p1", "p2", "p3", "p4"].map((_id) => ({ ...skyline, _id }));
    renderCompare(four);

    expect(screen.getByRole("button", { name: /add more/i })).toBeDisabled();
  });
});
