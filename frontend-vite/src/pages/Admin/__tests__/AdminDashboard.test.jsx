import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import API from "../../../api";
import AdminDashboard from "../AdminDashboard";

vi.mock("../../../api", () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeProperty(overrides = {}) {
  return {
    _id: "prop-1",
    title: "Test Property",
    developerName: "Test Developer",
    city: "Mumbai",
    locality: "Andheri",
    propertyType: "Villa",
    price: 5000000,
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    ...overrides,
  };
}

function setupApiMocks({ properties = [makeProperty()], total = properties.length } = {}) {
  API.get.mockImplementation((url) => {
    if (url === "/api/admin/properties") {
      return Promise.resolve({ data: { data: properties, total } });
    }
    if (url === "/api/admin/cities") {
      return Promise.resolve({ data: [] });
    }
    if (url === "/api/auth/me") {
      return Promise.resolve({ data: { user: { displayName: "Admin", role: "admin" } } });
    }
    return Promise.resolve({ data: {} });
  });
  API.put.mockResolvedValue({ data: {} });
  API.post.mockResolvedValue({ data: {} });
}

function renderDashboard({ initialEntries = ["/admin"] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminDashboard - double submit protection (end-to-end)", () => {
  it("disables the confirm-approve button immediately after the first click, blocking a second submission", async () => {
    setupApiMocks();
    let resolveApprove;
    API.put.mockImplementation((url) => {
      if (url.startsWith("/api/admin/approve/")) {
        return new Promise((resolve) => {
          resolveApprove = resolve;
        });
      }
      return Promise.resolve({ data: {} });
    });

    const user = userEvent.setup();
    renderDashboard();

    const rowApprove = await screen.findByRole("button", { name: /^approve$/i });
    await user.click(rowApprove);

    const dialog = await screen.findByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", { name: /^approve$/i });
    await user.click(confirmButton);

    const pendingButton = within(dialog).getByRole("button", { name: /approving/i });
    expect(pendingButton).toBeDisabled();

    await expect(user.click(pendingButton)).rejects.toThrow(/pointer-events/i);

    expect(API.put).toHaveBeenCalledTimes(1);
    expect(API.put).toHaveBeenCalledWith("/api/admin/approve/prop-1");

    resolveApprove({ data: { property: makeProperty({ status: "approved" }) } });
  }, 15000);
});

describe("AdminDashboard - bulk selection", () => {
  it("selecting a row via checkbox and bulk-approving sends that row's id to the bulk endpoint", async () => {
    setupApiMocks();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText("Test Property");

    // Checkbox column: index 0 is the "select all" header checkbox.
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);

    expect(await screen.findByText("1 selected")).toBeInTheDocument();

    const bulkBar = screen.getByText("1 selected").closest("div");
    await user.click(within(bulkBar).getByRole("button", { name: /^approve$/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/approve 1 propert/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^approve$/i }));

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith("/api/admin/bulk-approve", { ids: ["prop-1"] });
    });
  }, 15000);
});

describe("AdminDashboard - URL param hydration", () => {
  it("hydrates status=all and city from the URL into the initial properties request", async () => {
    setupApiMocks();
    renderDashboard({ initialEntries: ["/admin?status=all&city=Mumbai"] });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        "/api/admin/properties",
        expect.objectContaining({
          params: expect.objectContaining({ status: undefined, city: "Mumbai" }),
        })
      );
    });
  });

  it("does not crash when the URL carries a status value the backend would reject", async () => {
    API.get.mockImplementation((url) => {
      if (url === "/api/admin/properties") {
        return Promise.reject({
          response: { status: 400, data: { success: false, message: "Invalid status filter" } },
        });
      }
      if (url === "/api/admin/cities") return Promise.resolve({ data: [] });
      if (url === "/api/auth/me") return Promise.resolve({ data: { user: null } });
      return Promise.resolve({ data: {} });
    });

    renderDashboard({ initialEntries: ["/admin?status=totally-bogus"] });

    expect(
      await screen.findByText(/failed to load properties/i, {}, { timeout: 10000 })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  }, 15000);
});
