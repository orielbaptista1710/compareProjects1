import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination, TextField, Select,
  MenuItem, Button, CircularProgress, Stack, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import debounce from "lodash.debounce";

// Fetch properties
const fetchProperties = async ({ queryKey }) => {
  const [_key, filters] = queryKey;
  const params = {
    _page: filters.page,
    _limit: filters.limit,
    status: filters.status,
    // developerId: filters.developerId,
    propertyType: filters.propertyType,
    q: filters.search,
    _sort: "submittedAt",
    _order: "DESC",
  };
  const { data } = await axios.get("/api/admin/properties", { params });
  return data;
};

// Fetch all developers
// const fetchDevelopers = async () => {
//   const { data } = await axios.get("/api/admin/developers");
//   return data; // [{_id, name}]
// };

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
  // const [developerFilter, setDeveloperFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceSearch = useCallback(debounce((val) => setDebouncedSearch(val), 500), []);
  useEffect(() => { debounceSearch(search); }, [search, debounceSearch]);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Reject Modal
  const [rejectModal, setRejectModal] = useState({ open: false, propertyId: null, reason: "" });

  // Fetch developers
  // const { data: developers = [], isLoading: loadingDevelopers } = useQuery({
  //   queryKey: ["developers"],
  //   queryFn: fetchDevelopers,
  //   staleTime: 60000,
  // });

  // Fetch properties
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["properties", {
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter,
      // developerId: developerFilter,
      propertyType: propertyTypeFilter,
      search: debouncedSearch,
    }],
    queryFn: fetchProperties,
    keepPreviousData: true,
    staleTime: 30000,
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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard {isFetching && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Typography>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />

        {/* <Select
          value={developerFilter}
          onChange={(e) => setDeveloperFilter(e.target.value)}
          displayEmpty
          disabled={loadingDevelopers}
        >
          <MenuItem value="">All Developers</MenuItem>
          {developers.map((dev) => (
            <MenuItem key={dev._id} value={dev._id}>
              {dev.name}
            </MenuItem>
          ))}
        </Select> */}

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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Developer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Reviewed At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No properties found</TableCell></TableRow>
            ) : (
              data.data.map((prop) => (
                <TableRow key={prop._id}>
                  <TableCell>{prop.title || "N/A"}</TableCell>
                  <TableCell>{prop.developerName || "N/A"}</TableCell>
                  <TableCell>{prop.propertyType || "N/A"}</TableCell>
                  <TableCell>{prop.price != null ? prop.price.toLocaleString() : "N/A"}</TableCell>
                  <TableCell>{prop.status}</TableCell>
                  <TableCell>{prop.submittedAt ? new Date(prop.submittedAt).toLocaleString() : "N/A"}</TableCell>
                  <TableCell>{(prop.status === "approved" || prop.status === "rejected") && prop.reviewedAt ? new Date(prop.reviewedAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={prop.status==="approved" || approveMutation.isLoading}
                      onClick={()=>handleApprove(prop._id)}
                      sx={{mr:1}}
                    >
                      {approveMutation.isLoading ? <CircularProgress size={16} /> : "Approve"}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      disabled={prop.status==="rejected" || rejectMutation.isLoading}
                      onClick={()=>handleOpenReject(prop._id)}
                    >
                      {rejectMutation.isLoading ? <CircularProgress size={16} /> : "Reject"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={data.total}
        page={page}
        onPageChange={(_, newPage)=>setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e)=>{setRowsPerPage(Math.min(parseInt(e.target.value,10),100)); setPage(0);}}
        rowsPerPageOptions={[10,20,50,100]}
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
