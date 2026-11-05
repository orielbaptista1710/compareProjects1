import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import API from "../../../../api/api";
import toast from "react-hot-toast";
import AdminListings from "../AdminListings";

vi.mock("../../../../api/api", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const listing = (overrides = {}) => ({
  _id: "prop-1",
  title: "Test Property",
  developerName: "Test Developer",
  listedBy: "developer",
  city: "Mumbai",
  locality: "Andheri",
  propertyType: "Villa",
  price: 5000000,
  status: "pending",
  ...overrides,
});

function mockApi({ properties = [listing()], detail = listing() } = {}) {
  API.get.mockImplementation((url) => {
    if (url === "/api/admin/properties") return Promise.resolve({ data: { data: properties, total: properties.length } });
    if (url.startsWith("/api/admin/property/")) return Promise.resolve({ data: { data: detail } });
    return Promise.resolve({ data: [] });
  });
}

const renderListings = (url = "/admin") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <AdminListings />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const propertiesParams = () =>
  API.get.mock.calls.find(([url]) => url === "/api/admin/properties")?.[1].params;

describe("AdminListings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ignores filter values in the URL the backend would reject, instead of failing every request", async () => {
    mockApi();
    renderListings("/admin?status=totally-bogus&sortBy=nope&propertyType=Castle&imageFilter=x&listedBy=broker");

    await screen.findByText("Test Property");
    expect(propertiesParams()).toMatchObject({
      status: "pending",
      sortBy: "latest",
      propertyType: undefined,
      imageFilter: undefined,
      listedBy: undefined,
    });
  });

  it("keeps known filters from the URL, including status=all", async () => {
    mockApi();
    renderListings("/admin?status=all&listedBy=agent&sortBy=priceLow");

    await screen.findByText("Test Property");
    expect(propertiesParams()).toMatchObject({ status: undefined, listedBy: "agent", sortBy: "priceLow" });
  });

  it("keeps the filters on screen when loading fails, so a bad filter can be changed", async () => {
    API.get.mockImplementation((url) =>
      url === "/api/admin/properties"
        ? Promise.reject({ response: { status: 500 } })
        : Promise.resolve({ data: [] })
    );
    renderListings();

    // The listings query retries twice (1.5s apart) before showing the error.
    expect(await screen.findByText(/failed to load properties/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  }, 15000);

  it("tells the admin when a bulk approve leaves listings hidden, without counting them as live", async () => {
    mockApi();
    API.put.mockResolvedValue({ data: { modified: 1, hidden: 1 } });
    const user = userEvent.setup({ delay: null });
    renderListings();

    await screen.findByText("Test Property");
    await user.click(screen.getAllByRole("checkbox")[1]);
    const bar = screen.getByText("1 selected").closest("div");
    await user.click(within(bar).getByRole("button", { name: /^approve$/i }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /^approve$/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Approved, but 1 stays hidden until the posting agent is reinstated")
    );
  });

  it("updates the open details modal after approving from it, so it isn't offered twice", async () => {
    mockApi();
    API.put.mockResolvedValue({ data: { message: "Property approved successfully", property: { _id: "prop-1", status: "approved" } } });
    const user = userEvent.setup({ delay: null });
    renderListings();

    await user.click(await screen.findByText("Test Property"));
    await user.click(await screen.findByRole("button", { name: "Approve property" }));
    const confirmDialog = screen.getByText("Approve property?").closest('[role="dialog"]');
    await user.click(within(confirmDialog).getByRole("button", { name: /^approve$/i }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Approve property" })).not.toBeInTheDocument());
    expect(API.put).toHaveBeenCalledTimes(1);
  }, 15000);
});
