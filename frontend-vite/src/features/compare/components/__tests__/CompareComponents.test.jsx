import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import HeaderCard from "../HeaderCard/HeaderCard";
import AddSlot from "../AddSlot/AddSlot";
import CompareEmptyState from "../CompareEmptyState/CompareEmptyState";
import CompareErrorBoundary from "../CompareErrorBoundary/CompareErrorBoundary";
import OverviewTab from "../tabs/OverviewTab";
import DetailsTab from "../tabs/DetailsTab";
import AmenitiesTab from "../tabs/AmenitiesTab";
import LocationTab from "../tabs/LocationTab";
import { makeProperty, skyline, greenValley } from "../../../../test/compareTestUtils";

describe("HeaderCard", () => {
  it("shows the key property facts", () => {
    render(<HeaderCard property={skyline} onRemove={vi.fn()} onView={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Skyline Heights" })).toBeInTheDocument();
    expect(screen.getByText("By Acme Developers")).toBeInTheDocument();
    expect(screen.getByText("Andheri, Mumbai, Maharashtra")).toBeInTheDocument();
    expect(screen.getByText("RERA ✓")).toBeInTheDocument();
  });

  it("hides the RERA badge when not approved", () => {
    render(<HeaderCard property={greenValley} onRemove={vi.fn()} onView={vi.fn()} />);
    expect(screen.queryByText("RERA ✓")).not.toBeInTheDocument();
  });

  it("truncates long titles to 48 characters", () => {
    const title = "A".repeat(60);
    render(<HeaderCard property={makeProperty({ title })} onRemove={vi.fn()} onView={vi.fn()} />);
    expect(screen.getByRole("heading")).toHaveTextContent("A".repeat(48));
  });

  it("calls onView when the card is clicked and only onRemove when Remove is clicked", () => {
    const onRemove = vi.fn();
    const onView = vi.fn();
    render(<HeaderCard property={skyline} onRemove={onRemove} onView={onView} />);

    fireEvent.click(screen.getByRole("heading"));
    expect(onView).toHaveBeenCalledWith("p1");

    onView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Remove from comparison" }));
    expect(onRemove).toHaveBeenCalledWith("p1");
    expect(onView).not.toHaveBeenCalled();
  });
});

describe("AddSlot", () => {
  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<AddSlot onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Add property to compare" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("CompareEmptyState", () => {
  it("navigates to /properties", () => {
    const navigate = vi.fn();
    render(<CompareEmptyState navigate={navigate} />);
    fireEvent.click(screen.getByRole("button", { name: /browse properties/i }));
    expect(navigate).toHaveBeenCalledWith("/properties");
  });
});

describe("CompareErrorBoundary", () => {
  const Boom = ({ explode }) => {
    if (explode) throw new Error("boom");
    return <p>tab content</p>;
  };

  it("shows a fallback when a child throws, then recovers when resetKey changes", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <CompareErrorBoundary resetKey="p1-overview">
        <Boom explode />
      </CompareErrorBoundary>
    );
    expect(screen.getByText("Couldn't load this section.")).toBeInTheDocument();

    // Same key: stays in the error state even though the child is now healthy
    rerender(
      <CompareErrorBoundary resetKey="p1-overview">
        <Boom explode={false} />
      </CompareErrorBoundary>
    );
    expect(screen.getByText("Couldn't load this section.")).toBeInTheDocument();

    rerender(
      <CompareErrorBoundary resetKey="p1-details">
        <Boom explode={false} />
      </CompareErrorBoundary>
    );
    expect(screen.getByText("tab content")).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

describe("compare tabs", () => {
  it("OverviewTab shows pricing, RERA number, and at most 6 amenities", () => {
    const amenities = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
    render(<OverviewTab property={makeProperty({ amenities })} />);

    expect(screen.getByText("P51800012345")).toBeInTheDocument();
    expect(screen.getByText("A6")).toBeInTheDocument();
    expect(screen.queryByText("A7")).not.toBeInTheDocument();
  });

  it("OverviewTab hides the RERA number row when not approved", () => {
    render(<OverviewTab property={greenValley} />);
    expect(screen.queryByText("RERA No.")).not.toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("DetailsTab falls back to dashes for missing fields and joins wing/tower", () => {
    render(<DetailsTab property={makeProperty({ wing: "A", tower: "T2" })} />);

    expect(screen.getByText("A / T2")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("AmenitiesTab shows 'None listed' for empty groups", () => {
    render(<AmenitiesTab property={makeProperty({ facilities: [], security: undefined })} />);

    expect(screen.getByText("Gym")).toBeInTheDocument();
    expect(screen.getAllByText("None listed")).toHaveLength(2);
  });

  it("LocationTab renders landmarks and a safe external map link", () => {
    render(
      <LocationTab
        property={makeProperty({
          landmarks: [{ name: "Metro Station" }],
          mapLink: "https://maps.example.com/x",
        })}
      />
    );

    expect(screen.getByText("Metro Station")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /view on map/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
