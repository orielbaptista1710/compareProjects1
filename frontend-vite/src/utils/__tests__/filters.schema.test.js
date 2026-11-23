import { describe, it, expect } from "vitest";
import { parseFiltersFromURL, formatFilterValue } from "../filters.schema";
import { SORT_OPTIONS } from "../sortOptions";

describe("parseFiltersFromURL — area", () => {
  it("keeps a missing areaMax as null (no upper limit), not 10000", () => {
    const { area } = parseFiltersFromURL("?areaMin=5000&areaUnit=sqft");
    expect(area).toEqual({ min: 5000, max: null, unit: "sqft" });
  });

  it("keeps an explicit areaMax", () => {
    const { area } = parseFiltersFromURL("?areaMin=500&areaMax=1000&areaUnit=sqft");
    expect(area).toEqual({ min: 500, max: 1000, unit: "sqft" });
  });

  it("returns null area when neither bound is in the URL", () => {
    expect(parseFiltersFromURL("?areaUnit=sqm").area).toBeNull();
  });
});

describe("formatFilterValue — area chip", () => {
  it("shows 'N+' when there is no upper limit", () => {
    expect(formatFilterValue("area", { min: 5000, max: null, unit: "sqft" })).toBe("5k+ sqft");
  });

  it("still shows 'N+' for an old link carrying the 10000 sqft ceiling", () => {
    expect(formatFilterValue("area", { min: 5000, max: 10000, unit: "sqft" })).toBe("5k+ sqft");
  });

  it("shows a range when both bounds are real", () => {
    expect(formatFilterValue("area", { min: 500, max: 1000, unit: "sqft" })).toBe("500–1k sqft");
  });
});

describe("formatFilterValue — list filters", () => {
  // Property types in the data are already readable, so chips show them as stored.
  it("shows a property type as stored", () => {
    expect(formatFilterValue("propertyType", "Flats/Apartments")).toBe("Flats/Apartments");
  });

  it("formats bhk and facing", () => {
    expect(formatFilterValue("bhk", "3")).toBe("3 BHK");
    expect(formatFilterValue("facing", "east")).toBe("East Facing");
  });
});

describe("SORT_OPTIONS", () => {
  // These must equal the keys of GROUP_SORT_MAP in backend/controllers/propertyController.js;
  // anything else silently falls back to "relevance" on the server.
  it("uses the backend's sort keys", () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual([
      "relevance",
      "price-low-high",
      "price-high-low",
      "newest",
      "oldest",
    ]);
  });
});
