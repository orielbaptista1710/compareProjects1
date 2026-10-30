import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import HeaderCard from "../HeaderCard/HeaderCard";
import CompareEmptyState from "../CompareEmptyState/CompareEmptyState";
import CompareErrorBoundary from "../CompareErrorBoundary/CompareErrorBoundary";
import { makeProperty, skyline } from "../../../../test/compareTestUtils";

describe("HeaderCard", () => {
  it("shows the key property facts", () => {
    render(<HeaderCard property={skyline} onRemove={vi.fn()} onView={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Skyline Heights" })).toBeInTheDocument();
    expect(screen.getByText("Apartment · By Acme Developers")).toBeInTheDocument();
    expect(screen.getByText("Andheri, Mumbai, Maharashtra")).toBeInTheDocument();
    expect(screen.getByText("₹1 Cr")).toBeInTheDocument();
    expect(screen.getByText("(₹10,000/sq ft)")).toBeInTheDocument();
  });

  it("shows a photo count only when there is more than one photo", () => {
    const galleryImages = [{ url: "a.jpg" }, { url: "b.jpg" }, { url: "c.jpg" }];
    const { rerender } = render(
      <HeaderCard property={makeProperty({ galleryImages })} onRemove={vi.fn()} onView={vi.fn()} />
    );
    expect(screen.getByText(/3 Photos/)).toBeInTheDocument();

    rerender(<HeaderCard property={skyline} onRemove={vi.fn()} onView={vi.fn()} />);
    expect(screen.queryByText(/Photos/)).not.toBeInTheDocument();
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
