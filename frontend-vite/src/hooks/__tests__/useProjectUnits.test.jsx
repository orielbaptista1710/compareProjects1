import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useProjectUnits } from "../useProjectUnits";
import API from "../../api/api";

vi.mock("../../api/api", () => ({
  default: { get: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  API.get.mockReset();
});

describe("useProjectUnits", () => {
  it("returns the sibling units once the request resolves", async () => {
    const units = [
      { _id: "u1", bhk: 3, price: 50_500_000 },
      { _id: "u2", bhk: 4, price: 96_300_000 },
    ];
    API.get.mockResolvedValue({ data: { units } });

    const { result } = renderHook(() => useProjectUnits("property-123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.units).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.units).toEqual(units);
    expect(API.get).toHaveBeenCalledWith("/api/properties/project-units/property-123");
  });

  it("does not make a request when the id is missing", () => {
    renderHook(() => useProjectUnits(null), { wrapper: createWrapper() });
    expect(API.get).not.toHaveBeenCalled();
  });

  it("defaults to an empty array when the response has no units (ungrouped listing)", async () => {
    API.get.mockResolvedValue({ data: { units: [] } });

    const { result } = renderHook(() => useProjectUnits("property-456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.units).toEqual([]);
  });
});
