import { describe, it, expect } from "vitest";

import { buildCompareModel } from "../buildCompareModel";
import { getPricePerSqft } from "../../config/compareSections";
import { makeProperty, skyline, greenValley } from "../../../../test/compareTestUtils";

const findRow = (sections, id) => sections.flatMap((s) => s.rows).find((r) => r.id === id);

describe("buildCompareModel", () => {
  it("returns nothing for an empty or invalid list", () => {
    expect(buildCompareModel([])).toEqual([]);
    expect(buildCompareModel(null)).toEqual([]);
  });

  it("formats cells and falls back to a dash", () => {
    const sections = buildCompareModel([skyline, makeProperty({ _id: "p2", wing: "A", tower: "T2" })]);

    expect(findRow(sections, "wing").cells).toEqual(["—", "A / T2"]);
    expect(findRow(sections, "price").cells).toEqual(["₹1 Cr", "₹1 Cr"]);
  });

  it("only shows a RERA number for approved properties", () => {
    const sections = buildCompareModel([skyline, greenValley]);
    expect(findRow(sections, "reraNo").cells).toEqual(["P51800012345", "—"]);
    expect(findRow(sections, "rera").cells).toEqual(["Yes", "No"]);
  });

  it("never marks a row as different when only one property is compared", () => {
    const sections = buildCompareModel([skyline]);
    expect(sections.flatMap((s) => s.rows).some((r) => r.isDiff)).toBe(false);
  });

  it("drops sections whose rows are all empty", () => {
    const sections = buildCompareModel([makeProperty({ amenities: [], facilities: [], security: [] })]);
    expect(sections.map((s) => s.id)).not.toContain("amenities");
    expect(sections.map((s) => s.id)).not.toContain("details");
  });

  it("merges amenities, facilities and security case-insensitively", () => {
    const [amenities] = buildCompareModel([
      makeProperty({ amenities: ["Gym"], facilities: ["Lift"], security: [] }),
      makeProperty({ _id: "p2", amenities: ["gym", "", null], security: ["CCTV"] }),
    ]).filter((s) => s.id === "amenities");

    expect(amenities.rows.map((r) => r.label)).toEqual(["CCTV", "Gym", "Lift"]);
    expect(amenities.counts).toEqual([2, 2]);
    expect(amenities.total).toBe(3);
    expect(findRow([amenities], "amenity-gym")).toMatchObject({ cells: [true, true], isDiff: false });
  });
});

describe("getPricePerSqft", () => {
  it("converts non-sqft area units", () => {
    expect(getPricePerSqft(makeProperty({ price: 1076390, area: { value: 100, unit: "sqmts" } }))).toBe(
      "₹1,000/sq ft"
    );
  });

  it("returns null when price or area is missing", () => {
    expect(getPricePerSqft(makeProperty({ area: undefined }))).toBeNull();
    expect(getPricePerSqft(makeProperty({ price: 0 }))).toBeNull();
  });
});
