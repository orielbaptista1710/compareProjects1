import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The real form is covered in SellPropertyForm tests; here we only check what
// the tab hands it.
const form = vi.hoisted(() => ({ props: null }));
vi.mock("../../../../developer-dashboard/property-form/SellPropertyForm", () => ({
  default: (props) => {
    form.props = props;
    return <div data-testid="listing-form">form for {props.role}</div>;
  },
}));

import PostPropertyTab from "../PostPropertyTab";
import MyListingsTab from "../MyListingsTab";

const workspace = (overrides = {}) => ({
  properties: [],
  isLoading: false,
  isError: false,
  formData: { title: "" },
  editingId: null,
  isAdding: false,
  isUpdating: false,
  handleSubmit: vi.fn(),
  handleEdit: vi.fn(),
  handleStartNew: vi.fn(),
  handleCancelEdit: vi.fn(),
  handleDelete: vi.fn(),
  ...overrides,
});

describe("PostPropertyTab", () => {
  const currentUser = { _id: "c1" };

  it("shows the form for the poster's role, with drafts kept per account", () => {
    const ws = workspace();
    render(
      <PostPropertyTab
        workspace={ws}
        posterRole="owner"
        gate={null}
        currentUser={currentUser}
        onNavigateTab={vi.fn()}
      />
    );

    expect(screen.getByTestId("listing-form")).toHaveTextContent("form for owner");
    expect(form.props.draftOwner).toBe("c1");
    expect(form.props.onSubmit).toBe(ws.handleSubmit);
    expect(form.props.role).toBe("owner");
  });

  it("opens My listings from the form", () => {
    const onNavigateTab = vi.fn();
    render(
      <PostPropertyTab
        workspace={workspace()}
        posterRole="agent"
        gate={null}
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
      />
    );

    form.props.onShowListings();

    expect(onNavigateTab).toHaveBeenCalledWith("listings");
  });

  it("shows the reason instead of the form when posting is blocked", () => {
    const onNavigateTab = vi.fn();
    render(
      <PostPropertyTab
        workspace={workspace()}
        posterRole="owner"
        gate={{ title: "Verify your email to post", text: "Check your inbox." }}
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
      />
    );

    expect(screen.queryByTestId("listing-form")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Verify your email to post" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go to my profile" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View my listings" }));
    expect(onNavigateTab).toHaveBeenCalledWith("listings");
  });

  it("offers the profile when an agent application was rejected", () => {
    const onNavigateTab = vi.fn();
    render(
      <PostPropertyTab
        workspace={workspace()}
        posterRole="owner"
        gate={{ title: "Your agent application wasn't approved", text: "Reason", toProfile: true }}
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to my profile" }));

    expect(onNavigateTab).toHaveBeenCalledWith("profile");
  });
});

describe("MyListingsTab", () => {
  it("lists the listings and passes Edit to the workspace", () => {
    const ws = workspace({ properties: [{ _id: "p1", title: "First flat", status: "pending", price: 5000000 }] });
    render(<MyListingsTab workspace={ws} onNavigateTab={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "First flat" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Edit/ }));
    expect(ws.handleEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "p1" }));
  });

  it("invites a first listing when there are none", () => {
    const onNavigateTab = vi.fn();
    const ws = workspace();
    render(<MyListingsTab workspace={ws} onNavigateTab={onNavigateTab} />);

    expect(screen.getByRole("heading", { name: "No listings yet" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Post a property" }));

    expect(ws.handleStartNew).toHaveBeenCalledTimes(1);
    expect(onNavigateTab).toHaveBeenCalledWith("post");
  });

  it("New listing clears any listing being edited, then opens the Post tab", () => {
    const onNavigateTab = vi.fn();
    const ws = workspace();
    render(<MyListingsTab workspace={ws} onNavigateTab={onNavigateTab} />);

    fireEvent.click(screen.getByRole("button", { name: "New listing" }));

    expect(ws.handleStartNew).toHaveBeenCalledTimes(1);
    expect(onNavigateTab).toHaveBeenCalledWith("post");
    expect(ws.handleStartNew.mock.invocationCallOrder[0]).toBeLessThan(
      onNavigateTab.mock.invocationCallOrder[0]
    );
  });

  it("passes the status of the listing being edited to the form", () => {
    render(
      <PostPropertyTab
        workspace={workspace({ editingId: "p1", editingStatus: "approved" })}
        posterRole="owner"
        gate={null}
        currentUser={{ _id: "c1" }}
        onNavigateTab={vi.fn()}
      />
    );

    expect(form.props.editingStatus).toBe("approved");
  });
});
