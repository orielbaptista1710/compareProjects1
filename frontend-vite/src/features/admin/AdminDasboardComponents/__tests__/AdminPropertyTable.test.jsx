import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPropertyTable from "../AdminPropertyTable";

afterEach(() => {
  cleanup();
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
    ...overrides,
  };
}

function baseProps(overrides = {}) {
  return {
    data: { data: [makeProperty()], total: 1 },
    page: 0,
    rowsPerPage: 20,
    setPage: vi.fn(),
    setRowsPerPage: vi.fn(),
    handleApprove: vi.fn(),
    handleOpenReject: vi.fn(),
    approveMutation: { isPending: false, variables: undefined, mutate: vi.fn() },
    rejectMutation: { isPending: false, variables: undefined, mutate: vi.fn() },
    onRowClick: vi.fn(),
    selectionModel: { type: "include", ids: new Set() },
    onSelectionModelChange: vi.fn(),
    ...overrides,
  };
}

describe("AdminPropertyTable - per-row mutation state", () => {
  it("shows 'Approving…' and disables the Approve button for the row actually being mutated", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          approveMutation: { isPending: true, variables: { id: "prop-1", version: 0 }, mutate: vi.fn() },
        })}
      />
    );

    expect(screen.getByRole("button", { name: /approving/i })).toBeDisabled();
  });

  it("leaves other rows' Approve buttons enabled while a different row is pending", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          data: {
            data: [
              makeProperty({ _id: "prop-1", title: "First" }),
              makeProperty({ _id: "prop-2", title: "Second" }),
            ],
            total: 2,
          },
          approveMutation: { isPending: true, variables: { id: "prop-1", version: 0 }, mutate: vi.fn() },
        })}
      />
    );

    expect(screen.getByRole("button", { name: /approving/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeEnabled();
  });

  it("is truly unclickable (pointer-events: none), not just visually disabled, while approving", async () => { 
    //(pointt) 
    const handleApprove = vi.fn();

    render(
      <AdminPropertyTable
        {...baseProps({
          handleApprove,
          approveMutation: { isPending: true, variables: { id: "prop-1", version: 0 }, mutate: vi.fn() },
        })}
      />
    );

    // user-event refuses to click an element with pointer-events: none — the
    // same protection a real double-click relies on. A resolved click here
    // would mean the double-submit guard is only cosmetic.
    await expect(
      userEvent.click(screen.getByRole("button", { name: /approving/i }))
    ).rejects.toThrow(/pointer-events/i);
    expect(handleApprove).not.toHaveBeenCalled();
  });

  it("shows 'Rejecting…' only for the row matching rejectMutation.variables.id", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          rejectMutation: {
            isPending: true,
            variables: { id: "prop-1", reason: "Incomplete" },
            mutate: vi.fn(),
          },
        })}
      />
    );

    expect(screen.getByRole("button", { name: /rejecting/i })).toBeDisabled();
  });
});

describe("AdminPropertyTable - hidden (suspended agent) listings", () => {
  it("can't be approved (nothing would change) but can still be rejected", () => {
    render(
      <AdminPropertyTable {...baseProps({ data: { data: [makeProperty({ status: "suspended" })], total: 1 } })} />
    );

    expect(screen.getByText("Hidden (agent suspended)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
  });
});

describe("AdminPropertyTable - Posted by column", () => {
  it("says who posted each listing instead of 'N/A' for owners and agents", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          data: {
            data: [
              makeProperty({ _id: "a", listedBy: "agent", developerName: undefined, userId: { agent: { agencyName: "Prime Realty" } } }),
              makeProperty({ _id: "b", listedBy: "owner", developerName: undefined, userId: { customerName: "Asha" } }),
            ],
            total: 2,
          },
        })}
      />
    );

    expect(screen.getByText("Agent · Prime Realty")).toBeInTheDocument();
    expect(screen.getByText("Owner · Asha")).toBeInTheDocument();
  });
});

describe("AdminPropertyTable - edited listings and waiting time", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

  it("marks a pending listing that was edited after a review, and only that one", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          data: {
            data: [
              makeProperty({ _id: "a", title: "Edited flat", lastEditedAt: daysAgo(1) }),
              makeProperty({ _id: "b", title: "Brand new flat" }),
            ],
            total: 2,
          },
        })}
      />
    );

    // Exact text: only the chip, not the title "Edited flat"
    expect(screen.getAllByText("Edited")).toHaveLength(1);
    const editedRow = screen.getByText("Edited flat").closest('[role="row"]');
    expect(within(editedRow).getByText("Edited")).toBeInTheDocument();
    expect(within(screen.getByText("Brand new flat").closest('[role="row"]')).queryByText("Edited")).toBeNull();
  });

  it("doesn't call a listing 'Edited' once it has been decided again", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          data: { data: [makeProperty({ status: "approved", lastEditedAt: daysAgo(2) })], total: 1 },
        })}
      />
    );

    expect(screen.queryByText("Edited")).not.toBeInTheDocument();
  });

  it("says how long a pending listing has been waiting", () => {
    render(
      <AdminPropertyTable
        {...baseProps({
          data: {
            data: [
              makeProperty({ _id: "a", submittedAt: daysAgo(3) }),
              makeProperty({ _id: "b", submittedAt: daysAgo(0) }),
            ],
            total: 2,
          },
        })}
      />
    );

    expect(screen.getByText("Waiting 3 days")).toBeInTheDocument();
    expect(screen.getByText("Waiting since today")).toBeInTheDocument();
  });

  it("doesn't show a waiting time for a listing that isn't pending", () => {
    render(
      <AdminPropertyTable
        {...baseProps({ data: { data: [makeProperty({ status: "approved", submittedAt: daysAgo(9) })], total: 1 } })}
      />
    );

    expect(screen.queryByText(/^Waiting/)).not.toBeInTheDocument();
  });
});

describe("AdminPropertyTable - row colours", () => {
  it("uses admin-prefixed classes, so they can't recolour other pages' tables", () => {
    const { container } = render(<AdminPropertyTable {...baseProps()} />);

    expect(container.querySelector(".admin-row-pending")).not.toBeNull();
    expect(container.querySelector(".row-pending")).toBeNull();
  });
});

describe("AdminPropertyTable - select all", () => {
  it("reports the actual row ids, so the bulk bar shows how many are selected", async () => {
    const onSelectionModelChange = vi.fn();
    render(
      <AdminPropertyTable
        {...baseProps({
          data: { data: [makeProperty({ _id: "a" }), makeProperty({ _id: "b" })], total: 2 },
          onSelectionModelChange,
        })}
      />
    );

    await userEvent.setup({ delay: null }).click(screen.getAllByRole("checkbox")[0]);

    const [model] = onSelectionModelChange.mock.calls.at(-1);
    expect(model.type).toBe("include");
    expect([...model.ids].sort()).toEqual(["a", "b"]);
  });
});
