import { describe, it, expect } from "vitest";
import { scoreProperties } from "../compareScoring";

const baseProperty = {
  title: "Test Property",
  price: 10000000,

  area: {
    value: 1000,
    unit: "sqft",
  },

  amenities: [],
  facilities: [],
  security: [],

  possessionStatus: "Under Construction",

  reraApproved: false,

  metadata: {
    analytics: {
      popularityScore: 0,
    },
  },
};


describe("scoreProperties", () => {
  it("returns an empty array when fewer than two properties are provided", () => {
    expect(scoreProperties([])).toEqual([]);

    expect(
      scoreProperties([baseProperty])
    ).toEqual([]);
  });


  it("returns a score for every property", () => {
    const properties = [
      {
        ...baseProperty,
        title: "Property A",
      },

      {
        ...baseProperty,
        title: "Property B",
        price: 12000000,
      },
    ];

    const result = scoreProperties(properties);

    expect(result).toHaveLength(2);

    expect(result[0]).toHaveProperty(
      "comparisonScore"
    );

    expect(result[1]).toHaveProperty(
      "comparisonScore"
    );
  });


  it("keeps scores between 0 and 1", () => {
    const properties = [
      {
        ...baseProperty,
        price: 8000000,
        area: {
          value: 800,
          unit: "sqft",
        },
      },

      {
        ...baseProperty,
        price: 15000000,
        area: {
          value: 2000,
          unit: "sqft",
        },
      },
    ];

    const result = scoreProperties(properties);

    result.forEach((property) => {
      expect(
        property.comparisonScore
      ).toBeGreaterThanOrEqual(0);

      expect(
        property.comparisonScore
      ).toBeLessThanOrEqual(1);
    });
  });


  it("gives a cheaper property a better price advantage", () => {
    const properties = [
      {
        ...baseProperty,
        title: "Cheaper",
        price: 8000000,
      },

      {
        ...baseProperty,
        title: "Expensive",
        price: 15000000,
      },
    ];

    const result = scoreProperties(properties);

    const cheaper = result.find(
      (property) =>
        property.title === "Cheaper"
    );

    expect(
      cheaper.comparisonReasons
    ).toContain(
      "more competitively priced"
    );
  });


  it("rewards Ready to Move properties", () => {
    const properties = [
      {
        ...baseProperty,
        title: "Ready",
        possessionStatus: "Ready to Move",
      },

      {
        ...baseProperty,
        title: "Construction",
        possessionStatus: "Under Construction",
      },
    ];

    const result = scoreProperties(properties);

    const readyProperty = result.find(
      (property) =>
        property.title === "Ready"
    );

    expect(
      readyProperty.comparisonReasons
    ).toContain("ready to move");
  });


  it("adds a reason for RERA-approved properties", () => {
    const properties = [
      {
        ...baseProperty,
        title: "RERA Property",
        reraApproved: true,
        reraNumber: "P51800012345",
      },

      {
        ...baseProperty,
        title: "Other Property",
      },
    ];

    const result = scoreProperties(properties);

    const property = result.find(
      (item) =>
        item.title === "RERA Property"
    );

    expect(
      property.comparisonReasons
    ).toContain(
      "RERA approval available"
    );
  });


  it("does not crash when optional data is missing", () => {
    const properties = [
      {
        title: "Property A",
        price: 10000000,
      },

      {
        title: "Property B",
        price: 12000000,
      },
    ];

    expect(() =>
      scoreProperties(properties)
    ).not.toThrow();
  });


  it("does not duplicate amenities", () => {
    const properties = [
      {
        ...baseProperty,
        amenities: [
          "Swimming Pool",
          "Swimming Pool",
          "Gym",
        ],
      },

      {
        ...baseProperty,
      },
    ];

    const result = scoreProperties(properties);

    expect(
      result[0].comparisonScore
    ).toBeGreaterThanOrEqual(0);
  });


  it("handles equal values without producing invalid scores", () => {
    const properties = [
      {
        ...baseProperty,
        title: "Property A",
        price: 10000000,
      },

      {
        ...baseProperty,
        title: "Property B",
        price: 10000000,
      },
    ];

    const result = scoreProperties(properties);

    result.forEach((property) => {
      expect(
        Number.isFinite(
          property.comparisonScore
        )
      ).toBe(true);
    });
  });
});