// src/features/listings/hooks/useListingsWorkspace.js
//
// The "post and manage listings" logic shared by every posting dashboard:
// which listing is being edited, the form's starting values, the required-field
// check, and add / update / delete through useMyListings. A dashboard keeps only
// its own navigation (which tab is showing) and passes it in as callbacks.
//
// The handlers are stable (same function between renders) so the memoised
// listing cards don't re-render every time the dashboard does.
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useMyListings from "./useMyListings";
import { LISTED_BY } from "../../../constants/roles";
import { LISTING_STATUS } from "../../admin/listingStatus";
import {
  initialFormData,
  normalizePropertyData,
} from "../../developer-dashboard/utils/developerDashPropertyHelpers";
import { formRoleConfig } from "../../developer-dashboard/property-form/roleConfig";

/**
 * @param {object}   args
 * @param {object}   args.endpoints  DEVELOPER_LISTING_ENDPOINTS or CUSTOMER_LISTING_ENDPOINTS
 * @param {string}   [args.role]     LISTED_BY value; decides which fields are required
 * @param {boolean}  [args.enabled]  false skips fetching (e.g. while logged out)
 * @param {Function} [args.onSaved]  after a successful create or update (go to the list)
 * @param {Function} [args.onEdit]   when a listing is opened for editing (go to the form)
 */
export default function useListingsWorkspace({
  endpoints,
  role = LISTED_BY.DEVELOPER,
  enabled = true,
  onSaved,
  onEdit,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const { requiredFields } = formRoleConfig(role);

  // Callers pass inline arrows (new every render), and the handlers below need
  // the current listings and edit id. Keep the latest in a ref so the handlers
  // stay the same function between renders.
  const latest = useRef({ onSaved, onEdit, properties: [], editingId });

  const {
    properties, isLoading, isError,
    addProperty, isAdding, updateProperty, isUpdating, deleteProperty,
  } = useMyListings(endpoints, {
    enabled,
    onSaved: () => {
      setFormData(initialFormData);
      setEditingId(null);
      latest.current.onSaved?.();
    },
  });

  useEffect(() => {
    latest.current = { onSaved, onEdit, properties, editingId };
  });

  // Status of the listing being edited (e.g. to warn that a live one will be
  // sent back for review). Undefined when adding or before the list has loaded.
  const editingListing = editingId ? properties.find((p) => p._id === editingId) : undefined;
  const editingStatus = editingListing?.status;
  // Approved at least once (server: LOCKED_AFTER_APPROVAL in listingRules.js).
  // Older listings have no firstApprovedAt; their status says it.
  const editingLocked = Boolean(
    editingListing &&
      (editingListing.firstApprovedAt ||
        [LISTING_STATUS.APPROVED, LISTING_STATUS.SUSPENDED].includes(editingListing.status))
  );

  // The version of the listing when it was opened. Sent with the save, so a
  // form left open while the listing changed (another tab, a review) gets a
  // 409 instead of overwriting the newer version.
  const openedVersion = useRef(0);

  // `onSuccess` runs only once the server has saved the listing (the form uses
  // it to clear its draft); `onError` gets a failed save's error (the form
  // marks the fields the server rejected).
  const handleSubmit = useCallback(
    (data, { onSuccess, onError } = {}) => {
      const missing = requiredFields.filter((f) => !data[f]);
      if (missing.length) {
        toast.error(`Please fill in: ${missing.join(", ")}`);
        return;
      }
      if (editingId) {
        // Only used to word the success message (see useMyListings)
        const wasLive =
          latest.current.properties.find((p) => p._id === editingId)?.status ===
          LISTING_STATUS.APPROVED;
        updateProperty(
          { id: editingId, data: { ...data, expectedVersion: openedVersion.current }, wasLive },
          { onSuccess, onError }
        );
      } else {
        addProperty(data, { onSuccess, onError });
      }
    },
    [requiredFields, editingId, updateProperty, addProperty]
  );

  const handleEdit = useCallback((property) => {
    setEditingId(property._id);
    openedVersion.current = property.contentVersion ?? 0;
    setFormData(normalizePropertyData(property));
    latest.current.onEdit?.(property);
  }, []);

  // Drops whatever listing was being edited, so the form is empty and saving
  // creates a new listing instead of overwriting the old one. Used by Cancel and
  // by the "New listing" buttons. With nothing being edited it changes nothing,
  // so anything already typed into a new listing is kept.
  const stopEditing = useCallback(() => {
    setEditingId(null);
    setFormData(initialFormData);
  }, []);

  // Only the id: mutate()'s 2nd argument is options, so extra args from a
  // caller must not reach it. If the listing being edited is the one deleted,
  // the edit state goes too (a later save would PUT to an id that's gone).
  const handleDelete = useCallback(
    (id) =>
      deleteProperty(id, {
        onSuccess: () => {
          if (latest.current.editingId === id) {
            setEditingId(null);
            setFormData(initialFormData);
          }
        },
      }),
    [deleteProperty]
  );

  return {
    properties,
    isLoading,
    isError,
    formData,
    editingId,
    editingStatus,
    editingLocked,
    isAdding,
    isUpdating,
    handleSubmit,
    handleEdit,
    handleStartNew: stopEditing,
    handleCancelEdit: stopEditing,
    handleDelete,
  };
}
