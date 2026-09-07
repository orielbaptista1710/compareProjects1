import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencyShort,
  formatIndianNumber,
  formatAreaText,
  safeText,
  fmtArea,
  fmtDate,
} from "../formatters";

describe("formatCurrency", () => {
  it("formats values using the Indian numbering system", () => {
    expect(formatCurrency(12500000)).toBe("₹1,25,00,000");
    expect(formatCurrency(750000)).toBe("₹7,50,000");
  });

  it("rounds fractional values to zero decimal places", () => {
    expect(formatCurrency(123456.78)).toBe("₹1,23,457");
  });

  it("supports hiding the currency symbol", () => {
    expect(formatCurrency(750000, { showSymbol: false })).toBe("7,50,000");
  });

  it("uses the default fallback for invalid values", () => {
    expect(formatCurrency(null)).toBe("Price on Request");
    expect(formatCurrency(undefined)).toBe("Price on Request");
    expect(formatCurrency("invalid")).toBe("Price on Request");
    expect(formatCurrency(Infinity)).toBe("Price on Request");
  });

  it("uses the fallback for zero and negative values", () => {
    expect(formatCurrency(0)).toBe("Price on Request");
    expect(formatCurrency(-100)).toBe("Price on Request");
  });

  it("supports a custom fallback", () => {
    expect(
      formatCurrency(null, {
        fallback: "Contact for price",
      })
    ).toBe("Contact for price");
  });

  it("accepts numeric strings", () => {
    expect(formatCurrency("750000")).toBe("₹7,50,000");
  });
});

describe("formatCurrencyShort", () => {
  describe("crore values", () => {
    it("formats values in crores", () => {
      expect(formatCurrencyShort(12500000)).toBe("₹1.25 Cr");
      expect(formatCurrencyShort(10000000)).toBe("₹1 Cr");
    });

    it("removes unnecessary trailing zeros", () => {
      expect(formatCurrencyShort(15000000)).toBe("₹1.5 Cr");
      expect(formatCurrencyShort(20000000)).toBe("₹2 Cr");
    });
  });

  describe("lakh values", () => {
    it("formats values in lakhs", () => {
      expect(formatCurrencyShort(750000)).toBe("₹7.5 L");
      expect(formatCurrencyShort(100000)).toBe("₹1 L");
    });

    it("removes unnecessary trailing zeros", () => {
      expect(formatCurrencyShort(150000)).toBe("₹1.5 L");
      expect(formatCurrencyShort(200000)).toBe("₹2 L");
    });
  });

  describe("thousand values", () => {
    it("formats values in thousands", () => {
      expect(formatCurrencyShort(50000)).toBe("₹50 K");
      expect(formatCurrencyShort(1500)).toBe("₹1.5 K");
    });

    it("removes unnecessary trailing zeros", () => {
      expect(formatCurrencyShort(1000)).toBe("₹1 K");
      expect(formatCurrencyShort(2000)).toBe("₹2 K");
    });
  });

  describe("small values", () => {
    it("keeps values below 1000 as normal numbers", () => {
      expect(formatCurrencyShort(500)).toBe("₹500");
      expect(formatCurrencyShort(999)).toBe("₹999");
    });
  });

  it("handles the exact formatting boundaries correctly", () => {
    expect(formatCurrencyShort(99999)).toBe("₹100 K");
    expect(formatCurrencyShort(100000)).toBe("₹1 L");

    expect(formatCurrencyShort(9999999)).toBe("₹100 L");
    expect(formatCurrencyShort(10000000)).toBe("₹1 Cr");
  });

  it("supports hiding the currency symbol", () => {
    expect(
      formatCurrencyShort(12500000, {
        showSymbol: false,
      })
    ).toBe("1.25 Cr");
  });

  it("respects the decimals option", () => {
    expect(
      formatCurrencyShort(12345678, {
        decimals: 1,
      })
    ).toBe("₹1.2 Cr");

    expect(
      formatCurrencyShort(12345678, {
        decimals: 0,
      })
    ).toBe("₹1 Cr");
  });

  it("falls back to 2 decimals when decimals is invalid", () => {
    expect(
      formatCurrencyShort(12500000, {
        decimals: "invalid",
      })
    ).toBe("₹1.25 Cr");
  });

  it("limits decimal places to the supported maximum", () => {
    expect(
      formatCurrencyShort(12345678, {
        decimals: 50,
      })
    ).toContain("Cr");
  });

  it("uses the fallback for invalid values", () => {
    expect(formatCurrencyShort(null)).toBe("Price on Request");
    expect(formatCurrencyShort(undefined)).toBe("Price on Request");
    expect(formatCurrencyShort("invalid")).toBe("Price on Request");
    expect(formatCurrencyShort(Infinity)).toBe("Price on Request");
  });

  it("uses the fallback for zero and negative values", () => {
    expect(formatCurrencyShort(0)).toBe("Price on Request");
    expect(formatCurrencyShort(-500000)).toBe("Price on Request");
  });

  it("supports a custom fallback", () => {
    expect(
      formatCurrencyShort(null, {
        fallback: "Ask developer",
      })
    ).toBe("Ask developer");
  });

  it("accepts numeric strings", () => {
    expect(formatCurrencyShort("12500000")).toBe("₹1.25 Cr");
  });
});

describe("formatIndianNumber", () => {
  it("formats numbers using the Indian numbering system", () => {
    expect(formatIndianNumber(12345)).toBe("12,345");
    expect(formatIndianNumber(1234567)).toBe("12,34,567");
  });

  it("formats decimal numbers", () => {
    expect(formatIndianNumber(1234.56)).toBe("1,234.56");
  });

  it("accepts numeric strings", () => {
    expect(formatIndianNumber("1234567")).toBe("12,34,567");
  });

  it("returns null for missing values", () => {
    expect(formatIndianNumber(null)).toBeNull();
    expect(formatIndianNumber(undefined)).toBeNull();
    expect(formatIndianNumber("")).toBeNull();
  });

  it("returns null for invalid values", () => {
    expect(formatIndianNumber("invalid")).toBeNull();
    expect(formatIndianNumber(Infinity)).toBeNull();
  });

  it("allows zero", () => {
    expect(formatIndianNumber(0)).toBe("0");
  });

  it("allows negative numbers", () => {
    expect(formatIndianNumber(-12345)).toBe("-12,345");
  });
});

describe("formatAreaText", () => {
  it("formats a valid area with its provided unit", () => {
    expect(
      formatAreaText({
        value: 1250,
        unit: "sqft",
      })
    ).toBe("1,250 sqft");
  });

  it("uses the default unit when no unit is provided", () => {
    expect(
      formatAreaText({
        value: 1250,
      })
    ).toBe("1,250 sqft");
  });

  it("formats large areas using Indian number formatting", () => {
    expect(
      formatAreaText({
        value: 1234567,
        unit: "sqft",
      })
    ).toBe("12,34,567 sqft");
  });

  it("returns the default fallback when area is missing", () => {
    expect(formatAreaText(null)).toBeNull();
    expect(formatAreaText(undefined)).toBeNull();
    expect(formatAreaText({})).toBeNull();
  });

  it("returns a custom fallback when area is missing", () => {
    expect(
      formatAreaText(null, {
        fallback: "Area on request",
      })
    ).toBe("Area on request");
  });

  it("returns the fallback when area value is invalid", () => {
    expect(
      formatAreaText(
        {
          value: "invalid",
          unit: "sqft",
        },
        {
          fallback: "Area unavailable",
        }
      )
    ).toBe("Area unavailable");
  });

  it("supports a custom default unit", () => {
    expect(
      formatAreaText(
        {
          value: 1250,
        },
        {
          defaultUnit: "sq.m",
        }
      )
    ).toBe("1,250 sq.m");
  });

  it("allows zero as an area value", () => {
    expect(
      formatAreaText({
        value: 0,
        unit: "sqft",
      })
    ).toBe("0 sqft");
  });
});

describe("safeText", () => {
  it("returns normal values unchanged", () => {
    expect(safeText("Mumbai")).toBe("Mumbai");
    expect(safeText(123)).toBe(123);
    expect(safeText(false)).toBe(false);
  });

  it("returns an em dash for null or undefined", () => {
    expect(safeText(null)).toBe("—");
    expect(safeText(undefined)).toBe("—");
  });

  it("returns an em dash for an empty string", () => {
    expect(safeText("")).toBe("—");
  });

  it("returns an em dash for whitespace-only strings", () => {
    expect(safeText("   ")).toBe("—");
    expect(safeText("\n\t")).toBe("—");
  });

  it("preserves non-empty strings", () => {
    expect(safeText(" Mumbai ")).toBe(" Mumbai ");
  });
});

describe("fmtArea", () => {
  it("formats an area for overview and detail displays", () => {
    expect(
      fmtArea({
        value: 1250,
        unit: "sq.ft",
      })
    ).toBe("1,250 sq.ft");
  });

  it("uses sq.ft as the default unit", () => {
    expect(
      fmtArea({
        value: 1250,
      })
    ).toBe("1,250 sq.ft");
  });

  it("returns an em dash when the area is missing", () => {
    expect(fmtArea(null)).toBe("—");
    expect(fmtArea(undefined)).toBe("—");
    expect(fmtArea({})).toBe("—");
  });

  it("returns an em dash for an invalid area value", () => {
    expect(
      fmtArea({
        value: "invalid",
      })
    ).toBe("—");
  });
});

describe("fmtDate", () => {
  it("formats a valid date using the expected display format", () => {
    expect(fmtDate("2026-08-29T12:00:00")).toBe("29 Aug 2026");
  });

  it("accepts Date objects", () => {
    expect(
      fmtDate(new Date("2026-08-29T12:00:00"))
    ).toBe("29 Aug 2026");
  });

  it("returns an em dash for missing values", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate("")).toBe("—");
  });

  it("returns an em dash for invalid dates", () => {
    expect(fmtDate("not-a-date")).toBe("—");
  });
});