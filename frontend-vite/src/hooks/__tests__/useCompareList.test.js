import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useCompareList from "../useCompareList";

describe("useCompareList", () => {
  // Clear persisted state before every test.
  //
  // This is important because localStorage survives between tests.
  // Without this, one test could accidentally affect another test.
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    // Restore spies/mocks so they don't leak into other tests.
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("starts with an empty compare list when nothing is stored", () => {
      const { result } = renderHook(() => useCompareList());

      expect(result.current.compareList).toEqual([]);
    });

    it("loads an existing compare list from localStorage", () => {
      const savedProperties = [
        {
          _id: "property-1",
          title: "Apartment in Mumbai",
        },
        {
          _id: "property-2",
          title: "Villa in Pune",
        },
      ];

      localStorage.setItem(
        "compareList",
        JSON.stringify(savedProperties)
      );

      const { result } = renderHook(() => useCompareList());

      expect(result.current.compareList).toEqual(savedProperties);
    });

    it("returns an empty list when localStorage contains invalid JSON", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Simulate corrupted or manually altered localStorage data.
      localStorage.setItem("compareList", "not-valid-json");

      const { result } = renderHook(() => useCompareList());

      expect(result.current.compareList).toEqual([]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to parse compare list:",
        expect.any(Error)
      );
    });
  });

  describe("addToCompare", () => {
    it("adds a property and returns added", () => {
      const property = {
        _id: "property-1",
        title: "Apartment in Mumbai",
      };

      const { result } = renderHook(() => useCompareList());

      let status;

      act(() => {
        status = result.current.addToCompare(property);
      });

      expect(status).toBe("added");

      expect(result.current.compareList).toEqual([
        property,
      ]);
    });

    it("does not add the same property twice", () => {
      const property = {
        _id: "property-1",
        title: "Apartment in Mumbai",
      };

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property);
      });

      let status;

      act(() => {
        status = result.current.addToCompare(property);
      });

      expect(status).toBe("duplicate");

      expect(result.current.compareList).toEqual([
        property,
      ]);
    });

    it("enforces a maximum compare list size of four properties", () => {
      const properties = [
        { _id: "property-1", title: "Property 1" },
        { _id: "property-2", title: "Property 2" },
        { _id: "property-3", title: "Property 3" },
        { _id: "property-4", title: "Property 4" },
      ];

      const fifthProperty = {
        _id: "property-5",
        title: "Property 5",
      };

      const { result } = renderHook(() => useCompareList());

      properties.forEach((property) => {
        act(() => {
          result.current.addToCompare(property);
        });
      });

      let status;

      act(() => {
        status = result.current.addToCompare(fifthProperty);
      });

      expect(status).toBe("limit");

      expect(result.current.compareList).toHaveLength(4);

      expect(result.current.compareList).toEqual(properties);
    });

    it("allows four different properties to be added successfully", () => {
      const properties = [
        { _id: "property-1" },
        { _id: "property-2" },
        { _id: "property-3" },
        { _id: "property-4" },
      ];

      const { result } = renderHook(() => useCompareList());

      properties.forEach((property) => {
        let status;

        act(() => {
          status = result.current.addToCompare(property);
        });

        expect(status).toBe("added");
      });

      expect(result.current.compareList).toHaveLength(4);
    });
  });

  describe("removeFromCompare", () => {
    it("removes the property with the matching ID", () => {
      const firstProperty = {
        _id: "property-1",
        title: "Apartment",
      };

      const secondProperty = {
        _id: "property-2",
        title: "Villa",
      };

      localStorage.setItem(
        "compareList",
        JSON.stringify([
          firstProperty,
          secondProperty,
        ])
      );

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.removeFromCompare("property-1");
      });

      expect(result.current.compareList).toEqual([
        secondProperty,
      ]);
    });

    it("does not change the list when the property ID does not exist", () => {
      const property = {
        _id: "property-1",
        title: "Apartment",
      };

      localStorage.setItem(
        "compareList",
        JSON.stringify([property])
      );

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.removeFromCompare("non-existent-id");
      });

      expect(result.current.compareList).toEqual([
        property,
      ]);
    });
  });

  describe("localStorage persistence", () => {
    it("saves the updated compare list to localStorage", async () => {
      const property = {
        _id: "property-1",
        title: "Apartment in Mumbai",
      };

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.addToCompare(property);
      });

      // useEffect performs persistence after React processes
      // the state update, so wait for the persisted value.
      await waitFor(() => {
        expect(
          JSON.parse(localStorage.getItem("compareList"))
        ).toEqual([property]);
      });
    });

    it("updates localStorage after a property is removed", async () => {
      const firstProperty = {
        _id: "property-1",
      };

      const secondProperty = {
        _id: "property-2",
      };

      localStorage.setItem(
        "compareList",
        JSON.stringify([
          firstProperty,
          secondProperty,
        ])
      );

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.removeFromCompare("property-1");
      });

      await waitFor(() => {
        expect(
          JSON.parse(localStorage.getItem("compareList"))
        ).toEqual([secondProperty]);
      });
    });

    it("does not crash when saving to localStorage fails", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });

      const property = {
        _id: "property-1",
      };

      const { result } = renderHook(() => useCompareList());

      expect(() => {
        act(() => {
          result.current.addToCompare(property);
        });
      }).not.toThrow();

      expect(setItemSpy).toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save compare list:",
        expect.any(Error)
      );
    });
  });

  describe("setCompareList", () => {
    it("allows the compare list to be replaced directly", () => {
      const properties = [
        { _id: "property-1" },
        { _id: "property-2" },
      ];

      const { result } = renderHook(() => useCompareList());

      act(() => {
        result.current.setCompareList(properties);
      });

      expect(result.current.compareList).toEqual(
        properties
      );
    });
  });
});