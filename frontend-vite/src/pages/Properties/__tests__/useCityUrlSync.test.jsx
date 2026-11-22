import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";

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

// Like runOn, but keeps the page mounted so a test can move to another URL
// or change the header city afterwards.
const mountOn = (url) => {
  const { result, rerender } = renderHook(
    () => {
      const location = useLocation();
      const navigate = useNavigate();
      useCityUrlSync(parseFiltersFromURL(location.search));
      return { location, navigate };
    },
    { wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter> }
  );
  return {
    params: () => new URLSearchParams(result.current.location.search),
    goTo: (to) => act(() => result.current.navigate(to)),
    rerender,
  };
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

  it("treats a spaces-only search as no search and adds the city", () => {
    const params = runOn("/properties?search=%20%20");

    expect(params.get("city")).toBe("Mumbai");
  });

  it("leaves the header city alone on a free-text search", () => {
    runOn("/properties?search=Pune");

    expect(cityState.setCity).not.toHaveBeenCalled();
  });

  it("stops adding the city once a search is typed after load", () => {
    const page = mountOn("/properties?bhk=2");
    expect(page.params().get("city")).toBe("Mumbai");

    page.goTo("/properties?bhk=2&search=Pune");

    expect(page.params().get("city")).toBeNull();
    expect(page.params().get("search")).toBe("Pune");
  });

  it("adds the city back when the search is cleared", () => {
    const page = mountOn("/properties?search=Pune");
    expect(page.params().get("city")).toBeNull();

    page.goTo("/properties");

    expect(page.params().get("city")).toBe("Mumbai");
  });

  it("follows a URL city that changes after load", () => {
    const page = mountOn("/properties?city=Pune");

    page.goTo("/properties?city=Nashik");

    expect(cityState.setCity).toHaveBeenLastCalledWith("Nashik");
  });

  it("doesn't force a header city change onto an all-city search", () => {
    const page = mountOn("/properties?search=Pune");

    cityState.city = "Nashik";
    page.rerender();

    expect(page.params().get("city")).toBeNull();
    expect(cityState.setCity).not.toHaveBeenCalled();
  });
});
