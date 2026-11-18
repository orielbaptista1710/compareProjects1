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

  it("says a new listing was sent for review", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Submitted for review. We'll check it before it goes live.")
    );
  });

  it("says a retried listing was already submitted, not that a new one was (FORM-11)", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValue({ data: { replayed: true, property: { _id: "p1" } } });
    const onSaved = vi.fn();

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS, { onSaved }), { wrapper });
    act(() => result.current.addProperty({ title: "x", submissionId: "id-1" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("This listing was already submitted."));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("warns that an edited live listing is hidden until it's approved", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.put.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.updateProperty({ id: "p1", data: { title: "x" }, wasLive: true }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Changes saved. This listing is hidden until our team approves them."
      )
    );
    // wasLive is for the message only, never sent to the API
    expect(API.put).toHaveBeenCalledWith("/api/customers/listings/p1", { title: "x" });
  });

  it("just says sent for review when the edited listing wasn't live", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.put.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.updateProperty({ id: "p1", data: { title: "x" }, wasLive: false }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Changes saved and sent for review."));
  });

  it("shows the server's reason for a 403 instead of the generic text", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockRejectedValue({ response: { status: 403, data: { message: "Verify your email to post a property." } } });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Verify your email to post a property."));
  });

  it("explains a save refused because the listing changed meanwhile, and reloads the list", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.put.mockRejectedValue({
      response: { status: 409, data: { message: "This listing changed while you were editing it. Reload it and make your changes again." } },
    });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(1));
    act(() => result.current.updateProperty({ id: "p1", data: { title: "x" }, wasLive: false }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/changed while you were editing/)));
    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(2));
  });

  it("says there was nothing to save when the server changed nothing, not that a live listing is hidden", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.put.mockResolvedValue({ data: { _id: "p1", status: "approved", unchanged: true } });
    const onSaved = vi.fn();

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS, { onSaved }), { wrapper });
    act(() => result.current.updateProperty({ id: "p1", data: { title: "x" }, wasLive: true }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("No changes to save."));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("names the field and reason when the server refuses one field", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockRejectedValue({
      response: { status: 400, data: { message: "Invalid fields: price", errors: { price: "Price must be greater than 0" } } },
    });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Price: Price must be greater than 0"));
  });

  it("lists the fields in words when the server refuses several", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockRejectedValue({
      response: {
        status: 400,
        data: { errors: { furnishing: "This field is required", "galleryImages.0.url": "bad link", "galleryImages.1.url": "bad link" } },
      },
    });

    const { result } = renderHook(() => useMyListings(CUSTOMER_LISTING_ENDPOINTS), { wrapper });
    act(() => result.current.addProperty({ title: "x" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Please check: Furnishing, Photos"));
  });
});
