import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useProperty } from "../useProperty";

function createWrapper() {
  // Each test gets its own QueryClient.
  //
  // This is important because React Query caches data.
  // Sharing one client between tests can cause one test's
  // property data to affect another test.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests.
        //
        // Production retries may be useful, but retries make
        // failure tests slower and less predictable.
        retry: false,
      },
    },
  });

  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

afterEach(() => {
  // Restore mocked globals such as fetch after every test.
  //
  // This prevents one test's mock from leaking into another test.
  vi.restoreAllMocks();
});

describe("useProperty", () => {
  it("returns the initial loading state and then the fetched property", async () => {
    const property = {
      _id: "property-123",
      title: "Apartment in Mumbai",
    };

    // Mock the browser fetch API.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(property),
      })
    );

    const { result } = renderHook(() => useProperty("property-123"), {
      wrapper: createWrapper(),
    });

    // Initially, React Query should be loading.
    expect(result.current.loading).toBe(true);
    expect(result.current.property).toBeNull();

    // Wait until the asynchronous query finishes.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify the hook exposes the API result correctly.
    expect(result.current.property).toEqual(property);
    expect(result.current.error).toBeUndefined();
  });

  it("calls the property API with the provided property ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        _id: "property-123",
        title: "Test Property",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProperty("property-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // This verifies the correct API endpoint is requested.
    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/properties/property-123`
    );
  });

  it("returns the expected error when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const { result } = renderHook(() => useProperty("property-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to load property");
    });

    expect(result.current.property).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("does not make a request when the property ID is missing", () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProperty(null), {
      wrapper: createWrapper(),
    });

    // enabled: Boolean(id) should prevent React Query
    // from running the request.
    expect(fetchMock).not.toHaveBeenCalled();

    expect(result.current.property).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Invalid property ID");
  });

  it("fetches a new property when the property ID changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          _id: "property-1",
          title: "First Property",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          _id: "property-2",
          title: "Second Property",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ id }) => useProperty(id),
      {
        initialProps: { id: "property-1" },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.property?._id).toBe("property-1");
    });

    // Simulate navigating to another property.
    rerender({ id: "property-2" });

    await waitFor(() => {
      expect(result.current.property?._id).toBe("property-2");
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("handles network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const { result } = renderHook(() => useProperty("property-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.property).toBeNull();
    expect(result.current.error).toBe("Network error");
  });
});