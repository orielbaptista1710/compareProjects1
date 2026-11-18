import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ListingCard from "../ListingCard";

const OWNER_LISTING = {
  _id: "p1",
  title: "2 BHK flat in Andheri West",
  status: "approved",
  price: 9500000,
  area: { value: 900, unit: "sqft" },
  locality: "Andheri West",
  city: "Mumbai",
  pincode: "400053",
  propertyType: "Flats/Apartments",
  bathrooms: 2,
  furnishing: "Semi Furnished",
  parkings: ["Covered"],
  ageOfProperty: "New",
  floor: 0,
  metadata: { analytics: { viewCount: 1240 } },
};

const renderCard = (listing = {}, handlers = {}) =>
  render(
    <ListingCard
      listing={{ ...OWNER_LISTING, ...listing }}
      onEdit={handlers.onEdit ?? vi.fn()}
      onDelete={handlers.onDelete ?? vi.fn()}
    />
  );

describe("ListingCard", () => {
  it("shows the title, location, price and price per sq ft", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "2 BHK flat in Andheri West" })).toBeInTheDocument();
    expect(screen.getByText("Andheri West, Mumbai 400053")).toBeInTheDocument();
    expect(screen.getByText("₹95 L")).toBeInTheDocument();
    expect(screen.getByText("₹10,556 / sq ft")).toBeInTheDocument();
  });

  it("labels each status the way an owner reads it", () => {
    const { unmount } = renderCard({ status: "approved" });
    expect(screen.getByText("Live")).toBeInTheDocument();
    unmount();

    renderCard({ status: "pending" });
    expect(screen.getByText("In review")).toBeInTheDocument();
  });

  it("leaves out groups with nothing in them (an owner has no RERA or Building rows)", () => {
    renderCard({ floor: undefined, totalFloors: undefined, unitsAvailable: undefined });

    expect(screen.getByRole("group", { name: "Property" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Building" })).not.toBeInTheDocument();
    expect(screen.queryByText("RERA no.")).not.toBeInTheDocument();
  });

  it("shows ground floor, age and RERA for a developer-style listing", () => {
    renderCard({ reraApproved: true, reraNumber: "P51800011606", totalFloors: 19, unitsAvailable: 205 });

    const building = screen.getByRole("group", { name: "Building" });
    expect(within(building).getByText("Ground")).toBeInTheDocument();
    expect(within(building).getByText("205")).toBeInTheDocument();
    expect(screen.getByText("P51800011606")).toBeInTheDocument();
    expect(screen.getByText("New property")).toBeInTheDocument();
  });

  it("shows the extra fields a listing can carry, all in one card", () => {
    renderCard({
      projectName: "Sky Towers",
      developerName: "Avodah Developers",
      listingType: "resale",
      bhk: 2,
      facing: "East",
      priceNegotiable: true,
      emiStarts: 45000,
      tower: 3,
      wing: "B",
      floor: 7,
      floorLabel: "Mid Floor",
      amenities: ["Gym", "Pool"],
      floorPlans: [{ url: "a" }],
      brochure: { url: "https://x/y.pdf" },
      featured: true,
      submittedAt: "2026-11-12T00:00:00.000Z",
    });

    expect(screen.getByText("Sky Towers · Avodah Developers")).toBeInTheDocument();
    expect(screen.getByText("Negotiable")).toBeInTheDocument();
    expect(screen.getByText(/EMI from/)).toBeInTheDocument();
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Resale")).toBeInTheDocument();
    expect(screen.getByText("East")).toBeInTheDocument();
    expect(screen.getByText("7 (Mid Floor)")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Media" })).getByText("Available")).toBeInTheDocument();
    expect(screen.getByText(/Submitted 12 Nov 2026/)).toBeInTheDocument();
  });

  it("shows the description, and nothing when it is blank", () => {
    const { unmount } = renderCard({ description: "  Bright corner flat near the station.  " });
    expect(screen.getByText("Bright corner flat near the station.")).toBeInTheDocument();
    unmount();

    const { container } = renderCard({ description: "   " });
    expect(container.querySelector(".lc-desc")).toBeNull();
  });

  it("opens the full description, amenities and security lists from toggles, one at a time", () => {
    renderCard({
      description: "Short intro.",
      long_description: "The long story\nof the flat.",
      amenities: ["Gym", "Pool"],
      security: ["CCTV", "Guard", "Intercom"],
    });

    const amenities = screen.getByRole("button", { name: /Amenities/ });
    const security = screen.getByRole("button", { name: /Security/ });
    expect(amenities).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Gym")).not.toBeInTheDocument();

    fireEvent.click(amenities);
    expect(screen.getByText("Gym")).toBeVisible();
    expect(screen.getByText("Pool")).toBeVisible();

    fireEvent.click(security);
    expect(amenities).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Intercom")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Full description" }));
    expect(screen.getByText(/The long story/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Full description" }));
    expect(screen.queryByText(/The long story/)).toBeNull();
  });

  it("has no toggles when there are no long lists", () => {
    renderCard({ description: "Short." });
    expect(screen.queryByRole("button", { name: /Amenities|Facilities|Security|Full description/ })).toBeNull();
  });

  it("shows only real numbers: views, and no enquiries or compare counts", () => {
    renderCard();

    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.queryByText(/enquir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/compared/i)).not.toBeInTheDocument();
  });

  it("shows the rejection reason on a rejected listing only", () => {
    const { unmount } = renderCard({ status: "rejected", rejectionReason: "Photos are required" });
    expect(screen.getByText("Photos are required")).toBeInTheDocument();
    unmount();

    renderCard({ status: "pending", rejectionReason: "Old reason" });
    expect(screen.queryByText("Old reason")).not.toBeInTheDocument();
  });

  it("warns that editing a live listing sends it back for review", () => {
    const { unmount } = renderCard({ status: "approved" });
    expect(screen.getByText(/sends a live listing back for review/i)).toBeInTheDocument();
    unmount();

    renderCard({ status: "pending" });
    expect(screen.queryByText(/sends a live listing back for review/i)).not.toBeInTheDocument();
  });

  it("counts photos only when there are some", () => {
    const { unmount } = renderCard();
    expect(screen.queryByText(/photo/)).not.toBeInTheDocument();
    unmount();

    renderCard({ coverImage: { url: "https://res.cloudinary.com/x/a.jpg" }, galleryImages: [{ url: "b" }, { url: "c" }] });
    expect(screen.getByText("3 photos")).toBeInTheDocument();
  });

  it("calls onEdit with the listing and onDelete with its id and title", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderCard({}, { onEdit, onDelete });

    fireEvent.click(screen.getByRole("button", { name: /^Edit/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Delete/ }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "p1" }));
    expect(onDelete).toHaveBeenCalledWith("p1", "2 BHK flat in Andheri West");
  });
});
