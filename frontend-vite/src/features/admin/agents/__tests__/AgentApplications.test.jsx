import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import API from "../../../../api/api";
import AgentApplications from "../AgentApplications";

vi.mock("../../../../api/api", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const makeAgent = (overrides = {}) => ({
  _id: "c1",
  customerName: "Ravi Shah",
  customerEmail: "ravi@example.com",
  customerPhone: "+919800000001",
  emailVerified: true,
  agent: { status: "pending", agencyName: "Prime Realty", reraAgentId: "A51800012345", appliedAt: "2026-11-01" },
  ...overrides,
});

const agentsFor = (byStatus) =>
  API.get.mockImplementation((url, { params }) =>
    Promise.resolve({ data: { data: byStatus[params.status] ?? [], total: (byStatus[params.status] ?? []).length } })
  );

const renderTab = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AgentApplications />
    </QueryClientProvider>
  );
};

const user = () => userEvent.setup({ delay: null });

describe("AgentApplications (admin Agents tab)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.put.mockResolvedValue({ data: { success: true } });
  });

  it("lists pending applications with agency and RERA agent ID", async () => {
    agentsFor({ pending: [makeAgent()] });
    renderTab();

    expect(await screen.findByText("Ravi Shah")).toBeInTheDocument();
    expect(screen.getByText("Prime Realty")).toBeInTheDocument();
    expect(screen.getByText("A51800012345")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/api/admin/agents", { params: { status: "pending", page: 1, limit: 20 } });
  });

  it("can't approve until the agent has verified their email", async () => {
    agentsFor({ pending: [makeAgent({ emailVerified: false })] });
    renderTab();

    expect(await screen.findByText("Not verified")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
  });

  it("approves a verified agent", async () => {
    agentsFor({ pending: [makeAgent()] });
    renderTab();

    await user().click(await screen.findByRole("button", { name: "Approve" }));

    await waitFor(() => expect(API.put).toHaveBeenCalledWith("/api/admin/agents/c1/approve", {}));
  });

  it("needs a reason to reject, and sends it", async () => {
    agentsFor({ pending: [makeAgent()] });
    renderTab();
    const u = user();

    await u.click(await screen.findByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Reject" });
    expect(confirm).toBeDisabled();

    await u.type(within(dialog).getByLabelText(/Reason for rejection/), "RERA ID not found");
    await u.click(confirm);

    await waitFor(() =>
      expect(API.put).toHaveBeenCalledWith("/api/admin/agents/c1/reject", { rejectionReason: "RERA ID not found" })
    );
  });

  it("asks before suspending an approved agent", async () => {
    agentsFor({ approved: [makeAgent({ agent: { status: "approved", agencyName: "Prime Realty" } })] });
    renderTab();
    const u = user();

    await u.click(screen.getByRole("tab", { name: "Approved" }));
    await u.click(await screen.findByRole("button", { name: "Suspend" }));
    expect(API.put).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/live listings are hidden/);
    await u.click(within(dialog).getByRole("button", { name: "Suspend" }));

    await waitFor(() => expect(API.put).toHaveBeenCalledWith("/api/admin/agents/c1/suspend", {}));
  });

  it("offers Reinstate for a suspended agent", async () => {
    agentsFor({ suspended: [makeAgent({ agent: { status: "suspended", agencyName: "Prime Realty" } })] });
    renderTab();
    const u = user();

    await u.click(screen.getByRole("tab", { name: "Suspended" }));
    await u.click(await screen.findByRole("button", { name: "Reinstate" }));

    await waitFor(() => expect(API.put).toHaveBeenCalledWith("/api/admin/agents/c1/approve", {}));
  });

  it("allows one action at a time, so a second click can't hide the first one's progress", async () => {
    agentsFor({ pending: [makeAgent(), makeAgent({ _id: "c2", customerName: "Meera Iyer" })] });
    API.put.mockReturnValue(new Promise(() => {})); // first approve never finishes
    renderTab();
    const u = user();

    const [first, second] = await screen.findAllByRole("button", { name: "Approve" });
    await u.click(first);

    await waitFor(() => expect(second).toBeDisabled());
    expect(screen.getAllByRole("button", { name: "Reject" }).every((b) => b.disabled)).toBe(true);
  });

  it("steps back a page when an action empties the current one", async () => {
    const pageOne = Array.from({ length: 20 }, (_, i) => makeAgent({ _id: `p1-${i}`, customerName: `Agent ${i}` }));
    let lastOneHandled = false;
    API.get.mockImplementation((url, { params }) => {
      if (params.page === 1) return Promise.resolve({ data: { data: pageOne, total: lastOneHandled ? 20 : 21 } });
      return Promise.resolve({
        data: lastOneHandled
          ? { data: [], total: 20 }
          : { data: [makeAgent({ _id: "last", customerName: "Last Agent" })], total: 21 },
      });
    });
    API.put.mockImplementation(() => {
      lastOneHandled = true;
      return Promise.resolve({ data: { success: true } });
    });
    renderTab();
    const u = user();

    await screen.findByText("Agent 0");
    await u.click(screen.getByRole("button", { name: /next page/i }));
    await u.click(await screen.findByRole("button", { name: "Approve" }));

    // Back on page 1 with its agents, not a blank "No pending agents" page.
    expect(await screen.findByText("Agent 0")).toBeInTheDocument();
    expect(screen.queryByText(/No pending agents/)).not.toBeInTheDocument();
  });

  it("shows the rejection reason on the Rejected tab", async () => {
    agentsFor({
      rejected: [makeAgent({ agent: { status: "rejected", agencyName: "Prime Realty", rejectionReason: "Wrong RERA ID" } })],
    });
    renderTab();

    await user().click(screen.getByRole("tab", { name: "Rejected" }));

    expect(await screen.findByText("Wrong RERA ID")).toBeInTheDocument();
  });
});
