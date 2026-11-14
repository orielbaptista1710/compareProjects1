import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ExpandableSearch from "../ExpandableSearch";
import API from "../../../../api/api";

vi.mock("../../../../api/api", () => ({
  default: { get: vi.fn() },
}));

const addToCompare = vi.fn();
vi.mock("../../../../contexts/CompareContext", () => ({
  useCompare: () => ({ addToCompare }),
}));

// The header's selected city; null = none picked.
const cityState = vi.hoisted(() => ({ city: "Mumbai" }));
vi.mock("../../../../contexts/CityContext", () => ({
  useCity: () => ({ city: cityState.city }),
}));

const PropertyPage = () => <div>Property page {useParams().id}</div>;

// Fresh client per test so cached search results never leak between tests.
const renderSearch = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ExpandableSearch />} />
          <Route path="/property/:id" element={<PropertyPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

const property = (id, title) => ({ _id: id, title, price: 5000000, locality: "Baner" });
const respond = (properties, fuzzy = false) => ({ data: { properties, fuzzy } });

// Resolve each request by hand to simulate slow / out-of-order responses.
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

beforeEach(() => {
  cityState.city = "Mumbai";
  API.get.mockReset();
  addToCompare.mockReset();
});

describe("ExpandableSearch", () => {
  it("searches the debounced query and shows the results", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha park");

    expect(await screen.findByText("Lodha Park")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledTimes(1);
    expect(API.get.mock.calls[0][0]).toBe("/api/properties/search?query=lodha%20park&limit=3");
  });

  it("doesn't search fewer than 2 characters", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "a");
    await new Promise((r) => setTimeout(r, 500));

    expect(API.get).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows 'No properties found' when nothing matches", async () => {
    API.get.mockResolvedValue(respond([]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("No properties found")).toBeInTheDocument();
  });

  it("flags fuzzy matches", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Prestige Lakeside")], true));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "prestge");

    expect(await screen.findByText("Showing best matches")).toBeInTheDocument();
  });

  it("never shows or submits a late response for an older query", async () => {
    const first = deferred();
    const second = deferred();
    API.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox");

    await user.type(input, "pune");
    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(1));
    await user.type(input, " west");
    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(2));

    // The aborted "pune" request answers late.
    await act(async () => first.resolve(respond([property("old", "Old Pune Result")])));
    await user.keyboard("{Enter}");

    expect(screen.queryByText("Old Pune Result")).not.toBeInTheDocument();
    expect(screen.getByText("Searching…")).toBeInTheDocument();
    expect(screen.queryByText(/Property page/)).not.toBeInTheDocument();

    await act(async () => second.resolve(respond([property("new", "Pune West Result")])));
    expect(await screen.findByText("Pune West Result")).toBeInTheDocument();
  });

  it("navigates to the first result on Enter", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park"), property("p2", "Lodha Amara")]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");
    await screen.findByText("Lodha Park");
    await user.keyboard("{Enter}");

    expect(await screen.findByText("Property page p1")).toBeInTheDocument();
  });

  it("navigates to the arrow-key highlighted result on Enter", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park"), property("p2", "Lodha Amara")]));
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox");

    await user.type(input, "lodha");
    await screen.findByText("Lodha Park");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(input).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1].id);

    await user.keyboard("{Enter}");
    expect(await screen.findByText("Property page p2")).toBeInTheDocument();
  });

  it("navigates when a result is clicked", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");
    await user.click(await screen.findByText("Lodha Park"));

    expect(await screen.findByText("Property page p1")).toBeInTheDocument();
  });

  it("adds to compare without navigating", async () => {
    const result = property("p1", "Lodha Park");
    API.get.mockResolvedValue(respond([result]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");
    await user.click(await screen.findByRole("button", { name: "Compare" }));

    expect(addToCompare).toHaveBeenCalledWith(result);
    expect(screen.queryByText(/Property page/)).not.toBeInTheDocument();
  });

  it("closes on outside click but keeps the typed text, and reopens on click", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox");

    await user.type(input, "lodha");
    await screen.findByText("Lodha Park");
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("lodha");

    await user.click(input);
    expect(screen.getByText("Lodha Park")).toBeInTheDocument();
  });

  it("closes on Escape but keeps the typed text", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox");

    await user.type(input, "lodha");
    await screen.findByText("Lodha Park");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("lodha");
  });

  it("explains rate limiting instead of a generic error", async () => {
    API.get.mockRejectedValue({ name: "AxiosError", response: { status: 429 } });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Too many searches/);
  });

  it("retries a failed search when Enter is pressed", async () => {
    API.get
      .mockRejectedValueOnce({ name: "AxiosError", response: { status: 429 } })
      .mockResolvedValueOnce(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");
    await screen.findByRole("alert");
    await user.keyboard("{Enter}");

    expect(await screen.findByText("Lodha Park")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledTimes(2);
  });

  it("shows the project name when there is one, otherwise the title", async () => {
    API.get.mockResolvedValue(
      respond([
        { ...property("p1", "3 BHK Apartments in Lodha Park, Worli"), projectName: "Lodha Park" },
        property("p2", "Prestige Lakeside"),
      ])
    );
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");

    expect(await screen.findByText("Lodha Park")).toBeInTheDocument();
    expect(screen.queryByText("3 BHK Apartments in Lodha Park, Worli")).not.toBeInTheDocument();
    expect(screen.getByText("Prestige Lakeside")).toBeInTheDocument();
  });

  it("links 'See all results' to the listings search for the typed text", async () => {
    API.get.mockResolvedValue(respond([property("p1", "Lodha Park")]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha park");

    const link = await screen.findByRole("link", { name: /see all results/i });
    expect(link).toHaveAttribute("href", "/properties?search=lodha%20park");
    expect(screen.getByText(/1 match/)).toBeInTheDocument();
  });

  // Search finds nothing; /featured and /recent answer with the given lists.
  const mockNoMatches = ({ featured = [], recent = [] } = {}) =>
    API.get.mockImplementation(async (url) => {
      if (url.startsWith("/api/properties/featured")) return { data: featured };
      if (url.startsWith("/api/properties/recent")) return { data: recent };
      return respond([]);
    });

  it("recommends featured listings in the selected city when nothing matches", async () => {
    mockNoMatches({ featured: [property("f1", "Featured Heights")] });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("Featured Heights")).toBeInTheDocument();
    expect(screen.getByText('No exact matches for "zzzz" — you might like')).toBeInTheDocument();
    expect(screen.queryByText("No properties found")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /see all results/i })).not.toBeInTheDocument();

    const featuredCall = API.get.mock.calls.find(([url]) => url.startsWith("/api/properties/featured"));
    expect(featuredCall[0]).toContain("city=Mumbai");
    expect(featuredCall[0]).toContain("limit=3");
  });

  it("recommends site-wide listings when no city is picked", async () => {
    cityState.city = null;
    mockNoMatches({ featured: [property("f1", "Featured Heights")] });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("Featured Heights")).toBeInTheDocument();
    const featuredCall = API.get.mock.calls.find(([url]) => url.startsWith("/api/properties/featured"));
    expect(featuredCall[0]).toBe("/api/properties/featured?limit=3"); // no city filter at all
  });

  it("falls back to recently added listings when none are featured", async () => {
    mockNoMatches({ recent: [property("r1", "Brand New Towers")] });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("Brand New Towers")).toBeInTheDocument();
  });

  it("opens a recommendation with the arrow keys and Enter", async () => {
    mockNoMatches({ featured: [property("f1", "Featured Heights"), property("f2", "Second Pick")] });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "zzzz");
    await screen.findByText("Second Pick");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(await screen.findByText("Property page f2")).toBeInTheDocument();
  });

  it("shows a generic error when the request fails", async () => {
    API.get.mockRejectedValue({ name: "AxiosError", response: { status: 500 } });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "lodha");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to fetch results");
  });
});
