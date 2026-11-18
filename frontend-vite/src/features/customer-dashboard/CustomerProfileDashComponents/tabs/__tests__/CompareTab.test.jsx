import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CompareTab from "../CompareTab";
import { CompareContext } from "../../../../../contexts/CompareContext";
import { CustomerActivityContext } from "../../../../../contexts/CustomerActivityContext";

const joyville = { _id: "a", title: "Joyville Virar West", price: 5026000, locality: "Virar West", city: "Mumbai" };
const skyline = { _id: "b", title: "Skyline Harmony", price: 21100000, locality: "Santa Inez", city: "North Goa" };
const sapana = { _id: "c", title: "Sapana Heights", price: 8000000, locality: "Thane West", city: "Thane" };

const renderTab = ({ compareList = [], heartProperties = [], loading = false } = {}) => {
  const compare = {
    compareList,
    setCompareList: vi.fn(),
    addToCompare: vi.fn(() => "added"),
    removeFromCompare: vi.fn(),
  };
  render(
    <MemoryRouter>
      <CustomerActivityContext.Provider value={{ heartProperties, loading }}>
        <CompareContext.Provider value={compare}>
          <CompareTab />
        </CompareContext.Provider>
      </CustomerActivityContext.Provider>
    </MemoryRouter>
  );
  return compare;
};

describe("CompareTab", () => {
  it("shows four empty slots and no actions when nothing is being compared", () => {
    renderTab();
    expect(screen.getByText("(0 of 4)")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Add from your shortlist/ })).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders compared projects, the quick look table and the full comparison link", () => {
    renderTab({ compareList: [joyville, skyline] });
    expect(screen.getByText("(2 of 4)")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Add from your shortlist/ })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Open full comparison/ })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: /Joyville Virar West/ })).toHaveAttribute("href", "/property/a");

    const priceRow = within(screen.getByRole("table")).getByRole("row", { name: /^Price/ });
    expect(within(priceRow).getByText(/\(best\)/).closest("td")).toHaveClass("is-best");
  });

  it("removes one project and clears all", () => {
    const compare = renderTab({ compareList: [joyville, skyline] });
    fireEvent.click(screen.getByRole("button", { name: "Remove Skyline Harmony from comparison" }));
    expect(compare.removeFromCompare).toHaveBeenCalledWith("b");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(compare.setCompareList).toHaveBeenCalledWith([]);
  });

  it("adds from the shortlist, hiding projects already being compared", () => {
    const compare = renderTab({ compareList: [joyville], heartProperties: [joyville, sapana] });
    fireEvent.click(screen.getAllByRole("button", { name: /Add from your shortlist/ })[0]);

    const picker = screen.getByRole("region", { name: "Add from your shortlist" });
    expect(within(picker).queryByText("Joyville Virar West")).not.toBeInTheDocument();
    fireEvent.click(within(picker).getByRole("button", { name: "Add" }));
    expect(compare.addToCompare).toHaveBeenCalledWith(sapana);
  });

  it("points to browsing when the shortlist is empty", () => {
    renderTab();
    fireEvent.click(screen.getAllByRole("button", { name: /Add from your shortlist/ })[0]);
    const picker = screen.getByRole("region", { name: "Add from your shortlist" });
    expect(within(picker).getByText(/Your shortlist is empty/)).toBeInTheDocument();
    expect(within(picker).getByRole("link", { name: /Browse projects/ })).toHaveAttribute("href", "/properties");
  });
});
