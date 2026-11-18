// The listing title is generated, not typed: what it says for each kind of
// property, and when a saved title is kept instead.
import { describe, it, expect } from "vitest";
import { buildListingTitle, listingTitleFor } from "../listingTitle";

const FLAT = { propertyType: "Flats/Apartments", bhk: "3", locality: "Dombivli", city: "Thane" };

describe("buildListingTitle", () => {
  it.each([
    [FLAT, "3 BHK Flat in Dombivli, Thane"],
    [{ ...FLAT, projectName: "Palava City" }, "3 BHK Flat in Palava City, Dombivli"],
    [{ ...FLAT, bhk: "5+" }, "5 BHK Flat in Dombivli, Thane"],
    [{ ...FLAT, bhk: "" }, "Flat in Dombivli, Thane"],
    [{ ...FLAT, propertyType: "Villa", bhk: 4 }, "4 BHK Villa in Dombivli, Thane"],
    // bedroom count is ignored for anything that isn't a home
    [{ ...FLAT, propertyType: "Plot" }, "Plot in Dombivli, Thane"],
    [{ ...FLAT, propertyType: "Industrial Warehouse/Godown" }, "Warehouse in Dombivli, Thane"],
    [{ ...FLAT, propertyType: "Shop/Showroom", bhk: "" }, "Shop in Dombivli, Thane"],
    // no repeated names
    [{ ...FLAT, locality: "Thane" }, "3 BHK Flat in Thane"],
    [{ propertyType: "Office Space" }, "Office Space"],
  ])("%o → %s", (values, title) => {
    expect(buildListingTitle(values)).toBe(title);
  });

  it("is empty until a property type is chosen", () => {
    expect(buildListingTitle({ bhk: "3", locality: "Dombivli" })).toBe("");
    expect(buildListingTitle()).toBe("");
  });

  it("stays within the title limit", () => {
    const title = buildListingTitle({ ...FLAT, projectName: "P".repeat(150), locality: "L".repeat(100) });
    expect(title.length).toBeLessThanOrEqual(150);
  });
});

describe("listingTitleFor", () => {
  it("generates the title for a new listing", () => {
    expect(listingTitleFor(FLAT, { title: "" })).toBe("3 BHK Flat in Dombivli, Thane");
  });

  it("keeps a saved title that was written by hand", () => {
    const saved = { ...FLAT, title: "Lodha Palava Phase 3" };
    expect(listingTitleFor({ ...FLAT, bhk: "2" }, saved)).toBe("Lodha Palava Phase 3");
  });

  it("updates a generated title when the details change", () => {
    const saved = { ...FLAT, bhk: 3, title: "3 BHK Flat in Dombivli, Thane" };
    expect(listingTitleFor({ ...FLAT, bhk: "2" }, saved)).toBe("2 BHK Flat in Dombivli, Thane");
  });
});
