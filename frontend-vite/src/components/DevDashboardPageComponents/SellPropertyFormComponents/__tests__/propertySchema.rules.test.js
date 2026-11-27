// The form asks each poster for exactly the fields the API requires of them
// (constants/listingRules.js, shared with the backend; FORM-04). If the form
// required more, a poster could be stuck; if less, the API would refuse a form
// the poster thought was complete.
import { describe, it, expect } from "vitest";
import { propertySchemas, PROPERTY_FORM_FIELDS } from "../propertySchema";
import {
  REQUIRED_FIELDS, TEXT_LIMITS, TEXT_MINIMUMS, FIELDS_NOT_FOR_TYPE, FURNISHING_REQUIRED_TYPES,
} from "../../../../constants/listingRules";
import { LISTED_BY } from "../../../../constants/roles";

// A value for every field any poster can be required to give
const FILLED = {
  propertyType: "Flats/Apartments",
  description: "Spacious homes close to the station.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri",
  address: "12 Test Road",
  pincode: "400053",
  price: "9500000",
  furnishing: "Unfurnished",
  developerName: "Dev Co",
  possessionStatus: "Ready to Move",
  unitsAvailable: "4",
};

const ROLES = [LISTED_BY.OWNER, LISTED_BY.AGENT, LISTED_BY.DEVELOPER];
// A flat must also say how it's furnished (FURNISHING_REQUIRED_TYPES)
const onlyRequired = (role) => ({
  ...Object.fromEntries(REQUIRED_FIELDS[role].map((f) => [f, FILLED[f]])),
  furnishing: FILLED.furnishing,
  // the two ticks at the end of the form
  termsAccepted: true,
  detailsConfirmed: true,
});

describe.each(ROLES)("the %s form", (role) => {
  const schema = propertySchemas[role];

  it("accepts a listing with only the required fields", () => {
    expect(schema.safeParse(onlyRequired(role)).success).toBe(true);
  });

  it.each(["termsAccepted", "detailsConfirmed"])("refuses it unless %s is ticked", (field) => {
    expect(schema.safeParse({ ...onlyRequired(role), [field]: false }).success).toBe(false);
    const missing = onlyRequired(role);
    delete missing[field];
    expect(schema.safeParse(missing).success).toBe(false);
  });

  it.each(REQUIRED_FIELDS[role])("refuses it without %s", (field) => {
    const values = onlyRequired(role);
    delete values[field];
    expect(schema.safeParse(values).success).toBe(false);
  });

  it("uses the shared length limits", () => {
    for (const [field, max] of Object.entries(TEXT_LIMITS)) {
      if (!PROPERTY_FORM_FIELDS.includes(field)) continue; // e.g. title is generated, not typed
      const tooLong = { ...onlyRequired(role), [field]: "x".repeat(max + 1) };
      const result = schema.safeParse(tooLong);
      expect(result.success, `${field} over ${max}`).toBe(false);
    }
  });

  it("refuses a floor it can't read instead of dropping it (FORM-18)", () => {
    const result = schema.safeParse({ ...onlyRequired(role), floor: "Top" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["floor"]);
  });

  it("refuses a floor above the building's total floors", () => {
    const values = { ...onlyRequired(role), totalFloors: "10" };
    expect(schema.safeParse({ ...values, floor: "11" }).success).toBe(false);
    expect(schema.safeParse({ ...values, floor: "10th" }).success).toBe(true);
    expect(schema.safeParse({ ...values, floor: "B2" }).success).toBe(true);
  });

  it("says what is wrong with an empty or bad units box, never 'received NaN'", () => {
    if (role !== LISTED_BY.DEVELOPER) return;
    for (const unitsAvailable of ["", undefined, "0", "2.5"]) {
      const result = schema.safeParse({ ...onlyRequired(role), unitsAvailable });
      expect(result.success).toBe(false);
      const message = result.error.issues.find((i) => i.path[0] === "unitsAvailable").message;
      expect(message).not.toMatch(/NaN/);
    }
  });

  it("takes a lettered tower, and an older listing's numeric one", () => {
    expect(schema.safeParse({ ...onlyRequired(role), tower: "T2" }).success).toBe(true);
    expect(schema.safeParse({ ...onlyRequired(role), tower: 3 }).success).toBe(true);
  });

  // ── Price and area (FORM-06, FORM-07): same limits as the API ──
  it.each([
    ["₹1 lakh", 100000, true],
    ["₹1,000 crore", 10000000000, true],
    ["under ₹1 lakh", 99999, false],
    ["over ₹1,000 crore", 10000000001, false],
    ["a fraction of a rupee", 9500000.5, false],
  ])("price: %s", (_, price, ok) => {
    expect(schema.safeParse({ ...onlyRequired(role), price }).success).toBe(ok);
  });

  it("refuses an EMI in paise or over ₹1 crore", () => {
    expect(schema.safeParse({ ...onlyRequired(role), emiStarts: "45000" }).success).toBe(true);
    expect(schema.safeParse({ ...onlyRequired(role), emiStarts: "45000.5" }).success).toBe(false);
    expect(schema.safeParse({ ...onlyRequired(role), emiStarts: "10000001" }).success).toBe(false);
  });

  it.each([
    [{ value: "1200", unit: "sqft", type: "carpet" }, true],
    [{ value: "1200", unit: "sqft", type: "" }, true],
    [{ value: "5", unit: "sqft" }, false],
    [{ value: "300", unit: "acres" }, false],
    [{ value: "1200", unit: "sqft", type: "balcony" }, false],
  ])("area %o → %s", (area, ok) => {
    const result = schema.safeParse({ ...onlyRequired(role), area });
    expect(result.success).toBe(ok);
  });

  // ── Fields that follow the type (FORM-08) ──
  it.each(Object.keys(FIELDS_NOT_FOR_TYPE))("asks a %s for furnishing only if it's a home", (propertyType) => {
    const values = { ...onlyRequired(role), propertyType, furnishing: "" };
    expect(schema.safeParse(values).success).toBe(!FURNISHING_REQUIRED_TYPES.includes(propertyType));
  });

  it("ignores what a plot doesn't have, even if it was left invalid", () => {
    const plot = { ...onlyRequired(role), propertyType: "Plot", furnishing: "", bhk: "3", floor: "Top", totalFloors: "0" };
    const result = schema.safeParse(plot);
    expect(result.success).toBe(true);
    for (const field of ["bhk", "floor", "totalFloors", "furnishing"]) expect(result.data).not.toHaveProperty(field);
  });

  it("reports a missing furnishing alongside other problems", () => {
    const result = schema.safeParse({ ...onlyRequired(role), furnishing: "", price: "" });
    const fields = result.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["furnishing", "price"]));
  });

  it("uses the shared minimum lengths for the fields it requires", () => {
    for (const [field, min] of Object.entries(TEXT_MINIMUMS)) {
      if (!REQUIRED_FIELDS[role].includes(field)) continue;
      const tooShort = { ...onlyRequired(role), [field]: "x".repeat(min - 1) };
      expect(schema.safeParse(tooShort).success, `${field} under ${min}`).toBe(false);
    }
  });
});
