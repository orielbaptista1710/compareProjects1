// Render-count checks: a card only re-renders when its own listing changes.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// Called once per card render (every listing here has a cover photo)
const imageCalls = vi.hoisted(() => ({ count: 0 }));
vi.mock("../../../../utils/propertyHelpers", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOptimizedImageUrl: (...args) => {
      imageCalls.count += 1;
      return actual.getOptimizedImageUrl(...args);
    },
  };
});

import ListingsGrid from "../ListingsGrid";

const listing = (id, extra = {}) => ({
  _id: id,
  title: `Flat ${id}`,
  status: "approved",
  price: 5000000,
  coverImage: { url: "https://res.cloudinary.com/demo/image/upload/a.jpg" },
  ...extra,
});

describe("ListingsGrid re-renders", () => {
  beforeEach(() => {
    imageCalls.count = 0;
  });

  it("doesn't re-render the cards when only the parent re-renders", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const listings = [listing("a"), listing("b"), listing("c")];
    const props = { listings, isLoading: false, isError: false, onEdit, onDelete };

    const { rerender } = render(<ListingsGrid {...props} empty={<p>one</p>} />);
    expect(imageCalls.count).toBe(3);

    // New `empty` element each time, same listings and same handlers
    rerender(<ListingsGrid {...props} empty={<p>two</p>} />);
    rerender(<ListingsGrid {...props} empty={<p>three</p>} />);

    expect(imageCalls.count).toBe(3);
  });

  it("re-renders only the card whose listing changed", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const a = listing("a");
    const b = listing("b");
    const c = listing("c");
    const base = { isLoading: false, isError: false, onEdit, onDelete, empty: null };

    const { rerender } = render(<ListingsGrid {...base} listings={[a, b, c]} />);
    expect(imageCalls.count).toBe(3);

    // What a refetch does: unchanged listings keep their identity, one is new
    rerender(<ListingsGrid {...base} listings={[a, listing("b", { price: 6000000 }), c]} />);

    expect(imageCalls.count).toBe(4);
  });
});
