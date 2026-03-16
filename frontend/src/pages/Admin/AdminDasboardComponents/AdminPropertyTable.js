// src/components/Admin/AdminPropertyTable.js
import React from "react";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import "./AdminPropertyTable.css";

export default function AdminPropertyTable({
  data,
  page,
  rowsPerPage,
  setPage,
  setRowsPerPage,
  handleApprove,
  handleOpenReject,
  approveMutation,
  rejectMutation,
  onRowClick
}) {
  if (!data) return <p style={{ padding: 20 }}>No data</p>;

  const rows = data?.data || [];

  const getRowColor = (status) => {
    if (status === "approved") return "#E8F5E9";
    if (status === "rejected") return "#FFEBEE";
    if (status === "pending") return "#FFFDE7";
    return "transparent";
  }; 


  const columns = [
  { field: "title", headerName: "Title", flex: 1 },

  {
  field: "developerName",
  headerName: "Developer",
  flex: 1,
  valueGetter: (value, row) => row?.developerName || "N/A"
},

  {
    field: "location",
    headerName: "Location",
    flex: 1,
    valueGetter: (value, row) => `${row?.city || ""}, ${row?.locality || ""}`
  },

  { field: "propertyType", headerName: "Type", flex: 1 },

  {
    field: "price",
    headerName: "Price",
    flex: 1,
    valueGetter: (value, row) =>
    row?.price
      ? Number(row.price).toLocaleString("en-IN")
      : "N/A"
  },

  { field: "status", headerName: "Status", flex: 1 },

  {
    field: "submittedAt",
    headerName: "Submitted",
    flex: 1,
    valueGetter: (value, row) =>
    row?.submittedAt
      ? new Date(row.submittedAt).toLocaleString()
      : "N/A"
  },

  {
    field: "reviewedAt",
    headerName: "Reviewed",
    flex: 1,
    valueGetter: (value, row) =>
    row?.reviewedAt
      ? new Date(row.reviewedAt).toLocaleString()
      : "-"
  },

  {
    field: "actions",
    headerName: "Actions",
    sortable: false,
    renderCell: (params) => {
      const prop = params.row;

      return (
        <>
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={prop.status === "approved" || approveMutation.isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(prop._id);
            }}
            sx={{ mr: 1 }}
          >
            Approve
          </Button>

          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={prop.status === "rejected"|| rejectMutation.isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReject(prop._id);
            }}
          >
            Reject
          </Button>
        </>
      );
    }
  }
];

  return ( 
    <>
      <DataGrid
  rows={rows}
  columns={columns}
  getRowId={(row) => row._id}
  rowCount={data?.total || 0}
  paginationMode="server"
  paginationModel={{ page, pageSize: rowsPerPage }}
  onPaginationModelChange={(model) => {
    setPage(model.page);
    setRowsPerPage(model.pageSize);
  }}
  pageSizeOptions={[10, 20, 50, 100]}
  disableRowSelectionOnClick
  loading={approveMutation.isLoading || rejectMutation.isLoading}
  getRowClassName={(params) => {
    if (params.row.status === "approved") return "row-approved";
    if (params.row.status === "rejected") return "row-rejected";
    if (params.row.status === "pending") return "row-pending";
    return "";
  }}
  onRowClick={(params) => onRowClick(params.row)}
  autoHeight
/>

    </>
  );
}
