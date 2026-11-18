// src/features/listings/hooks/useMyListings.js
//
// "My listings" data + mutations, shared by every posting dashboard:
// the developer dashboard (DEVELOPER_LISTING_ENDPOINTS, JWT cookie) and the
// customer profile's owner/agent listings (CUSTOMER_LISTING_ENDPOINTS, Firebase
// token). api.js picks the right credential from the URL, so the hook doesn't
// care which kind of account is logged in.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../../../api/api";
import toastError from "../../../utils/toastError";
import { fieldLabel } from "../../admin/changedFields";

export const DEVELOPER_LISTING_ENDPOINTS = {
  queryKey: ["my-properties"],
  list: "/api/properties/my-properties",
  create: "/api/properties/add",
  update: (id) => `/api/properties/update/${id}`,
  remove: (id) => `/api/properties/delete/${id}`,
};

// Must stay under /api/customers/ — api.js only attaches the Firebase token to
// URLs outside /api/properties/, /api/auth/ and /api/admin/.
export const CUSTOMER_LISTING_ENDPOINTS = {
  queryKey: ["my-customer-listings"],
  list: "/api/customers/listings",
  create: "/api/customers/listings",
  update: (id) => `/api/customers/listings/${id}`,
  remove: (id) => `/api/customers/listings/${id}`,
};

// The listing routes answer 403/409/429 with a specific reason ("Verify your
// email to post", "this listing changed while you were editing it", "pending
// listing limit reached"); show it instead of toastError's generic text.
const showListingError = (err, fallback) => {
  const status = err.response?.status;
  const serverMsg = err.response?.data?.message;
  if ([403, 409, 429].includes(status) && serverMsg) return toast.error(serverMsg);
  // 400 with { field: reason }: name the fields in words. The form also marks
  // each one (SellPropertyForm, via the submit's onError).
  const fieldErrors = status === 400 ? err.response?.data?.errors : null;
  if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length) {
    return toast.error(fieldErrorNote(fieldErrors));
  }
  return toastError(err, fallback);
};

export const fieldErrorNote = (fieldErrors) => {
  const entries = Object.entries(fieldErrors);
  if (entries.length === 1) {
    const [[path, reason]] = entries;
    return `${fieldLabel(path)}: ${reason}`;
  }
  const labels = [...new Set(entries.map(([path]) => fieldLabel(path)))];
  return `Please check: ${labels.join(", ")}`;
};

/**
 * @param {object}   endpoints  DEVELOPER_LISTING_ENDPOINTS or CUSTOMER_LISTING_ENDPOINTS
 * @param {object}   [options]
 * @param {Function} [options.onSaved]  called after a successful create or update
 * @param {boolean}  [options.enabled]  set false to skip fetching (e.g. while logged out)
 */
export default function useMyListings(endpoints, { onSaved, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const { queryKey } = endpoints;
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => (await API.get(endpoints.list)).data,
    enabled,
  });

  const { mutate: addProperty, isPending: isAdding } = useMutation({
    mutationFn: (newProperty) => API.post(endpoints.create, newProperty),
    onSuccess: (response) => {
      // A retry of a submission that had already gone through (FORM-11):
      // the server returned that listing instead of making a copy.
      toast.success(
        response?.data?.replayed
          ? "This listing was already submitted."
          : "Submitted for review. We'll check it before it goes live."
      );
      refresh();
      onSaved?.();
    },
    onError: (err) => showListingError(err, "Failed to add property"),
  });

  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    // wasLive isn't sent to the API; it only picks the message below
    mutationFn: ({ id, data }) => API.put(endpoints.update(id), data),
    onSuccess: (response, { wasLive }) => {
      // Nothing changed: the server saved nothing and the listing's status is
      // as it was (a live listing stays live), so don't say otherwise.
      if (response?.data?.unchanged) {
        toast.success("No changes to save.");
      } else {
        // Every edit goes back to review, and a live listing is hidden until then
        toast.success(
          wasLive
            ? "Changes saved. This listing is hidden until our team approves them."
            : "Changes saved and sent for review."
        );
      }
      refresh();
      onSaved?.();
    },
    onError: (err) => {
      showListingError(err, "Failed to update property");
      // 409: reviewed or edited elsewhere since it was opened. Refresh the
      // list; useListingsWorkspace closes the form so reopening loads it.
      if (err.response?.status === 409) refresh();
    },
  });

  const { mutate: deleteProperty } = useMutation({
    mutationFn: (id) => API.delete(endpoints.remove(id)),
    onSuccess: () => {
      toast.success("Property deleted");
      refresh();
    },
    onError: (err) => showListingError(err, "Failed to delete property"),
  });

  return {
    properties,
    isLoading,
    isError,
    addProperty,
    isAdding,
    updateProperty,
    isUpdating,
    deleteProperty,
  };
}
