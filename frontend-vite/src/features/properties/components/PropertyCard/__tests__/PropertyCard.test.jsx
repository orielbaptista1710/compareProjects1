import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import PropertyCard from "../PropertyCard";
import { AuthContext } from "../../../../../contexts/AuthContext";
import { CustomerActivityContext } from "../../../../../contexts/CustomerActivityContext";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

function renderCard(props, { heartedIds = [], toggleHeart = vi.fn(), currentUser = { uid: "u1" } } = {}) {
  return render(
    <AuthContext.Provider value={{ currentUser }}>
      <CustomerActivityContext.Provider value={{ heartedIds, toggleHeart }}>
        <PropertyCard {...props} />
      </CustomerActivityContext.Provider>
    </AuthContext.Provider>
  );
}

const flatProperty = {
  _id: "prop-1",
  title: "Sunrise Heights",
  developerName: "Acme Developers",
  city: "Mumbai",
  locality: "Andheri",
  state: "Maharashtra",
  price: 5_000_000,
  bhk: 3,
  area: { value: 1200, unit: "sqft" },
  bathrooms: 2,
  facing: "East",
  parkings: 1,
  description: "A lovely home.",
};

// Mirrors exactly what the backend's grouped aggregation returns for a
// multi-unit project: shared fields at the top, per-unit fields in `units`,
// already sorted cheapest-first.
const groupedProject = {
  _id: "kalpataru-vian-mumbai",
  projectKey: "kalpataru-vian-mumbai",
  title: "3 BHK in Kalpataru Vian",
  projectName: "Vian",
  developerName: "Kalpataru",
  city: "Mumbai",
  locality: "Lokhandwala",
  state: "Maharashtra",
  minPrice: 50_500_000,
  maxPrice: 96_300_000,
  bhkList: [3, 4],
  units: [
    { _id: "unit-3bhk-small", slug: "u1", bhk: 3, price: 50_500_000, area: { value: 1116, unit: "sqft" }, bathrooms: 2, facing: "North", parkings: 1 },
    { _id: "unit-3bhk-large", slug: "u2", bhk: 3, price: 59_100_000, area: { value: 1292, unit: "sqft" }, bathrooms: 2, facing: "East", parkings: 1 },
    { _id: "unit-4bhk", slug: "u3", bhk: 4, price: 96_300_000, area: { value: 2127, unit: "sqft" }, bathrooms: 3, facing: "West", parkings: 2 },
  ],
};

const getTiles = (container) => Array.from(container.querySelectorAll(".pc-config-tile"));
const getMetaRow = (container) => container.querySelector(".pc-meta-row");

describe("PropertyCard — single-unit (flat property, today's behavior)", () => {
  it("renders the flat property's own fields as a single configuration tile", () => {
    const { container } = renderCard({ property: flatProperty });

    expect(screen.getByRole("heading", { name: "Sunrise Heights" })).toBeInTheDocument();

    const tiles = getTiles(container);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toHaveTextContent("3 BHK");
    expect(tiles[0]).toHaveTextContent("₹50 L");
    expect(tiles[0]).toHaveTextContent("1200 sqft");

    expect(getMetaRow(container)).toHaveTextContent("1 Parking · 2 Bath · East Facing");
    // No "Starting From" range badge for a single unit.
    expect(screen.queryByText(/Starting From/i)).not.toBeInTheDocument();
    // No scroll-nav arrows when there's only one tile.
    expect(container.querySelector(".pc-config-nav")).not.toBeInTheDocument();
  });

  it("a grouped response with exactly one unit renders the same way (singleton group fallback)", () => {
    const { container } = renderCard({
      property: { ...flatProperty, units: [{ _id: flatProperty._id, bhk: 3, price: 5_000_000, area: flatProperty.area, bathrooms: 2, facing: "East", parkings: 1 }] },
    });

    expect(screen.getByRole("heading", { name: "Sunrise Heights" })).toBeInTheDocument();
    expect(getTiles(container)).toHaveLength(1);
  });

  it("navigates to the property on card click, and does nothing when the id is missing", () => {
    const first = renderCard({ property: flatProperty });
    fireEvent.click(screen.getByRole("button", { name: /Property: Sunrise Heights/i }));
    expect(navigateMock).toHaveBeenCalledWith("/property/prop-1");
    first.unmount();

    navigateMock.mockClear();
    renderCard({ property: { ...flatProperty, _id: undefined } });
    fireEvent.click(screen.getByRole("button", { name: /Property: Sunrise Heights/i }));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows an optional developer logo only when developerAvatar is present", () => {
    const { container, rerender } = renderCard({ property: flatProperty });
    expect(container.querySelector(".pc-dev-avatar")).not.toBeInTheDocument();

    rerender(
      <AuthContext.Provider value={{ currentUser: { uid: "u1" } }}>
        <CustomerActivityContext.Provider value={{ heartedIds: [], toggleHeart: vi.fn() }}>
          <PropertyCard property={{ ...flatProperty, developerAvatar: { url: "https://cdn.test/logo.png" } }} />
        </CustomerActivityContext.Provider>
      </AuthContext.Provider>
    );
    const avatar = container.querySelector(".pc-dev-avatar img");
    expect(avatar).toHaveAttribute("src", "https://cdn.test/logo.png");
    expect(avatar).toHaveAttribute("alt", "Acme Developers");
  });

  it("combines possession status, units, parking, bathrooms, facing and furnishing into one compact meta line", () => {
    const { container } = renderCard({
      property: {
        ...flatProperty,
        possessionStatus: "Under Construction",
        reraDate: "2029-06-15",
        unitsAvailable: 820,
        furnishing: "Semi Furnished",
      },
    });

    expect(getMetaRow(container)).toHaveTextContent(
      "Under Construction · Jun 2029 · 820 Units · 1 Parking · 2 Bath · East Facing · Semi Furnished"
    );
    // Not duplicated in the bottom meta strip.
    expect(container.querySelectorAll(".pc-meta-strip .pc-meta-item")).toHaveLength(1); // just "By Acme Developers"
  });

  it("omits the meta line entirely when none of its fields are present", () => {
    const { container } = renderCard({
      property: { _id: "p2", title: "Bare Listing", city: "Pune", locality: "Baner", price: 4_000_000 },
    });
    expect(getMetaRow(container)).not.toBeInTheDocument();
  });
});

describe("PropertyCard — grouped project (multiple units, one tile each)", () => {
  beforeEach(() => navigateMock.mockClear());

  it("shows the project name, one tile per unit (not per BHK), and defaults to the cheapest unit", () => {
    const { container } = renderCard({ property: groupedProject });

    expect(screen.getByRole("heading", { name: "Vian" })).toBeInTheDocument();
    expect(screen.getByText("3, 4 BHK Flats in")).toBeInTheDocument();

    const tiles = getTiles(container);
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveTextContent("3 BHK");
    expect(tiles[0]).toHaveTextContent("1116 sqft");
    expect(tiles[2]).toHaveTextContent("4 BHK");

    expect(tiles[0]).toHaveAttribute("aria-pressed", "true");
    expect(tiles[1]).toHaveAttribute("aria-pressed", "false");
    expect(tiles[2]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/Starting From/)).toBeInTheDocument();
    expect(getMetaRow(container)).toHaveTextContent("1 Parking · 2 Bath · North Facing");
  });

  it("selecting a different tile swaps price/bathrooms/facing/parking and the nav target", () => {
    const { container } = renderCard({ property: groupedProject });

    const tiles = getTiles(container);
    fireEvent.click(tiles[2]); // the 4 BHK unit

    expect(tiles[2]).toHaveAttribute("aria-pressed", "true");
    expect(tiles[0]).toHaveAttribute("aria-pressed", "false");
    expect(getMetaRow(container)).toHaveTextContent("2 Parking · 3 Bath · West Facing");
    expect(screen.getByText("₹9.63 Cr")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Property: Vian/i }));
    expect(navigateMock).toHaveBeenCalledWith("/property/unit-4bhk");
  });

  it("heart and compare act on the selected unit's _id, not the group's", () => {
    const toggleHeart = vi.fn().mockResolvedValue(undefined);
    const addToCompare = vi.fn();
    const compareIds = new Set(["unit-4bhk"]);

    const { container } = renderCard({ property: groupedProject, addToCompare, compareIds }, { toggleHeart });

    // Cheapest unit selected by default — not in compareIds — shows "+ Compare".
    expect(screen.getByRole("button", { name: /\+ Compare/ })).toBeInTheDocument();

    fireEvent.click(getTiles(container)[2]); // select the unit that IS in compareIds
    expect(screen.getByRole("button", { name: /Compared/ })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Save"));
    expect(toggleHeart).toHaveBeenCalledWith("unit-4bhk");

    fireEvent.click(screen.getByRole("button", { name: /Compared/ }));
    expect(addToCompare).toHaveBeenCalledWith(expect.objectContaining({ _id: "unit-4bhk", bhk: 4, price: 96_300_000 }));
  });

  it("supports left/right arrow key navigation between tiles", () => {
    const { container } = renderCard({ property: groupedProject });
    const tiles = getTiles(container);

    tiles[0].focus();
    fireEvent.keyDown(tiles[0], { key: "ArrowRight" });
    expect(tiles[1]).toHaveAttribute("aria-pressed", "true");
    expect(document.activeElement).toBe(tiles[1]);

    fireEvent.keyDown(tiles[1], { key: "ArrowLeft" });
    expect(tiles[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps one tile per unit even with many units sharing the same BHK, and shows a scroll-next arrow once the row actually overflows", () => {
    const manyUnitsProject = {
      _id: "many-units-project",
      title: "1 BHK Apartment in Big Project",
      projectName: "Big Project",
      developerName: "BigDev",
      city: "Mumbai",
      locality: "Virar",
      bhkList: [1, 2],
      minPrice: 3_000_000,
      maxPrice: 6_600_000,
      units: [
        { _id: "u1", bhk: 1, price: 3_000_000, area: { value: 405, unit: "sqft" } },
        { _id: "u2", bhk: 1, price: 3_100_000, area: { value: 399, unit: "sqft" } },
        { _id: "u3", bhk: 1, price: 3_200_000, area: { value: 410, unit: "sqft" } },
        { _id: "u4", bhk: 1, price: 3_300_000, area: { value: 415, unit: "sqft" } },
        { _id: "u5", bhk: 1, price: 3_400_000, area: { value: 437, unit: "sqft" } },
        { _id: "u6", bhk: 1, price: 3_500_000, area: { value: 410, unit: "sqft" } },
        { _id: "u7", bhk: 1, price: 3_600_000, area: { value: 401, unit: "sqft" } },
        { _id: "u8", bhk: 1, price: 3_700_000, area: { value: 407, unit: "sqft" } },
        { _id: "u9", bhk: 1, price: 3_800_000, area: { value: 439, unit: "sqft" } },
        { _id: "u10", bhk: 2, price: 6_400_000, area: { value: 644, unit: "sqft" } },
        { _id: "u11", bhk: 2, price: 6_600_000, area: { value: 666, unit: "sqft" } },
      ],
    };

    const { container } = renderCard({ property: manyUnitsProject });

    // No BHK grouping any more — 11 units means 11 tiles, in one scrollable row.
    expect(getTiles(container)).toHaveLength(11);
    expect(container.querySelector(".pc-bhk-chip")).not.toBeInTheDocument();
    expect(container.querySelector(".pc-unit-select")).not.toBeInTheDocument();

    // jsdom reports 0 for scrollWidth/clientWidth, so no nav arrows yet.
    expect(container.querySelector(".pc-config-nav--next")).not.toBeInTheDocument();

    // Simulate the row actually overflowing in a real browser.
    const row = container.querySelector(".pc-config-row");
    Object.defineProperty(row, "scrollWidth", { value: 1600, configurable: true });
    Object.defineProperty(row, "clientWidth", { value: 600, configurable: true });
    Object.defineProperty(row, "scrollLeft", { value: 0, configurable: true, writable: true });
    fireEvent.scroll(row);

    expect(container.querySelector(".pc-config-nav--next")).toBeInTheDocument();
    expect(container.querySelector(".pc-config-nav--prev")).not.toBeInTheDocument(); // at the start

    const scrollBySpy = vi.fn();
    row.scrollBy = scrollBySpy;
    fireEvent.click(container.querySelector(".pc-config-nav--next"));
    expect(scrollBySpy).toHaveBeenCalledWith(expect.objectContaining({ left: 180 }));
  });
});
