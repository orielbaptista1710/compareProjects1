import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import FilterPanel from "./FilterPanel";
import API from "../../../../api/api";
import { useCity } from "../../../../contexts/CityContext";

vi.mock("../../../../api/api", () => ({ default: { get: vi.fn() } }));
vi.mock("../../../../contexts/CityContext", () => ({ useCity: vi.fn() }));

const OPTIONS = {
  propertyTypeOptions: ["Flats/Apartments", "Villa"],
  furnishingOptions: ["Furnished"],
  facingOptions: ["east"],
  parkingOptions: ["Covered"],
  possessionStatusOptions: ["Ready"],
  floorLabelOptions: ["Ground"],
  amenitiesOptions: ["Gym"],
};

const renderPanel = (props = {}) => {
  const handlers = {
    onFilterChange: vi.fn(),
    onClearAll: vi.fn(),
    onSearchChange: vi.fn(),
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FilterPanel
        filters={{}}
        filterOptions={OPTIONS}
        searchQuery=""
        {...handlers}
        {...props}
      />
    </QueryClientProvider>
  );
  return handlers;
};

beforeEach(() => {
  vi.clearAllMocks();
  useCity.mockReturnValue({ city: "" });
  API.get.mockResolvedValue({ data: { localities: ["Baner"] } });
});

describe("FilterPanel", () => {
  it("renders every section toggle as a button", () => {
    renderPanel();
    for (const name of [
      /^search/i,
      /^budget/i,
      /^area/i,
      /property type/i,
      /bhk type/i,
      /furnishing/i,
      /facing/i,
      /parking/i,
      /possession status/i,
      /floor preference/i,
      /amenities/i,
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("hides the Localities section until a city is selected", () => {
    renderPanel();
    expect(screen.queryByRole("button", { name: /localities/i })).not.toBeInTheDocument();
  });

  it("shows the Localities section when a city is selected", () => {
    useCity.mockReturnValue({ city: "Pune" });
    renderPanel();
    expect(screen.getByRole("button", { name: /localities/i })).toBeInTheDocument();
  });

  it("calls onClearAll from the Clear all button", async () => {
    const { onClearAll } = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("sends search text through onSearchChange", async () => {
    const { onSearchChange } = renderPanel();
    await userEvent.type(screen.getByLabelText("Search properties"), "a");
    expect(onSearchChange).toHaveBeenCalledWith("a");
  });

  it("reports a property type pick via onFilterChange", async () => {
    const { onFilterChange } = renderPanel();
    await userEvent.click(screen.getByRole("checkbox", { name: /villa/i }));
    expect(onFilterChange).toHaveBeenCalledWith("propertyType", ["Villa"]);
  });

  it("reports a BHK pick via onFilterChange", async () => {
    const { onFilterChange } = renderPanel();
    const section = screen.getByRole("button", { name: /bhk type/i }).closest("section, div");
    await userEvent.click(within(section.parentElement).getByText("3 BHK"));
    expect(onFilterChange).toHaveBeenCalledWith("bhk", ["3"]);
  });
});
