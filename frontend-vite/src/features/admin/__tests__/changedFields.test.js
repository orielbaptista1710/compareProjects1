import { describe, it, expect } from "vitest";
import { describeChangedFields } from "../changedFields";

describe("describeChangedFields", () => {
  it("turns field names into the words a reviewer reads", () => {
    expect(describeChangedFields(["price", "long_description", "reraDate"]).map((f) => f.label)).toEqual([
      "Price",
      "Detailed description",
      "Completion date",
    ]);
  });

  it("puts what a reviewer should check first (price, title, address…) before the rest, keeping the order sent", () => {
    const labels = describeChangedFields(["amenities", "price", "furnishing", "title"]).map((f) => f.label);

    expect(labels).toEqual(["Price", "Title", "Amenities", "Furnishing"]);
  });

  it("marks the priority ones", () => {
    const byKey = Object.fromEntries(describeChangedFields(["price", "amenities"]).map((f) => [f.key, f.priority]));

    expect(byKey).toEqual({ price: true, amenities: false });
  });

  it("shows an unknown field by its raw name instead of dropping it", () => {
    expect(describeChangedFields(["somethingNew"])[0].label).toBe("somethingNew");
  });

  it("ignores duplicates and anything that isn't a string, and copes with nothing at all", () => {
    expect(describeChangedFields(["price", "price", 3, null, {}]).map((f) => f.key)).toEqual(["price"]);
    expect(describeChangedFields(undefined)).toEqual([]);
    expect(describeChangedFields("price")).toEqual([]);
  });
});
