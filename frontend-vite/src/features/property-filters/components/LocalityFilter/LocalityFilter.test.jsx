import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LocalityFilter from "./LocalityFilter";
import API from "../../../../api/api";
import { useCity } from "../../../../contexts/CityContext";

vi.mock("../../../../api/api", () => ({ default: { get: vi.fn() } }));
vi.mock("../../../../contexts/CityContext", () => ({ useCity: vi.fn() }));

const renderFilter = (props = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LocalityFilter value={[]} onChange={vi.fn()} {...props} />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useCity.mockReturnValue({ city: "Pune" });
});

describe("LocalityFilter", () => {
  it("renders nothing when no city is selected", () => {
    useCity.mockReturnValue({ city: "" });
    const { container } = renderFilter();

    expect(container).toBeEmptyDOMElement();
    expect(API.get).not.toHaveBeenCalled();
  });

  it("loads and lists the localities for the city", async () => {
    API.get.mockResolvedValue({ data: { localities: ["Baner", "Wakad"] } });
    renderFilter();

    expect(screen.getByText("Loading localities…")).toBeInTheDocument();
    expect(await screen.findByText("Baner")).toBeInTheDocument();
    expect(screen.getByText("Wakad")).toBeInTheDocument();
  });

  it("URL-encodes the city in the request", async () => {
    useCity.mockReturnValue({ city: "Navi Mumbai" });
    API.get.mockResolvedValue({ data: { localities: [] } });
    renderFilter();

    await screen.findByText("No localities found");
    expect(API.get).toHaveBeenCalledWith(
      "/api/properties/localities/Navi%20Mumbai",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("shows an error with a working Retry instead of 'No localities found'", async () => {
    const user = userEvent.setup();
    API.get.mockRejectedValueOnce(new Error("network"));
    API.get.mockResolvedValueOnce({ data: { localities: ["Baner"] } });
    renderFilter();

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load localities");
    expect(screen.queryByText("No localities found")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Baner")).toBeInTheDocument();
  });

  it("reports a ticked locality through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    API.get.mockResolvedValue({ data: { localities: ["Baner", "Wakad"] } });
    renderFilter({ onChange });

    await user.click(await screen.findByLabelText("Wakad"));

    expect(onChange).toHaveBeenCalledWith(["Wakad"]);
  });
});
