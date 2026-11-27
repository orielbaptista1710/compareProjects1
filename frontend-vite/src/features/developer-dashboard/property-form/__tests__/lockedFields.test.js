import { describe, expect, it } from "vitest";
import { lockedFieldsOf } from "../lockedFields";

describe("lockedFieldsOf", () => {
  it("locks every filled-in location field and a saved pin", () => {
    const saved = {
      state: "Maharashtra", city: "Mumbai", locality: "Andheri West", pincode: 400053,
      address: "Flat 4", coordinates: { lat: 19.1, lng: 72.8 },
    };
    expect(lockedFieldsOf(saved).sort()).toEqual(
      ["address", "city", "coordinates", "locality", "pincode", "state"]
    );
  });

  it("leaves a field that was never filled in editable", () => {
    const saved = { state: "Maharashtra", city: "Mumbai", locality: "  ", pincode: "", coordinates: { source: "address" } };
    expect(lockedFieldsOf(saved).sort()).toEqual(["city", "state"]);
  });

  it("locks nothing for an empty listing", () => {
    expect(lockedFieldsOf()).toEqual([]);
  });
});
