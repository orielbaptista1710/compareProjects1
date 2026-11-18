import { describe, it, expect } from "vitest";
import { buildQuickLook } from "../compareQuickLook";

const a = {
  _id: "a",
  price: 5026000,
  area: { value: 415, unit: "sqft" },
  possessionStatus: "Ready to Move",
  locality: "Virar West",
  city: "Mumbai",
};
const b = {
  _id: "b",
  price: 21100000,
  area: { value: 1732, unit: "sqft" },
  possessionStatus: "New Launch",
  locality: "Santa Inez",
  city: "North Goa",
};

const row = (rows, id) => rows.find((r) => r.id === id);
const best = (r) => r.cells.map((c) => c.best);

describe("buildQuickLook", () => {
  it("marks lowest price and price per sq ft, largest area and ready possession", () => {
    const rows = buildQuickLook([a, b]);
    expect(best(row(rows, "price"))).toEqual([true, false]);
    expect(best(row(rows, "ppsf"))).toEqual([true, false]);
    expect(best(row(rows, "area"))).toEqual([false, true]);
    expect(best(row(rows, "possession"))).toEqual([true, false]);
  });

  it("shows location without ranking it", () => {
    const loc = row(buildQuickLook([a, b]), "location");
    expect(loc.cells.map((c) => c.text)).toEqual(["Virar West, Mumbai", "Santa Inez, North Goa"]);
    expect(best(loc)).toEqual([false, false]);
  });

  it("prefers a stored pricePerSqft over price / area", () => {
    const ppsf = row(buildQuickLook([{ ...a, pricePerSqft: 99999 }, b]), "ppsf");
    expect(ppsf.cells[0].text).toBe("₹99,999");
    expect(best(ppsf)).toEqual([false, true]);
  });

  it("highlights nothing for a single property, all-equal values or one known value", () => {
    expect(buildQuickLook([a]).every((r) => r.cells.every((c) => !c.best))).toBe(true);
    expect(best(row(buildQuickLook([a, { ...b, price: a.price }]), "price"))).toEqual([false, false]);
    expect(best(row(buildQuickLook([a, { ...b, price: 0 }]), "price"))).toEqual([false, false]);
  });

  it("highlights every tied best value", () => {
    const c = { ...b, _id: "c", price: a.price };
    expect(best(row(buildQuickLook([a, b, c]), "price"))).toEqual([true, false, true]);
  });

  it("shows a dash for missing values", () => {
    const rows = buildQuickLook([{ _id: "x" }]);
    expect(rows.map((r) => r.cells[0].text)).toEqual(["—", "—", "—", "—", "—"]);
  });
});
