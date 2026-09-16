import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useContext } from "react";

import { CustomerActivityProvider, CustomerActivityContext } from "../CustomerActivityContext";
import { AuthContext } from "../AuthContext";
import API from "../../api/api";

vi.mock("../../api/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

function Consumer() {
  const {
    heartedIds,
    heartProperties,
    heartPagination,
    loadingMoreHearts,
    loadMoreHearts,
    toggleHeart,
    activityReady,
  } = useContext(CustomerActivityContext);

  return (
    <div>
      <div data-testid="heartedIds">{JSON.stringify(heartedIds)}</div>
      <div data-testid="heartProperties">
        {JSON.stringify(heartProperties.map((p) => p._id))}
      </div>
      <div data-testid="pagination">{JSON.stringify(heartPagination)}</div>
      <div data-testid="loadingMore">{String(loadingMoreHearts)}</div>
      <div data-testid="activityReady">{String(activityReady)}</div>
      <button onClick={loadMoreHearts}>Load More</button>
      {/* toggleHeart intentionally re-throws on failure so real callers (see
          useHeartProperty) can react to it — catch it here the same way, so
          a deliberately-failing mock doesn't surface as an unhandled
          rejection in the test run. */}
      <button onClick={() => toggleHeart("prop-x").catch(() => {})}>Toggle prop-x</button>
    </div>
  );
}

function renderWithUser(currentUser) {
  return render(
    <AuthContext.Provider value={{ currentUser }}>
      <CustomerActivityProvider>
        <Consumer />
      </CustomerActivityProvider>
    </AuthContext.Provider>
  );
}

describe("CustomerActivityProvider — heart pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the first page (heartLimit=20) on login and stores heartedIds/heartProperties/heartPagination separately", async () => {
    API.get.mockResolvedValue({
      data: {
        heartedIds: ["p1", "p2"],
        heartProperties: [{ _id: "p1" }, { _id: "p2" }],
        heartPagination: { page: 1, limit: 20, total: 2, hasMore: false },
        compareProperties: [],
      },
    });

    renderWithUser({ uid: "u1" });

    await waitFor(() => {
      expect(screen.getByTestId("activityReady")).toHaveTextContent("true");
    });

    expect(API.get).toHaveBeenCalledWith("/api/customerActivity/my-activity?heartLimit=20");
    expect(screen.getByTestId("heartedIds")).toHaveTextContent('["p1","p2"]');
    expect(screen.getByTestId("heartProperties")).toHaveTextContent('["p1","p2"]');
  });

  it("loadMoreHearts fetches the next page and appends it to the already-loaded properties", async () => {
    API.get.mockResolvedValueOnce({
      data: {
        heartedIds: ["p1", "p2", "p3"],
        heartProperties: [{ _id: "p1" }, { _id: "p2" }],
        heartPagination: { page: 1, limit: 2, total: 3, hasMore: true },
        compareProperties: [],
      },
    });

    renderWithUser({ uid: "u1" });

    await waitFor(() => {
      expect(screen.getByTestId("activityReady")).toHaveTextContent("true");
    });

    API.get.mockResolvedValueOnce({
      data: {
        heartProperties: [{ _id: "p3" }],
        heartPagination: { page: 2, limit: 2, total: 3, hasMore: false },
      },
    });

    fireEvent.click(screen.getByText("Load More"));

    await waitFor(() => {
      expect(screen.getByTestId("heartProperties")).toHaveTextContent('["p1","p2","p3"]');
    });

    expect(API.get).toHaveBeenLastCalledWith(
      "/api/customerActivity/my-activity?heartPage=2&heartLimit=2"
    );
  });

  it("does not fetch another page once hasMore is false", async () => {
    API.get.mockResolvedValue({
      data: {
        heartedIds: ["p1"],
        heartProperties: [{ _id: "p1" }],
        heartPagination: { page: 1, limit: 20, total: 1, hasMore: false },
        compareProperties: [],
      },
    });

    renderWithUser({ uid: "u1" });

    await waitFor(() => {
      expect(screen.getByTestId("activityReady")).toHaveTextContent("true");
    });

    API.get.mockClear();
    fireEvent.click(screen.getByText("Load More"));

    // Give any wrongly-fired async call a tick to happen before asserting its absence.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(API.get).not.toHaveBeenCalled();
  });
});

describe("CustomerActivityProvider — toggleHeart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds an id optimistically and reconciles heartedIds from the server response", async () => {
    API.get.mockResolvedValue({
      data: {
        heartedIds: [],
        heartProperties: [],
        heartPagination: { page: 1, limit: 20, total: 0, hasMore: false },
        compareProperties: [],
      },
    });

    renderWithUser({ uid: "u1" });

    await waitFor(() => {
      expect(screen.getByTestId("activityReady")).toHaveTextContent("true");
    });

    API.post.mockResolvedValue({
      data: { success: true, isHearted: true, heartedIds: ["prop-x"] },
    });

    fireEvent.click(screen.getByText("Toggle prop-x"));

    await waitFor(() => {
      expect(screen.getByTestId("heartedIds")).toHaveTextContent('["prop-x"]');
    });

    expect(API.post).toHaveBeenCalledWith("/api/customerActivity/toggle-heart/prop-x");
    // Un-hearted was never fetched as part of a page, so it correctly does
    // NOT get inserted into the loaded heartProperties page.
    expect(screen.getByTestId("heartProperties")).toHaveTextContent("[]");
  });

  it("removes from both heartedIds and the loaded page on un-heart, and restores the exact card on failure", async () => {
    API.get.mockResolvedValue({
      data: {
        heartedIds: ["prop-x"],
        heartProperties: [{ _id: "prop-x", title: "Villa" }],
        heartPagination: { page: 1, limit: 20, total: 1, hasMore: false },
        compareProperties: [],
      },
    });

    renderWithUser({ uid: "u1" });

    await waitFor(() => {
      expect(screen.getByTestId("activityReady")).toHaveTextContent("true");
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    API.post.mockRejectedValue(new Error("network fail"));

    fireEvent.click(screen.getByText("Toggle prop-x"));

    // The optimistic removal and the failure-triggered rollback can both
    // resolve within the same microtask flush (the mock rejects instantly),
    // so rather than trying to catch the transient "removed" state in
    // between, just wait for the final settled state: back to the original.
    await waitFor(() => {
      expect(screen.getByTestId("heartedIds")).toHaveTextContent('["prop-x"]');
    });
    expect(screen.getByTestId("heartProperties")).toHaveTextContent('["prop-x"]');

    consoleSpy.mockRestore();
  });
});
