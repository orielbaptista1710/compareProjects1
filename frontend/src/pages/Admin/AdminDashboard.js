import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, TextField, Select,
  MenuItem, Button, CircularProgress, Stack, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import debounce from "lodash.debounce";

import AdminPropertyTable from "../Admin/AdminDasboardComponents/AdminPropertyTable";
import DeveloperDetailsModal from "../Admin/AdminDasboardComponents/DeveloperDetailsModal";
// Fetch properties
const fetchProperties = async ({ queryKey }) => {
  const [, filters] = queryKey;
  const params = {
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    propertyType: filters.propertyType,
    q: filters.search,
  };
  const { data } = await axios.get("/api/admin/properties", { params });
  return data;
};


// Approve / Reject API
const approveProperty = async (id) => {
  const { data } = await axios.put(`/api/admin/approve/${id}`);
  return data;
};
const rejectProperty = async ({ id, reason }) => {
  const { data } = await axios.put(`/api/admin/reject/${id}`, { rejectionReason: reason });
  return data;
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // Pagination & Filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

const handleRowClick = async (property) => {
  try {
    const res = await axios.get(`/api/admin/property/${property._id}`);
    setSelectedProperty(res.data.data);   // ⭐ FIX HERE
    setDetailsModalOpen(true);
  } catch (e) {
    console.error("Failed to fetch full property", e);
  }
};



  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceSearch = useMemo(
  () => debounce((val) => setDebouncedSearch(val), 500),
  []
);
  useEffect(() => { debounceSearch(search); }, [search, debounceSearch]);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Reject Modal
  const [rejectModal, setRejectModal] = useState({ open: false, propertyId: null, reason: "" });


  // Fetch properties
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["properties", {
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter,
      propertyType: propertyTypeFilter,
      search: debouncedSearch,
    }],
    queryFn: fetchProperties,
    keepPreviousData: true,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1500,
  });

  // Mutations
  const approveMutation = useMutation({ 
    mutationFn: approveProperty, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setSnackbar({ open: true, message: "Property approved!", severity: "success" });
    },
    onError: () => {
      setSnackbar({ open: true, message: "Failed to approve.", severity: "error" });
    }
  });
  
  const rejectMutation = useMutation({ 
    mutationFn: rejectProperty, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setSnackbar({ open: true, message: "Property rejected!", severity: "success" });
      setRejectModal({ open: false, propertyId: null, reason: "" });
    },
    onError: () => {
      setSnackbar({ open: true, message: "Failed to reject.", severity: "error" });
    }
  });

  const handleApprove = (id) => {
    if(window.confirm("Approve this property?")) approveMutation.mutate(id);
  };
  const handleOpenReject = (id) => setRejectModal({ open: true, propertyId: id, reason: "" });
  const handleRejectConfirm = () => rejectMutation.mutate({ id: rejectModal.propertyId, reason: rejectModal.reason });

  // Reset page when filters/search change
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter, propertyTypeFilter]);

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">Failed to load properties. <Button onClick={refetch}>Retry</Button></Typography>;

  return (
    <Box p={3} pt={13}>
      <Typography variant="h4" gutterBottom >
        Admin Dashboard {isFetching && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Typography>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />

        <Select
          value={propertyTypeFilter}
          onChange={(e) => setPropertyTypeFilter(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="Flats/Apartments">Flats/Apartments</MenuItem>
          <MenuItem value="Villa">Villa</MenuItem>
          <MenuItem value="Plot">Plot</MenuItem>
          <MenuItem value="Shop/Showroom">Shop/Showroom</MenuItem>
          <MenuItem value="Industrial Warehouse">Industrial Warehouse</MenuItem>
          <MenuItem value="Retail">Retail</MenuItem>
          <MenuItem value="Office Space">Office Space</MenuItem>
        </Select>

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>
      </Stack>

      {/* Properties Table */}
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

    <DeveloperDetailsModal 
  open={detailsModalOpen}
  onClose={() => setDetailsModalOpen(false)}
  property={selectedProperty}
/>


      {/* Reject Reason Modal */}
      <Dialog open={rejectModal.open} onClose={()=>setRejectModal({ open:false, propertyId:null, reason:"" })}>
        <DialogTitle>Reject Property</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectModal.reason}
            onChange={(e)=>setRejectModal({...rejectModal, reason:e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setRejectModal({ open:false, propertyId:null, reason:"" })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectConfirm}>Reject</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={()=>setSnackbar({...snackbar, open:false})}>
        <Alert severity={snackbar.severity} sx={{ width:"100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
