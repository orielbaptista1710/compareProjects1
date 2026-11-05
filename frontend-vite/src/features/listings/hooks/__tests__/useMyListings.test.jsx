// src/features/listings/hooks/__tests__/useMyListings.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../../../../api/api";
import useMyListings, {
  CUSTOMER_LISTING_ENDPOINTS,
  DEVELOPER_LISTING_ENDPOINTS,
} from "../useMyListings";

vi.mock("../../../../api/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => vi.clearAllMocks());

describe("useMyListings", () => {
  it("loads the list from the given endpoints", async () => {
    API.get.mockResolvedValue({ data: [{ _id: "p1" }] });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });

    await waitFor(() => expect(result.current.properties).toEqual([{ _id: "p1" }]));
    expect(API.get).toHaveBeenCalledWith("/api/customers/listings");
  });

  it("refetches the list after a delete", async () => {
    API.get.mockResolvedValueOnce({ data: [{ _id: "p1" }] }).mockResolvedValueOnce({ data: [] });
    API.delete.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useMyListings(DEVELOPER_LISTING_ENDPOINTS), { wrapper });
    await waitFor(() => expect(result.current.properties).toHaveLength(1));

    act(() => result.current.deleteProperty("p1"));

    await waitFor(() => expect(result.current.properties).toEqual([]));
    expect(API.delete).toHaveBeenCalledWith("/api/properties/delete/p1");
  });

  it("calls onSaved after a successful create", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValue({ data: {} });
    const onSaved = vi.fn();

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS, { onSaved }), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(API.post).toHaveBeenCalledWith("/api/customers/listings", { title: "x" });
  });

  it("shows the server's reason for a 403 instead of the generic text", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockRejectedValue({ response: { status: 403, data: { message: "Verify your email to post a property." } } });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Verify your email to post a property."));
  });
});
