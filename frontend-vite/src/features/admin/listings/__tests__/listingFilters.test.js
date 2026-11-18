import { describe, it, expect } from "vitest";
import {
  DEFAULT_LISTING_FILTERS,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  defaultSortFor,
  readFiltersFromParams,
} from "../listingFilters";
import { PROPERTY_TYPES as FORM_PROPERTY_TYPES } from "../../../../assests/constants/propertyFormConstants";

const params = (query) => new URLSearchParams(query);

describe("default sort order", () => {
  it("is oldest-waiting-first for the review queue and newest-first for everything else", () => {
    expect(defaultSortFor("pending")).toBe("waiting");
    for (const status of ["approved", "rejected", "suspended", ""]) {
      expect(defaultSortFor(status)).toBe("latest");
    }
  });

  it("starts the dashboard on the pending queue in that order", () => {
    expect(DEFAULT_LISTING_FILTERS).toMatchObject({ status: "pending", sortBy: "waiting" });
  });

  it("offers 'Oldest waiting first' as a choice", () => {
    expect(SORT_OPTIONS[0]).toEqual({ value: "waiting", label: "Oldest waiting first" });
  });
});

describe("readFiltersFromParams — sort", () => {
  it("defaults the sort to the one for the status in the link", () => {
    expect(readFiltersFromParams(params("")).sortBy).toBe("waiting");
    expect(readFiltersFromParams(params("status=approved")).sortBy).toBe("latest");
    expect(readFiltersFromParams(params("status=all")).sortBy).toBe("latest");
  });

  it("keeps a sort chosen in the link, whatever the status", () => {
    expect(readFiltersFromParams(params("status=approved&sortBy=waiting")).sortBy).toBe("waiting");
    expect(readFiltersFromParams(params("sortBy=priceLow")).sortBy).toBe("priceLow");
  });

  it("falls back to the status's default for a sort it doesn't know", () => {
    expect(readFiltersFromParams(params("sortBy=nope")).sortBy).toBe("waiting");
    expect(readFiltersFromParams(params("status=rejected&sortBy=nope")).sortBy).toBe("latest");
  });
});

describe("property types", () => {
  it("are the same eight the listing form offers, so the admin filter can't drift from what posters can pick", () => {
    expect([...PROPERTY_TYPES].sort()).toEqual(FORM_PROPERTY_TYPES.map((t) => t.label).sort());
  });
});
