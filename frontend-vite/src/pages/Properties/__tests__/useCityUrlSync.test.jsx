import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import { useCityUrlSync } from "../useCityUrlSync";
import { parseFiltersFromURL } from "../../../utils/filters.schema";

const cityState = vi.hoisted(() => ({ city: "Mumbai", setCity: vi.fn() }));
vi.mock("../../../contexts/CityContext", () => ({
  useCity: () => cityState,
}));

beforeEach(() => {
  cityState.city = "Mumbai";
  cityState.setCity = vi.fn();
});

// Runs the hook on a URL, the same way Properties.jsx builds `filters`, and
// reports the URL the page ends up on.
const runOn = (url) => {
  const { result } = renderHook(
    () => {
      const location = useLocation();
      useCityUrlSync(parseFiltersFromURL(location.search));
      return location;
    },
    { wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter> }
  );
  return new URLSearchParams(result.current.search);
};

describe("useCityUrlSync", () => {
  it("adds the selected city when the URL has none", () => {
    const params = runOn("/properties");

    expect(params.get("city")).toBe("Mumbai");
  });

  it("keeps other filters when adding the city", () => {
    const params = runOn("/properties?bhk=2");

    expect(params.get("city")).toBe("Mumbai");
    expect(params.get("bhk")).toBe("2");
  });

  it("leaves a free-text search without a city searching every city", () => {
    const params = runOn("/properties?search=Pune");

    expect(params.get("city")).toBeNull();
    expect(params.get("search")).toBe("Pune");
  });

  it("keeps a city that is already in the URL alongside a search", () => {
    const params = runOn("/properties?search=Baner&city=Pune");

    expect(params.get("city")).toBe("Pune");
  });

  it("copies a URL city into the header city", () => {
    runOn("/properties?city=Pune");

    expect(cityState.setCity).toHaveBeenCalledWith("Pune");
  });

  it("doesn't touch the header city when it already matches", () => {
    runOn("/properties?city=Mumbai");

    expect(cityState.setCity).not.toHaveBeenCalled();
  });

  it("adds nothing when no city is selected", () => {
    cityState.city = null;

    const params = runOn("/properties");

    expect(params.get("city")).toBeNull();
  });
});
