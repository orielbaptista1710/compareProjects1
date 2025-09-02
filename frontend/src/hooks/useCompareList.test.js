import { renderHook, act } from "@testing-library/react";
import { toast } from "react-toastify";
import useCompareList from "./useCompareList";

// Mock toast so it doesn’t actually show popups
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("useCompareList hook", () => {
  test("initializes with empty array if nothing in localStorage", () => {
    const { result } = renderHook(() => useCompareList());
    expect(result.current.compareList).toEqual([]);
  });

  test("loads saved compareList from localStorage", () => {
    localStorage.setItem("compareList", JSON.stringify([{ _id: "1" }]));
    const { result } = renderHook(() => useCompareList());
    expect(result.current.compareList).toEqual([{ _id: "1" }]);
  });

  test("adds a property", () => {
    const { result } = renderHook(() => useCompareList());
    act(() => result.current.addToCompare({ _id: "1", name: "Flat A" }));

    expect(result.current.compareList).toHaveLength(1);
    expect(result.current.compareList[0]._id).toBe("1");
    expect(toast.success).toHaveBeenCalledWith("Property added to compare list!");
  });

  test("prevents duplicate properties", () => {
    const { result } = renderHook(() => useCompareList());
    act(() => result.current.addToCompare({ _id: "1" }));
    act(() => result.current.addToCompare({ _id: "1" }));

    expect(result.current.compareList).toHaveLength(1);
  });

  test("prevents adding more than 4 properties", () => {
    const { result } = renderHook(() => useCompareList());
    for (let i = 1; i <= 5; i++) {
      act(() => result.current.addToCompare({ _id: `${i}` }));
    }
    expect(result.current.compareList).toHaveLength(4);
    expect(toast.error).toHaveBeenCalledWith("You can only compare up to 4 properties.");
  });

  test("removes a property", () => {
    const { result } = renderHook(() => useCompareList());
    act(() => result.current.addToCompare({ _id: "1" }));
    act(() => result.current.removeFromCompare("1"));

    expect(result.current.compareList).toEqual([]);
    expect(toast.info).toHaveBeenCalledWith("Property removed from compare list.");
  });
});
