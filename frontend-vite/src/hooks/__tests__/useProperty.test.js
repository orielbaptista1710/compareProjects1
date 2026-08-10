// frontend-vite/src/hooks/__tests__/useProperty.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProperty } from "../useProperty";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  import.meta.env.VITE_API_BASE_URL = "http://localhost:5000";
});

describe("useProperty", () => {
  it("starts in a loading state", () => {
    fetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useProperty("p1"));
    expect(result.current.loading).toBe(true);
    expect(result.current.property).toBeNull();
  });

  it("sets property and clears loading on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ _id: "p1", title: "2BHK in Andheri" }),
    });

    const { result } = renderHook(() => useProperty("p1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.property).toEqual({
      _id: "p1",
      title: "2BHK in Andheri",
    });
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith("http://localhost:5000/api/properties/p1");
  });

  it("sets an error when the response is not ok", async () => {
    fetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useProperty("p1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load property");
    expect(result.current.property).toBeNull();
  });

  it("sets an error when fetch itself rejects (network failure)", async () => {
    fetch.mockRejectedValue(new Error("Network request failed"));

    const { result } = renderHook(() => useProperty("p1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network request failed");
  });

  it("short-circuits with an error and no fetch call when id is missing", () => {
    const { result } = renderHook(() => useProperty(undefined));

    expect(result.current.error).toBe("Invalid property ID");
    expect(result.current.loading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores a stale response if the id changes before the fetch resolves", async () => {
    let resolveFirst;
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: "p2", title: "Second property" }),
    });

    const { result, rerender } = renderHook(({ id }) => useProperty(id), {
      initialProps: { id: "p1" },
    });

    rerender({ id: "p2" });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.property._id).toBe("p2");

    // Now resolve the *first* (stale) request late — it must not clobber
    // the already-settled p2 state.
    resolveFirst({ ok: true, json: async () => ({ _id: "p1", title: "Stale" }) });
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current.property._id).toBe("p2");
  });

  it("does not update state after unmount (no React act warning / memory leak)", async () => {
    let resolveFetch;
    fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { unmount } = renderHook(() => useProperty("p1"));
    unmount();

    // Resolving after unmount should be a no-op, not a React warning/crash.
    expect(() => {
      resolveFetch({ ok: true, json: async () => ({ _id: "p1" }) });
    }).not.toThrow();
  });
});