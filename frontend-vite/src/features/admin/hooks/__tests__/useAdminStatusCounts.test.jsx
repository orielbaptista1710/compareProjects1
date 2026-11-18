import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import API from "../../../../api/api";
import useAdminStatusCounts, { ADMIN_COUNTS_KEY } from "../useAdminStatusCounts";

vi.mock("../../../../api/api", () => ({ default: { get: vi.fn() } }));

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useAdminStatusCounts(), { wrapper }) };
};

beforeEach(() => vi.clearAllMocks());

describe("useAdminStatusCounts", () => {
  it("loads the per-status counts", async () => {
    API.get.mockResolvedValue({ data: { pending: 4, approved: 9, rejected: 1, suspended: 0, pendingEdited: 1 } });

    const { result } = setup();

    await waitFor(() => expect(result.current.data?.pending).toBe(4));
    expect(API.get).toHaveBeenCalledWith("/api/admin/properties/counts");
  });

  it("polls once a minute, only while the tab is visible, and refetches when the window regains focus", async () => {
    API.get.mockResolvedValue({ data: { pending: 0 } });
    const { client, result } = setup();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const options = client.getQueryCache().find({ queryKey: ADMIN_COUNTS_KEY }).options;

    expect(options.refetchInterval).toBe(60_000);
    expect(options.refetchIntervalInBackground).toBe(false);
    expect(options.refetchOnWindowFocus).toBe(true);
  });

  it("keeps quiet when a poll fails (no throw, no retry storm)", async () => {
    API.get.mockRejectedValue(new Error("network"));

    const { result } = setup();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(API.get).toHaveBeenCalledTimes(1);
  });
});
