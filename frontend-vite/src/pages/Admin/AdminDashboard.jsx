// frontend-vite/src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Skeleton,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../api";
import debounce from "lodash.debounce";

import AdminPropertyTable from "./AdminDasboardComponents/AdminPropertyTable";
import DeveloperDetailsModal from "./AdminDasboardComponents/DeveloperDetailsModal";
import AdminFilters from "./AdminDasboardComponents/AdminFilters";

import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import toastError from "../../utils/toastError";

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
  };
  const { data } = await API.get("/api/admin/properties", { params });
  return data;
};

const approvePropertyApi = async (id) => {
  const { data } = await API.put(`/api/admin/approve/${id}`);
  return data;
};

const rejectPropertyApi = async ({ id, reason }) => {
  const { data } = await API.put(`/api/admin/reject/${id}`, { rejectionReason: reason });
  return data;
};

const logoutApi = async () => {
  await API.post("/api/auth/logout");
};

// ─── Default filter state (stable reference — avoids inline object recreation) ─

const DEFAULT_FILTERS = {
  search:       "",
  propertyType: "",
  status:       "",
  city:         "",
  locality:     null,
  imageFilter:  "",
  sortBy:       "latest",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [filters, setFilters]               = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [selectedProperty, setSelectedProperty]   = useState(null);
  const [detailsModalOpen, setDetailsModalOpen]   = useState(false);
  const [detailsLoading, setDetailsLoading]       = useState(false);
  const [rejectModal, setRejectModal]             = useState({ open: false, propertyId: null, reason: "" });
  const [confirmApprove, setConfirmApprove]       = useState({ open: false, propertyId: null });

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

  const { data: currentUser } = useQuery({
    queryKey: ["adminMe"],
    queryFn:  async () => {
      const { data } = await API.get("/api/auth/me");
      return data.user;
    },
    staleTime: Infinity,
    retry: false,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidateProperties = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminProperties"] });
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: approvePropertyApi,
    onSuccess:  () => {
      invalidateProperties();
      toast.success("Property approved");
      setConfirmApprove({ open: false, propertyId: null });
    },
    onError: (err) => toastError(err, "Failed to approve property"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPropertyApi,
    onSuccess:  () => {
      invalidateProperties();
      toast.success("Property rejected");
      setRejectModal({ open: false, propertyId: null, reason: "" });
    },
    onError: (err) => toastError(err, "Failed to reject property"),
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  // ── Row click — load full property detail ────────────────────────────────────

  const handleRowClick = useCallback(async (property) => {
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    try {
      const res = await API.get(`/api/admin/property/${property._id}`);
      setSelectedProperty(res.data.data);
    } catch (e) {
      toastError(e, "Failed to load property details");
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsModalOpen(false);
    setTimeout(() => setSelectedProperty(null), 300);
  }, []);

  // ── Approve flow ──────────────────────────────────────────────────────────

  const handleApprove = useCallback((id) => {
    setConfirmApprove({ open: true, propertyId: id });
  }, []);

  const handleApproveConfirm = useCallback(() => {
    approveMutation.mutate(confirmApprove.propertyId);
  }, [approveMutation, confirmApprove.propertyId]);

  // ── Reject flow ──────────────────────────────────────────────────────────────

  const handleOpenReject  = useCallback((id) => setRejectModal({ open: true, propertyId: id, reason: "" }), []);
  const handleRejectConfirm = useCallback(() => {
    rejectMutation.mutate({ id: rejectModal.propertyId, reason: rejectModal.reason });
  }, [rejectMutation, rejectModal]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isError && !data) {
    return (
      <Box p={4} pt={13}>
        <Alert
          severity="error"
          action={<Button onClick={refetch} size="small">Retry</Button>}
        >
          Failed to load properties.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 11, md: 13 },
        pb: 6,
        maxWidth: 1600,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h5" fontWeight={600}>
            Properties
          </Typography>
          {isFetching && (
            <CircularProgress size={16} thickness={4} sx={{ color: "primary.main" }} />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {data?.total != null && (
            <Box
              sx={{
                px: 1.5, py: 0.4,
                borderRadius: 2,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Typography variant="body2" fontWeight={600} lineHeight={1}>
                {data.total.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1}>
                {data.total === 1 ? "property" : "properties"}
              </Typography>
            </Box>
          )}

          <Box sx={{ width: "1px", height: 28, bgcolor: "divider" }} />

          {currentUser && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "#fff", lineHeight: 1, fontSize: "0.7rem" }}
                >
                  {currentUser.displayName?.charAt(0).toUpperCase() ?? "A"}
                </Typography>
              </Box>

              <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column" }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {currentUser.displayName}
                </Typography>
                <Typography
                  variant="caption"
                  lineHeight={1.2}
                  sx={{
                    color: "primary.main",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                >
                  {currentUser.role}
                </Typography>
              </Box>
            </Box>
          )}

          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<LogOut size={14} />}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            sx={{
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": { borderColor: "error.main", color: "error.main" },
            }}
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </Box>
      </Box>

      <AdminFilters
        filters={filters}
        setFilters={setFilters}
        cityList={cityList}
        localities={localities}
        loadingLocalities={loadingLocalities}
      />

      {isLoading && !data ? (
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
          />
        </Box>
      )}

      <DeveloperDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetails}
        property={selectedProperty}
        loading={detailsLoading}
      />

      <Dialog
        open={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, propertyId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Approve property?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will mark the listing as approved and make it visible to customers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApprove({ open: false, propertyId: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveConfirm}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? "Approving…" : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, propertyId: null, reason: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject property</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Reason for rejection"
            placeholder="e.g. Missing RERA number, incorrect price…"
            fullWidth
            multiline
            rows={3}
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectModal({ open: false, propertyId: null, reason: "" })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}