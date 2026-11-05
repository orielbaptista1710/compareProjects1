import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DeveloperDetailsModal from "../DeveloperDetailsModal";

const renderModal = (property) =>
  render(<DeveloperDetailsModal open onClose={vi.fn()} property={property} onApprove={vi.fn()} />);

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

  it("keeps the builder details for a developer listing", () => {
    renderModal({ title: "Lodha Palava", listedBy: "developer", developerName: "Lodha Group", tierType: "Premium" });

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
