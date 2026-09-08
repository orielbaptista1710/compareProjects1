import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { CityProvider, useCity } from "../CityContext";

const wrapper = ({ children }) => (
  <CityProvider>{children}</CityProvider>
);

describe("CityContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("useCity", () => {
    it("throws an error when used outside CityProvider", () => {
      expect(() => {
        renderHook(() => useCity());
      }).toThrow("useCity must be used inside CityProvider");
    });

    it("provides a null city when no city is stored", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      expect(result.current.city).toBeNull();
    });

    it("provides a setCity function", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      expect(typeof result.current.setCity).toBe("function");
    });
  });

  describe("localStorage initialization", () => {
    it("loads the previously selected city from localStorage", () => {
      localStorage.setItem("selectedCity", "Mumbai");

      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      expect(result.current.city).toBe("Mumbai");
    });

    it("loads different valid city values from localStorage", () => {
      localStorage.setItem("selectedCity", "Delhi");

      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      expect(result.current.city).toBe("Delhi");
    });
  });

  describe("updating the city", () => {
    it("updates the city state when setCity is called", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
      });

      expect(result.current.city).toBe("Mumbai");
    });

    it("allows the city to be changed multiple times", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
      });

      expect(result.current.city).toBe("Mumbai");

      act(() => {
        result.current.setCity("Delhi");
      });

      expect(result.current.city).toBe("Delhi");

      act(() => {
        result.current.setCity("Bangalore");
      });

      expect(result.current.city).toBe("Bangalore");
    });
  });

  describe("localStorage persistence", () => {
    it("saves a selected city to localStorage", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
      });

      expect(localStorage.getItem("selectedCity")).toBe("Mumbai");
    });

    it("updates localStorage when the city changes", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
      });

      expect(localStorage.getItem("selectedCity")).toBe("Mumbai");

      act(() => {
        result.current.setCity("Delhi");
      });

      expect(localStorage.getItem("selectedCity")).toBe("Delhi");
    });

    it("persists the latest selected city", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
        result.current.setCity("Pune");
        result.current.setCity("Delhi");
      });

      expect(result.current.city).toBe("Delhi");
      expect(localStorage.getItem("selectedCity")).toBe("Delhi");
    });
  });

  describe("clearing the city", () => {
    it("removes the city from localStorage when set to null", () => {
      localStorage.setItem("selectedCity", "Mumbai");

      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      expect(result.current.city).toBe("Mumbai");

      act(() => {
        result.current.setCity(null);
      });

      expect(result.current.city).toBeNull();
      expect(localStorage.getItem("selectedCity")).toBeNull();
    });

    it("removes the city from localStorage when set to an empty string", () => {
      localStorage.setItem("selectedCity", "Mumbai");

      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("");
      });

      expect(result.current.city).toBe("");
      expect(localStorage.getItem("selectedCity")).toBeNull();
    });

    it("allows a new city to be selected after clearing", () => {
      const { result } = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        result.current.setCity("Mumbai");
      });

      expect(localStorage.getItem("selectedCity")).toBe("Mumbai");

      act(() => {
        result.current.setCity(null);
      });

      expect(localStorage.getItem("selectedCity")).toBeNull();

      act(() => {
        result.current.setCity("Delhi");
      });

      expect(result.current.city).toBe("Delhi");
      expect(localStorage.getItem("selectedCity")).toBe("Delhi");
    });
  });

  describe("application lifecycle behavior", () => {
    it("restores the saved city when the provider is mounted again", () => {
      const firstRender = renderHook(() => useCity(), {
        wrapper,
      });

      act(() => {
        firstRender.result.current.setCity("Mumbai");
      });

      expect(localStorage.getItem("selectedCity")).toBe("Mumbai");

      firstRender.unmount();

      const secondRender = renderHook(() => useCity(), {
        wrapper,
      });

      expect(secondRender.result.current.city).toBe("Mumbai");
    });
  });
});