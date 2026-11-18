import { describe, it, expect } from "vitest";
import { toRupees, splitPrice, formatRupees, priceInWords } from "../price";

describe("toRupees (FORM-06)", () => {
  it.each([
    ["75", "lakh", 7500000],
    ["75.5", "lakh", 7550000],
    ["1.25", "crore", 12500000],
    ["1.15", "crore", 11500000], // 1.15 × 1e7 is 11499999.999… in floating point
    ["7500000", "rupees", 7500000],
    ["75,00,000", "rupees", 7500000],
    ["", "lakh", ""],
    ["  ", "crore", ""],
  ])("%s %s → %s", (amount, unit, rupees) => {
    expect(toRupees(amount, unit)).toBe(rupees);
  });

  it.each(["abc", "1.2.3", ".", "-5", "1e7"])("treats %s as not a number", (amount) => {
    expect(toRupees(amount, "lakh")).toBeNaN();
  });
});

describe("splitPrice", () => {
  it.each([
    [7500000, { amount: "75", unit: "lakh" }],
    [12500000, { amount: "1.25", unit: "crore" }],
    [12345678, { amount: "1.2345678", unit: "crore" }],
    [50000, { amount: "50000", unit: "rupees" }],
    ["7500000", { amount: "75", unit: "lakh" }],
    ["", { amount: "", unit: "lakh" }],
    [undefined, { amount: "", unit: "lakh" }],
    [NaN, { amount: "", unit: "lakh" }],
  ])("%s → %o", (rupees, expected) => {
    expect(splitPrice(rupees)).toEqual(expected);
  });

  it("round-trips every rupee", () => {
    for (const rupees of [100000, 7550001, 12345678, 10000000000]) {
      const { amount, unit } = splitPrice(rupees);
      expect(toRupees(amount, unit)).toBe(rupees);
    }
  });
});

describe("display", () => {
  it("groups digits the Indian way", () => {
    expect(formatRupees(7500000)).toBe("₹75,00,000");
  });

  it("says the price in Lakh or Crore", () => {
    expect(priceInWords(7500000)).toBe("75 Lakh");
    expect(priceInWords(12500000)).toBe("1.25 Crore");
    expect(priceInWords(50000)).toBe("");
  });
});
