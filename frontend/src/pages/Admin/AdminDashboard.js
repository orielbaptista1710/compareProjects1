import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, TextField, Button, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  // Select,MenuItem,Stack
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../api"
import debounce from "lodash.debounce";
// import { Autocomplete } from "@mui/material";

import AdminPropertyTable from "../Admin/AdminDasboardComponents/AdminPropertyTable";
import DeveloperDetailsModal from "../Admin/AdminDasboardComponents/DeveloperDetailsModal";
import AdminFilters from "../Admin/AdminDasboardComponents/AdminFilters";

// Fetch properties
//CHECK THIS - LINK UP WITH THE ADMINBACKEND STUFF 
const fetchProperties = async ({ queryKey }) => {
  const [, filters] = queryKey;
  const params = {
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    propertyType: filters.propertyType,
    q: filters.search,
    city: filters.city || undefined,
    locality: filters.locality || undefined,
    sortBy: filters.sortBy,
    imageFilter: filters.imageFilter,

  };
  const { data } = await API.get("/api/admin/properties", { params });
  return data;

};    

// Approve / Reject API
const approveProperty = async (id) => {
  const { data } = await API.put(`/api/admin/approve/${id}`);
  return data;
};
const rejectProperty = async ({ id, reason }) => {
  const { data } = await API.put(`/api/admin/reject/${id}`, { rejectionReason: reason });
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

  const [cityFilter, setCityFilter] = useState("");

  const [localityFilter, setLocalityFilter] = useState(null);
  const [localitySearch, setLocalitySearch] = useState("");


  const [sortBy, setSortBy] = useState("latest"); 

  const [imageFilter, setImageFilter] = useState("");


const handleRowClick = async (property) => {
  try {
    const res = await API.get(`/api/admin/property/${property._id}`);
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
  // ✅ Reset locality when city changes
  useEffect(() => {
    setLocalityFilter(null);
    setLocalitySearch("");
  }, [cityFilter]);


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
      city: cityFilter,  
      locality: localityFilter,
      sortBy: sortBy,
      imageFilter: imageFilter ,

    }],
    queryFn: fetchProperties,
    keepPreviousData: true,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1500,
  });

  const { data: cityList = [] } = useQuery({
  queryKey: ["cities"],
  queryFn: async () => {
    const { data } = await API.get("/api/admin/cities");
    return data;
  }
});

const { data: localities = [], isFetching: loadingLocalities } = useQuery({
  queryKey: ["localities", cityFilter, localitySearch],
  queryFn: async () => {
    if (!cityFilter) return [];
    const { data } = await API.get("/api/admin/localities", {
      params: { city: cityFilter, q: localitySearch }
    });
    return data;
  },
  enabled: !!cityFilter,
  staleTime: 5 * 60 * 1000
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
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter, propertyTypeFilter, cityFilter,localityFilter, sortBy,imageFilter ]);

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">Failed to load properties. <Button onClick={refetch}>Retry</Button></Typography>;

  return (
    <Box p={3} pt={13}>
      <Typography variant="h4" gutterBottom >
        Admin Dashboard {isFetching && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Typography>

      {/* Filters */}
      <AdminFilters
  search={search}
  setSearch={setSearch}

  propertyTypeFilter={propertyTypeFilter}
  setPropertyTypeFilter={setPropertyTypeFilter}

  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}

  cityFilter={cityFilter}
  setCityFilter={setCityFilter}
  cityList={cityList}

  localityFilter={localityFilter}
  setLocalityFilter={setLocalityFilter}
  localitySearch={localitySearch}
  setLocalitySearch={setLocalitySearch}
  localities={localities}
  loadingLocalities={loadingLocalities}

  imageFilter={imageFilter}
  setImageFilter={setImageFilter}

  sortBy={sortBy}
  setSortBy={setSortBy}
/>


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
