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

// The listing routes answer 403/429 with a specific reason ("Verify your email
// to post", "pending listing limit reached"); show it instead of toastError's
// generic "account deactivated" / "slow down" text.
const showListingError = (err, fallback) => {
  const status = err.response?.status;
  const serverMsg = err.response?.data?.message;
  if ((status === 403 || status === 429) && serverMsg) return toast.error(serverMsg);
  return toastError(err, fallback);
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
    onSuccess: () => {
      toast.success("Property submitted successfully!");
      refresh();
      onSaved?.();
    },
    onError: (err) => showListingError(err, "Failed to add property"),
  });

  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => API.put(endpoints.update(id), data),
    onSuccess: () => {
      toast.success("Property updated successfully");
      refresh();
      onSaved?.();
    },
    onError: (err) => showListingError(err, "Failed to update property"),
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
