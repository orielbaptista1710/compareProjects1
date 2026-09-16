import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import ShortlistTab from "../ShortlistTab";
import { CustomerActivityContext } from "../../../../../contexts/CustomerActivityContext";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

// PropertyCard pulls in useHeartProperty, image/formatting helpers, etc. —
// stubbed out so this test stays about ShortlistTab's own pagination UI.
vi.mock("../../../../properties/components/PropertyCard/PropertyCard", () => ({
  default: ({ property }) => <div data-testid="property-card">{property._id}</div>,
}));

function renderTab(contextValue) {
  return render(
    <CustomerActivityContext.Provider
      value={{
        heartProperties: [],
        heartPagination: { page: 1, limit: 20, total: 0, hasMore: false },
        loadingMoreHearts: false,
        loadMoreHearts: vi.fn(),
        loading: false,
        ...contextValue,
      }}
    >
      <ShortlistTab />
    </CustomerActivityContext.Provider>
  );
}

describe("ShortlistTab", () => {
  it("shows the loading shimmer while activity is loading", () => {
    renderTab({ loading: true });

    expect(screen.queryByText("No saved properties yet")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".shimmer-card")).toHaveLength(3);
  });

  it("shows the empty state with a Browse Properties CTA when nothing is saved", () => {
    renderTab({});

    expect(screen.getByText("No saved properties yet")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Browse Properties"));
    expect(navigateMock).toHaveBeenCalledWith("/properties");
  });

  it("renders the loaded page of property cards and the total count from heartPagination", () => {
    renderTab({
      heartProperties: [{ _id: "p1" }, { _id: "p2" }],
      heartPagination: { page: 1, limit: 20, total: 5, hasMore: true },
    });

    expect(screen.getAllByTestId("property-card")).toHaveLength(2);
    // Uses heartPagination.total (the true total), not heartProperties.length
    // (only what's loaded so far) — this is the whole point of the split.
    expect(screen.getByText("5 properties saved")).toBeInTheDocument();
  });

  it("shows a Load More button when hasMore is true and calls loadMoreHearts on click", () => {
    const loadMoreHearts = vi.fn();

    renderTab({
      heartProperties: [{ _id: "p1" }],
      heartPagination: { page: 1, limit: 20, total: 2, hasMore: true },
      loadMoreHearts,
    });

    const button = screen.getByText("Load More");
    fireEvent.click(button);

    expect(loadMoreHearts).toHaveBeenCalledTimes(1);
  });

  it("hides the Load More button once hasMore is false", () => {
    renderTab({
      heartProperties: [{ _id: "p1" }],
      heartPagination: { page: 1, limit: 20, total: 1, hasMore: false },
    });

    expect(screen.queryByText("Load More")).not.toBeInTheDocument();
  });

  it("disables the button and shows a loading label while a page fetch is in flight", () => {
    renderTab({
      heartProperties: [{ _id: "p1" }],
      heartPagination: { page: 1, limit: 20, total: 2, hasMore: true },
      loadingMoreHearts: true,
    });

    const button = screen.getByText("Loading…");
    expect(button).toBeDisabled();
  });
});
