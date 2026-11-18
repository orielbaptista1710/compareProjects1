import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Control what useMyListings reports and capture its onSaved callback
const listings = vi.hoisted(() => ({
  addProperty: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
  properties: [],
  options: null,
}));

vi.mock("../useMyListings", () => ({
  default: (endpoints, options) => {
    listings.options = options;
    return {
      properties: listings.properties,
      isLoading: false,
      isError: false,
      addProperty: listings.addProperty,
      isAdding: false,
      updateProperty: listings.updateProperty,
      isUpdating: false,
      deleteProperty: listings.deleteProperty,
    };
  },
}));

import toast from "react-hot-toast";
import useListingsWorkspace from "../useListingsWorkspace";
import { LISTED_BY } from "../../../../constants/roles";
import { initialFormData } from "../../../developer-dashboard/utils/developerDashPropertyHelpers";

const ENDPOINTS = { queryKey: ["x"] };

// Has everything a developer must give, so missing-field checks can remove one
const FULL = {
  developerName: "Lodha", title: "A title", description: "A description that is long enough",
  state: "MH", city: "Thane", locality: "Dombivli", address: "Somewhere 1",
  pincode: "421204", propertyType: "Villa", furnishing: "Unfurnished",
  possessionStatus: "Ready to Move", price: 100, unitsAvailable: 2,
};

describe("useListingsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listings.properties = [];
  });

  it("creates a listing when nothing is being edited", () => {
    const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
    const onSuccess = vi.fn();

    act(() => result.current.handleSubmit(FULL, { onSuccess }));

    expect(listings.addProperty).toHaveBeenCalledWith(FULL, { onSuccess });
    expect(listings.updateProperty).not.toHaveBeenCalled();
  });

  it("updates the listing being edited and tells the dashboard to show the form", () => {
    const onEdit = vi.fn();
    const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS, onEdit }));

    act(() => result.current.handleEdit({ _id: "p1", title: "Saved title" }));
    expect(result.current.editingId).toBe("p1");
    expect(result.current.formData.title).toBe("Saved title");
    expect(onEdit).toHaveBeenCalledTimes(1);

    act(() => result.current.handleSubmit(FULL));
    expect(listings.updateProperty).toHaveBeenCalledWith(
      { id: "p1", data: FULL, wasLive: false },
      { onSuccess: undefined }
    );
    expect(listings.addProperty).not.toHaveBeenCalled();
  });

  it("developers must fill developer name; owners don't", () => {
    const withoutDeveloper = { ...FULL, developerName: "" };

    const dev = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
    act(() => dev.result.current.handleSubmit(withoutDeveloper));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("developerName"));
    expect(listings.addProperty).not.toHaveBeenCalled();

    const owner = renderHook(() =>
      useListingsWorkspace({ endpoints: ENDPOINTS, role: LISTED_BY.OWNER })
    );
    act(() => owner.result.current.handleSubmit(withoutDeveloper));
    expect(listings.addProperty).toHaveBeenCalledTimes(1);
  });

  it("resets the form and calls onSaved after a successful save", () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS, onSaved }));
    act(() => result.current.handleEdit({ _id: "p1", title: "Saved title" }));

    act(() => listings.options.onSaved());

    expect(result.current.editingId).toBeNull();
    expect(result.current.formData).toEqual(initialFormData);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("keeps the same handlers between renders, so memoised cards can skip re-rendering", () => {
    // Inline arrows: a new function on every render, like a dashboard passes
    const { result, rerender } = renderHook(() =>
      useListingsWorkspace({ endpoints: ENDPOINTS, onSaved: () => {}, onEdit: () => {} })
    );
    const first = result.current;

    rerender();

    expect(result.current.handleEdit).toBe(first.handleEdit);
    expect(result.current.handleCancelEdit).toBe(first.handleCancelEdit);
    expect(result.current.handleDelete).toBe(first.handleDelete);
    expect(result.current.handleSubmit).toBe(first.handleSubmit);
  });

  it("still calls the latest onEdit and onSaved after the caller re-renders", () => {
    const firstOnEdit = vi.fn();
    const latestOnEdit = vi.fn();
    const latestOnSaved = vi.fn();
    const { result, rerender } = renderHook(
      ({ onEdit, onSaved }) => useListingsWorkspace({ endpoints: ENDPOINTS, onEdit, onSaved }),
      { initialProps: { onEdit: firstOnEdit, onSaved: undefined } }
    );

    rerender({ onEdit: latestOnEdit, onSaved: latestOnSaved });
    act(() => result.current.handleEdit({ _id: "p1", title: "Saved title" }));
    act(() => listings.options.onSaved());

    expect(firstOnEdit).not.toHaveBeenCalled();
    expect(latestOnEdit).toHaveBeenCalledTimes(1);
    expect(latestOnSaved).toHaveBeenCalledTimes(1);
  });

  it("only the submit handler changes when editing starts (it needs the id)", () => {
    const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
    const before = result.current;

    act(() => result.current.handleEdit({ _id: "p1", title: "Saved title" }));

    expect(result.current.handleSubmit).not.toBe(before.handleSubmit);
    expect(result.current.handleEdit).toBe(before.handleEdit);
    expect(result.current.handleDelete).toBe(before.handleDelete);
  });

  describe("editing, starting new, deleting", () => {
    const LIVE = { _id: "p1", title: "Live flat", status: "approved" };
    const PENDING = { _id: "p2", title: "Waiting flat", status: "pending" };

    it("tells the update whether the listing being edited was live", () => {
      listings.properties = [LIVE, PENDING];
      const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));

      act(() => result.current.handleEdit(LIVE));
      act(() => result.current.handleSubmit(FULL));
      expect(listings.updateProperty).toHaveBeenLastCalledWith(
        { id: "p1", data: FULL, wasLive: true },
        { onSuccess: undefined }
      );

      act(() => result.current.handleEdit(PENDING));
      act(() => result.current.handleSubmit(FULL));
      expect(listings.updateProperty).toHaveBeenLastCalledWith(
        { id: "p2", data: FULL, wasLive: false },
        { onSuccess: undefined }
      );
    });

    it("exposes the status of the listing being edited", () => {
      listings.properties = [LIVE];
      const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
      expect(result.current.editingStatus).toBeUndefined();

      act(() => result.current.handleEdit(LIVE));

      expect(result.current.editingStatus).toBe("approved");
    });

    it("New listing after Edit opens an empty form that creates, not overwrites", () => {
      const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
      act(() => result.current.handleEdit(LIVE));
      expect(result.current.editingId).toBe("p1");

      act(() => result.current.handleStartNew());
      expect(result.current.editingId).toBeNull();
      expect(result.current.formData).toEqual(initialFormData);

      act(() => result.current.handleSubmit(FULL));
      expect(listings.addProperty).toHaveBeenCalledTimes(1);
      expect(listings.updateProperty).not.toHaveBeenCalled();
    });

    it("deleting the listing being edited clears the edit, but only once the server has deleted it", () => {
      const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
      act(() => result.current.handleEdit(LIVE));

      act(() => result.current.handleDelete("p1"));
      // Not deleted yet (or the delete failed): still editing
      expect(result.current.editingId).toBe("p1");

      act(() => listings.deleteProperty.mock.calls[0][1].onSuccess());
      expect(result.current.editingId).toBeNull();
      expect(result.current.formData).toEqual(initialFormData);
    });

    it("deleting a different listing leaves the edit alone", () => {
      const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
      act(() => result.current.handleEdit(LIVE));

      act(() => result.current.handleDelete("p2"));
      act(() => listings.deleteProperty.mock.calls[0][1].onSuccess());

      expect(result.current.editingId).toBe("p1");
    });
  });

  it("cancelling an edit clears the form", () => {
    const { result } = renderHook(() => useListingsWorkspace({ endpoints: ENDPOINTS }));
    act(() => result.current.handleEdit({ _id: "p1", title: "Saved title" }));

    act(() => result.current.handleCancelEdit());

    expect(result.current.editingId).toBeNull();
    expect(result.current.formData).toEqual(initialFormData);
  });
});
