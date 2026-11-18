import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import DeveloperDetailsModal from "../DeveloperDetailsModal";

const renderModal = (property) =>
  render(<DeveloperDetailsModal open onClose={vi.fn()} property={property} onApprove={vi.fn()} />);

describe("DeveloperDetailsModal — edited listings and review history", () => {
  const HISTORY = [
    { action: "rejected", by: { displayName: "Reviewer Ravi" }, at: "2026-01-02T10:00:00Z", reason: "Blurry photos" },
    { action: "approved", by: { displayName: "Admin Asha" }, at: "2026-01-09T10:00:00Z" },
  ];

  it("flags a pending listing that was edited after a review, with what changed", () => {
    renderModal({
      title: "Flat",
      listedBy: "owner",
      status: "pending",
      lastEditedAt: "2026-02-01T10:00:00Z",
      changedFields: ["amenities", "price", "title"],
      reviewHistory: HISTORY,
      userId: { customerName: "Asha" },
    });

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("Edited listing");
    const chips = within(note).getAllByText(/^(Price|Title|Amenities)$/).map((el) => el.textContent);
    // price and title (what a reviewer should look at first) come before amenities
    expect(chips.indexOf("Amenities")).toBe(2);
    expect(note).toHaveTextContent(/Last decision: Approved by Admin Asha/);
  });

  it("reminds the reviewer why it was rejected last time", () => {
    renderModal({
      title: "Flat",
      listedBy: "owner",
      status: "pending",
      lastEditedAt: "2026-02-01T10:00:00Z",
      changedFields: ["description"],
      reviewHistory: [HISTORY[0]],
      userId: { customerName: "Asha" },
    });

    expect(screen.getByRole("note")).toHaveTextContent("Last decision: Rejected by Reviewer Ravi");
    expect(screen.getByRole("note")).toHaveTextContent("Reason: Blurry photos");
  });

  it("doesn't show the edited notice for a new listing or one that isn't pending", () => {
    const { unmount } = renderModal({ title: "New", listedBy: "owner", status: "pending", userId: {} });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    unmount();

    renderModal({ title: "Done", listedBy: "owner", status: "approved", lastEditedAt: "2026-02-01T10:00:00Z", userId: {} });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("lists every decision newest first, naming who made it", () => {
    renderModal({ title: "Flat", listedBy: "owner", status: "approved", reviewHistory: HISTORY, userId: {} });

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Approved by Admin Asha");
    expect(items[1]).toHaveTextContent("Rejected by Reviewer Ravi");
    expect(items[1]).toHaveTextContent("Reason: Blurry photos");
  });

  it("doesn't break when a reviewer's account no longer exists", () => {
    renderModal({
      title: "Flat",
      listedBy: "owner",
      status: "approved",
      reviewHistory: [{ action: "approved", by: "64b000000000000000000001", at: "2026-01-09T10:00:00Z" }],
      userId: {},
    });

    expect(screen.getByRole("list")).toHaveTextContent("Approved by an admin");
  });

  it("says so when nothing has been decided yet", () => {
    renderModal({ title: "Flat", listedBy: "owner", status: "pending", userId: {} });

    expect(screen.getByText("No decisions yet.")).toBeInTheDocument();
  });

  it("shows poster-written text as plain text, never as markup", () => {
    renderModal({
      title: "Flat",
      listedBy: "owner",
      status: "pending",
      lastEditedAt: "2026-02-01T10:00:00Z",
      changedFields: ["<img src=x onerror=alert(1)>"],
      reviewHistory: [{ action: "rejected", by: {}, at: "2026-01-02T10:00:00Z", reason: "<b>bold</b>" }],
      userId: {},
    });

    expect(document.querySelector("img[src='x']")).toBeNull();
    expect(screen.getAllByText(/<b>bold<\/b>/).length).toBeGreaterThan(0);
  });

  it("keeps Additional Details out of the Location section, and joins parking with commas", () => {
    renderModal({
      title: "Flat",
      listedBy: "owner",
      status: "pending",
      parkings: ["Open", "Covered"],
      reraDate: "2027-03-01T00:00:00Z",
      userId: {},
    });

    expect(screen.getByText("Parking:").parentElement).toHaveTextContent("Parking: Open, Covered");
    expect(screen.getByText("Completion date:")).toBeInTheDocument();
    const location = screen.getByText("Location").parentElement;
    expect(within(location).queryByText("Additional Details")).not.toBeInTheDocument();
  });
});

describe("DeveloperDetailsModal — Posted by", () => {
  it("shows how to reach and verify an agent", () => {
    renderModal({
      title: "2 BHK in Andheri",
      listedBy: "agent",
      status: "pending",
      userId: {
        customerName: "Ravi Shah",
        customerEmail: "ravi@example.com",
        customerPhone: "+919800000001",
        emailVerified: true,
        agent: { status: "approved", agencyName: "Prime Realty", reraAgentId: "A51800012345" },
      },
    });

    expect(screen.getByText("Posted by")).toBeInTheDocument();
    expect(screen.getByText("A51800012345")).toBeInTheDocument();
    expect(screen.getByText("Prime Realty", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("+919800000001", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.queryByText(/Tier:/)).not.toBeInTheDocument();
  });

  it("keeps the developer details for a developer listing", () => {
    renderModal({ title: "Lodha Palava", listedBy: "developer", developerName: "Lodha Group", tierType: "Premium" });

    expect(screen.getByText("Developer:")).toBeInTheDocument();
    expect(screen.getByText("Lodha Group", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Premium", { exact: false })).toBeInTheDocument();
  });

  it("shows the ground floor and the rejection reason", () => {
    renderModal({
      title: "Flat", listedBy: "owner", floor: 0, status: "rejected", rejectionReason: "Blurry photos",
      userId: { customerName: "Asha" },
    });

    expect(screen.getByText("Ground", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Blurry photos", { exact: false })).toBeInTheDocument();
  });
});
