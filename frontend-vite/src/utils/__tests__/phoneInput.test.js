import { describe, it, expect } from "vitest";
import { normalizeIndianMobile, isValidIndianMobile } from "../phoneInput";

describe("normalizeIndianMobile", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["98765 43210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["+919876543210", "9876543210"],
    ["919876543210", "9876543210"],
    ["09876543210", "9876543210"],
    ["+91-98765-43210", "9876543210"],
  ])("turns %s into %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  // Keystroke by keystroke, a number starting 91 or 0 must not be rewritten.
  it.each([
    ["9", "9"],
    ["91", "91"],
    ["919", "919"],
    ["9198765432", "9198765432"],
    ["0", "0"],
    ["0987", "0987"],
  ])("leaves partial input %s alone", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it("caps at 10 digits and tolerates junk", () => {
    expect(normalizeIndianMobile("98765432101")).toBe("9876543210");
    expect(normalizeIndianMobile(null)).toBe("");
    expect(normalizeIndianMobile(undefined)).toBe("");
    expect(normalizeIndianMobile("abc")).toBe("");
  });
});

describe("isValidIndianMobile", () => {
  it("accepts a pasted +91 number and rejects bad ones", () => {
    expect(isValidIndianMobile("+91 98765 43210")).toBe(true);
    expect(isValidIndianMobile("5876543210")).toBe(false);
    expect(isValidIndianMobile("98765")).toBe(false);
    expect(isValidIndianMobile("")).toBe(false);
  });
});
