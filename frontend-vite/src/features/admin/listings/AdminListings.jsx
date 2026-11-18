// features/admin/listings/AdminListings.jsx
// The admin "Listings" tab: filter, review (approve/reject, single or bulk)
// and inspect every listing. Filters and page live in the URL.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box, Typography, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Skeleton,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../../api/api";
import debounce from "lodash.debounce";

import AdminPropertyTable from "../AdminDasboardComponents/AdminPropertyTable";
import DeveloperDetailsModal from "../AdminDasboardComponents/DeveloperDetailsModal";
import AdminFilters from "../AdminDasboardComponents/AdminFilters";
import { canApprove, canReject } from "../listingStatus";
import RejectListingDialog from "./RejectListingDialog";
import { DEFAULT_LISTING_FILTERS as DEFAULT_FILTERS, defaultSortFor, readFiltersFromParams } from "./listingFilters";
import { ADMIN_COUNTS_KEY } from "../hooks/useAdminStatusCounts";

import toast from "react-hot-toast";
import toastError from "../../../utils/toastError";

// ─── API helpers (outside component — stable references) ────────────────────

const fetchProperties = async ({ queryKey }) => {
  const [, filters] = queryKey;
  const params = {
    page:         filters.page,
    limit:        filters.limit,
    status:       filters.status       || undefined,
    propertyType: filters.propertyType || undefined,
    search:       filters.search       || undefined,
    city:         filters.city         || undefined,
    locality:     filters.locality     || undefined,
    sortBy:       filters.sortBy,
    imageFilter:  filters.imageFilter  || undefined,
    listedBy:     filters.listedBy     || undefined,
  };
  const { data } = await API.get("/api/admin/properties", { params });
  return data;
};

// Every review carries the listing version the admin was looking at
// (contentVersion). If the poster edited since, the server answers 409 and
// nothing is decided, so an admin never approves content they didn't see.
const versionOf = (listing) => listing?.contentVersion ?? 0;

const approvePropertyApi = async ({ id, version }) => {
  const { data } = await API.put(`/api/admin/approve/${id}`, { version });
  return data;
};

const rejectPropertyApi = async ({ id, reason, version }) => {
  const { data } = await API.put(`/api/admin/reject/${id}`, { rejectionReason: reason, version });
  return data;
};

const bulkApprovePropertiesApi = async ({ ids, versions }) => {
  const { data } = await API.put("/api/admin/bulk-approve", { ids, versions });
  return data;
};

const bulkRejectPropertiesApi = async ({ ids, reason, versions }) => {
  const { data } = await API.put("/api/admin/bulk-reject", { ids, rejectionReason: reason, versions });
  return data;
};

// A 403 here is "you can't review your own listing", not a deactivated
// account (toastError's generic 403 text), and a 409 is "already decided" or
// "edited since you opened it", so show the server's reason for both.
const showReviewError = (err, fallback) => {
  const serverMsg = err.response?.data?.message;
  if ([403, 409].includes(err.response?.status) && serverMsg) return toast.error(serverMsg);
  return toastError(err, fallback);
};

const changedNote = (n) =>
  `${n} selected ${n === 1 ? "listing was" : "listings were"} edited after this page loaded and ${n === 1 ? "was" : "were"} skipped. Review ${n === 1 ? "it" : "them"} again.`;

const plural = (n) => `${n} propert${n === 1 ? "y" : "ies"}`;

// Bulk approve keeps a suspended agent's listings hidden. The backend's
// `modified` counts those too, so the live count is modified - hidden.
const bulkApprovedMessage =({ modified = 0, hidden = 0 }) => {
  if (!hidden) return `${plural(modified)} approved`;
  const live = Math.max(0, modified - hidden);
  const held = `${hidden} ${hidden === 1 ? "stays" : "stay"} hidden until the posting agent is reinstated`;
  return live ? `${plural(live)} approved and live — ${held}` : `Approved, but ${held}`;
};

const skippedNote = (n, why) =>
  `${n} selected ${n === 1 ? "listing is" : "listings are"} ${why} and will be skipped.`;

// ─── URL <-> page helpers (filters: readFiltersFromParams) ───────────────────

function readInitialPageFromParams(params) {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 0;
}

function readInitialRowsPerPageFromParams(params) {
  const limit = Number(params.get("limit"));
  return [10, 20, 50, 100].includes(limit) ? limit : 20;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminListings() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage]               = useState(() => readInitialPageFromParams(searchParams));
  const [rowsPerPage, setRowsPerPage] = useState(() => readInitialRowsPerPageFromParams(searchParams));

  // Filters
  const [filters, setFilters]               = useState(() => readFiltersFromParams(searchParams));
  const [debouncedSearch, setDebouncedSearch] = useState(() => readFiltersFromParams(searchParams).search);

  // Modals — propertyId can be a single id (string) or an array of ids (bulk action)
  const [selectedProperty, setSelectedProperty]   = useState(null);
  const [detailsModalOpen, setDetailsModalOpen]   = useState(false);
  const [detailsLoading, setDetailsLoading]       = useState(false);
  const [rejectModal, setRejectModal]             = useState({ open: false, propertyId: null });
  const [confirmApprove, setConfirmApprove]       = useState({ open: false, propertyId: null });

  // Bulk selection (checkbox column in AdminPropertyTable).
  // MUI X Data Grid v8+ controlled rowSelectionModel is { type, ids: Set<GridRowId> },
  // not a plain array — see https://mui.com/x/react-data-grid/row-selection/
  const [selectionModel, setSelectionModel] = useState({ type: "include", ids: new Set() });
  const clearSelection = useCallback(() => setSelectionModel({ type: "include", ids: new Set() }), []);

  // ── Debounced search (legitimate effect — bridges React state to an
  //    external timer/debounce mechanism, which is exactly what useEffect
  //    is for) ──────────────────────────────────────────────────────────
  const debounceSearch = useMemo(
    () => debounce((val) => setDebouncedSearch(val), 500),
    []
  );

  useEffect(() => () => debounceSearch.cancel(), [debounceSearch]);

  useEffect(() => {
    debounceSearch(filters.search);
  }, [filters.search, debounceSearch]);

  // ── Sync current filters/page to the URL (after the search debounce) ───────
  // One-directional (state -> URL) plus the one-time hydration above on
  // mount: covers "refresh keeps my filters" and "share this link" without
  // making the URL the single source of truth for every render.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.status !== DEFAULT_FILTERS.status) params.set("status", filters.status || "all");
    if (filters.listedBy) params.set("listedBy", filters.listedBy);
    if (filters.city) params.set("city", filters.city);
    if (filters.locality) params.set("locality", filters.locality);
    if (filters.imageFilter) params.set("imageFilter", filters.imageFilter);
    if (filters.sortBy !== defaultSortFor(filters.status)) params.set("sortBy", filters.sortBy);
    if (page) params.set("page", String(page));
    if (rowsPerPage !== 20) params.set("limit", String(rowsPerPage));
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.propertyType,
    filters.status,
    filters.listedBy,
    filters.city,
    filters.locality,
    filters.imageFilter,
    filters.sortBy,
    page,
    rowsPerPage,
  ]);

  // ── Reset locality when city changes (render-time adjustment) ──────────────
  // Replaces useEffect(() => setFilters(prev => ({...prev, locality: null})), [filters.city]).
  // prevFilterCity (state, not a ref — refs can't be read/written during
  // render) lets us detect "city just changed" and react to it in the same
  // render pass, per React's documented "adjusting state when a prop
  // changes" pattern. This avoids the extra render + flash of stale
  // locality that the effect version caused.
  const [prevFilterCity, setPrevFilterCity] = useState(filters.city);
  if (filters.city !== prevFilterCity) {
    setPrevFilterCity(filters.city);
    setFilters((prev) => ({ ...prev, locality: null }));
  }

  // ── Reset page on any filter change (render-time adjustment) ───────────────
  // Replaces useEffect(() => setPage(0), [debouncedSearch, filters.status, ...]).
  // Same pattern: track a signature of "the filters that should reset
  // pagination" and reset page synchronously when that signature changes,
  // instead of doing it a render-cycle late inside an effect.
  const pageResetKey = JSON.stringify([
    debouncedSearch,
    filters.status,
    filters.listedBy,
    filters.propertyType,
    filters.city,
    filters.locality,
    filters.sortBy,
    filters.imageFilter,
  ]);
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setPage(0);
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  const queryKey = useMemo(() => [
    "adminProperties",
    {
      page:         page + 1,
      limit:        rowsPerPage,
      status:       filters.status,
      listedBy:     filters.listedBy,
      propertyType: filters.propertyType,
      search:       debouncedSearch,
      city:         filters.city,
      locality:     filters.locality,
      sortBy:       filters.sortBy,
      imageFilter:  filters.imageFilter,
    },
  ], [page, rowsPerPage, filters, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn:        fetchProperties,
    placeholderData: (prev) => prev,
    staleTime:      30_000,
    retry:          2,
    retryDelay:     1500,
  });

  // Versions of every row seen on any page, so a selection that spans pages
  // still sends what the admin was shown for each listing.
  const seenVersions = useRef(new Map());
  useEffect(() => {
    for (const row of data?.data ?? []) seenVersions.current.set(row._id, versionOf(row));
  }, [data]);

  const { data: cityList = [] } = useQuery({
    queryKey: ["adminCities"],
    queryFn:  async () => {
      const { data } = await API.get("/api/admin/cities");
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: localities = [], isFetching: loadingLocalities } = useQuery({
    queryKey: ["adminLocalities", filters.city],
    queryFn:  async () => {
      if (!filters.city) return [];
      const { data } = await API.get("/api/admin/localities", {
        params: { city: filters.city },
      });
      return data;
    },
    enabled:   !!filters.city,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidateProperties = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminProperties"] });
    // The pending badge on the Listings tab
    queryClient.invalidateQueries({ queryKey: ADMIN_COUNTS_KEY });
  }, [queryClient]);

  // Keep an open details modal in step with the review just made, so it
  // doesn't keep showing the old status and offering the same action again.
  const syncSelected = useCallback((updated) => {
    if (!updated?._id) return;
    setSelectedProperty((prev) =>
      prev && String(prev._id) === String(updated._id)
        ? { ...prev, status: updated.status, rejectionReason: updated.rejectionReason, reviewedAt: updated.reviewedAt }
        : prev
    );
  }, []);

  // After a 409 the list (and an open details view of that listing) is out of
  // date: reload both so the admin sees the version they'd be deciding on.
  const selectedIdRef = useRef(null);
  const reloadDetailsRef = useRef(null);
  useEffect(() => {
    selectedIdRef.current = selectedProperty?._id ?? null;
  }, [selectedProperty]);
  const reloadAfterConflict = useCallback((err, id) => {
    if (err.response?.status !== 409) return;
    invalidateProperties();
    if (id && selectedIdRef.current === id) reloadDetailsRef.current?.(id);
  }, [invalidateProperties]);

  const approveMutation = useMutation({
    mutationFn: approvePropertyApi,
    onSuccess:  (result) => {
      invalidateProperties();
      syncSelected(result?.property);
      // "Approved, but hidden until the posting agent is reinstated" when the
      // agent is suspended.
      toast.success(result?.message || "Property approved");
      setConfirmApprove({ open: false, propertyId: null });
    },
    onError: (err, { id }) => {
      showReviewError(err, "Failed to approve property");
      reloadAfterConflict(err, id);
      setConfirmApprove({ open: false, propertyId: null });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPropertyApi,
    onSuccess:  (result) => {
      invalidateProperties();
      syncSelected(result?.property);
      toast.success("Property rejected");
      setRejectModal({ open: false, propertyId: null });
    },
    onError: (err, { id }) => {
      showReviewError(err, "Failed to reject property");
      reloadAfterConflict(err, id);
      setRejectModal({ open: false, propertyId: null });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: bulkApprovePropertiesApi,
    onSuccess:  (result) => {
      invalidateProperties();
      if (result.modified || !result.changed) toast.success(bulkApprovedMessage(result));
      if (result.changed) toast.error(changedNote(result.changed));
      setConfirmApprove({ open: false, propertyId: null });
      clearSelection();
    },
    onError: (err) => showReviewError(err, "Failed to approve properties"),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: bulkRejectPropertiesApi,
    onSuccess:  (result) => {
      invalidateProperties();
      if (result.modified || !result.changed) toast.success(`${plural(result.modified)} rejected`);
      if (result.changed) toast.error(changedNote(result.changed));
      setRejectModal({ open: false, propertyId: null });
      clearSelection();
    },
    onError: (err) => showReviewError(err, "Failed to reject properties"),
  });

  // ── Row click — load full property detail ────────────────────────────────────

  // The modal must only ever show (and act on) the listing last clicked: clear
  // the previous one at once (its Approve/Reject would otherwise still point
  // at it while the new one loads), cancel a pending close-cleanup, and drop
  // a response that arrives after a newer click.
  const detailsRequest = useRef(0);
  const closeTimer = useRef(null);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleRowClick = useCallback(async (property) => {
    const request = ++detailsRequest.current;
    clearTimeout(closeTimer.current);
    setSelectedProperty(null);
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    try {
      const res = await API.get(`/api/admin/property/${property._id}`);
      if (request === detailsRequest.current) setSelectedProperty(res.data.data);
    } catch (e) {
      if (request !== detailsRequest.current) return;
      toastError(e, "Failed to load property details");
      setDetailsModalOpen(false);
    } finally {
      if (request === detailsRequest.current) setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadDetailsRef.current = (id) => handleRowClick({ _id: id });
  }, [handleRowClick]);

  const handleCloseDetails = useCallback(() => {
    detailsRequest.current += 1; // a still-loading listing must not reopen it
    setDetailsModalOpen(false);
    setDetailsLoading(false);
    // Clear after the close animation so the content doesn't vanish mid-fade.
    closeTimer.current = setTimeout(() => setSelectedProperty(null), 300);
  }, []);

  // ── Approve flow (single row or bulk — propertyId can be an id or an array) ──

  // version: the contentVersion of the row or details the admin acted from
  const handleApprove = useCallback((id, version) => {
    setConfirmApprove({ open: true, propertyId: id, version });
  }, []);

  // Bulk actions follow the row buttons' rules: re-approving an approved (or
  // hidden) listing or re-rejecting a rejected one would only rewrite its
  // review history. Selected ids not on this page are sent as they are.
  const splitSelection = useCallback((allowed) => {
    const rows = new Map((data?.data ?? []).map((row) => [row._id, row]));
    const all = Array.from(selectionModel.ids);
    const ids = all.filter((id) => !rows.has(id) || allowed(rows.get(id).status));
    return { ids, skipped: all.length - ids.length };
  }, [data, selectionModel]);

  // { id: version } for a bulk request. An id never seen on a page is sent
  // without one, and the server skips it rather than decide it blind.
  const versionsFor = useCallback((ids) => Object.fromEntries(
    ids.filter((id) => seenVersions.current.has(id)).map((id) => [id, seenVersions.current.get(id)])
  ), []);

  const handleBulkApproveClick = useCallback(() => {
    const { ids, skipped } = splitSelection(canApprove);
    if (!ids.length) return toast.error("None of the selected listings can be approved");
    setConfirmApprove({ open: true, propertyId: ids, skipped });
  }, [splitSelection]);

  const handleApproveConfirm = useCallback(() => {
    const { propertyId, version } = confirmApprove;
    if (Array.isArray(propertyId)) {
      bulkApproveMutation.mutate({ ids: propertyId, versions: versionsFor(propertyId) });
    } else {
      approveMutation.mutate({ id: propertyId, version });
    }
  }, [approveMutation, bulkApproveMutation, confirmApprove, versionsFor]);

  // ── Reject flow (single row or bulk) ──────────────────────────────────────────

  const handleOpenReject = useCallback(
    (id, version) => setRejectModal({ open: true, propertyId: id, version }),
    []
  );

  const handleBulkRejectClick = useCallback(() => {
    const { ids, skipped } = splitSelection(canReject);
    if (!ids.length) return toast.error("None of the selected listings can be rejected");
    setRejectModal({ open: true, propertyId: ids, skipped });
  }, [splitSelection]);

  // Owners and agents see the reason on their listing, so it's required
  // (RejectListingDialog won't confirm without one).
  const handleRejectConfirm = useCallback((reason) => {
    if (!reason) return;
    const { propertyId, version } = rejectModal;
    if (Array.isArray(propertyId)) {
      bulkRejectMutation.mutate({ ids: propertyId, reason, versions: versionsFor(propertyId) });
    } else {
      rejectMutation.mutate({ id: propertyId, reason, version });
    }
  }, [rejectMutation, bulkRejectMutation, rejectModal, versionsFor]);

  const closeReject = useCallback(() => setRejectModal({ open: false, propertyId: null }), []);

  const isApprovePending = Array.isArray(confirmApprove.propertyId)
    ? bulkApproveMutation.isPending
    : approveMutation.isPending;

  const isRejectPending = Array.isArray(rejectModal.propertyId)
    ? bulkRejectMutation.isPending
    : rejectMutation.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        {data?.total != null && (
          <Typography variant="body2" color="text.secondary">
            <strong>{data.total.toLocaleString()}</strong>{" "}
            {data.total === 1 ? "property" : "properties"}
          </Typography>
        )}
        {isFetching && (
          <CircularProgress size={16} thickness={4} sx={{ color: "primary.main" }} />
        )}
      </Box>

      <AdminFilters
        filters={filters}
        setFilters={setFilters}
        cityList={cityList}
        localities={localities}
        loadingLocalities={loadingLocalities}
      />

      {selectionModel.ids.size > 0 && (
        <Box
          sx={{
            mb: 2, p: 1.5,
            borderRadius: 2,
            bgcolor: "action.selected",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {selectionModel.ids.size} selected
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" color="success" onClick={handleBulkApproveClick}>
              Approve
            </Button>
            <Button size="small" variant="contained" color="error" onClick={handleBulkRejectClick}>
              Reject
            </Button>
            <Button size="small" variant="text" color="inherit" onClick={clearSelection}>
              Clear
            </Button>
          </Box>
        </Box>
      )}

      {/* The filters above stay on screen, so a filter that fails can be changed. */}
      {isError && !data ? (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()} size="small">Retry</Button>}
        >
          Failed to load properties. Try again, or change the filters above.
        </Alert>
      ) : isLoading && !data ? (
        <Box>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 0.5, borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            opacity:    isFetching ? 0.6 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <AdminPropertyTable
            data={data}
            page={page}
            rowsPerPage={rowsPerPage}
            setPage={setPage}
            setRowsPerPage={setRowsPerPage}
            handleApprove={handleApprove}
            handleOpenReject={handleOpenReject}
            approveMutation={approveMutation}
            rejectMutation={rejectMutation}
            onRowClick={handleRowClick}
            selectionModel={selectionModel}
            onSelectionModelChange={setSelectionModel}
          />
        </Box>
      )}

      <DeveloperDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetails}
        property={selectedProperty}
        loading={detailsLoading}
        onApprove={selectedProperty && canApprove(selectedProperty.status) ? () => handleApprove(selectedProperty._id, versionOf(selectedProperty)) : undefined}
        onReject={selectedProperty && canReject(selectedProperty.status) ? () => handleOpenReject(selectedProperty._id, versionOf(selectedProperty)) : undefined}
        isApproving={approveMutation.isPending && approveMutation.variables?.id === selectedProperty?._id}
        isRejecting={rejectMutation.isPending && rejectMutation.variables?.id === selectedProperty?._id}
      />

      <Dialog
        open={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, propertyId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {Array.isArray(confirmApprove.propertyId)
            ? `Approve ${confirmApprove.propertyId.length} properties?`
            : "Approve property?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {Array.isArray(confirmApprove.propertyId)
              ? "This will mark the selected listings as approved and make them visible to customers."
              : "This will mark the listing as approved and make it visible to customers."}
            {" "}Listings from a suspended agent stay hidden until the agent is reinstated.
          </Typography>
          {confirmApprove.skipped > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {skippedNote(confirmApprove.skipped, "already approved or hidden")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApprove({ open: false, propertyId: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveConfirm}
            disabled={isApprovePending}
          >
            {isApprovePending ? "Approving…" : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      <RejectListingDialog
        open={rejectModal.open}
        count={Array.isArray(rejectModal.propertyId) ? rejectModal.propertyId.length : 1}
        note={rejectModal.skipped > 0 ? skippedNote(rejectModal.skipped, "already rejected") : null}
        isPending={isRejectPending}
        onConfirm={handleRejectConfirm}
        onClose={closeReject}
      />
    </Box>
  );
}
