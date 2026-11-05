// src/components/Admin/AdminPropertyTable.js
import { useMemo } from "react";
import { Button, Chip, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  SUSPENDED_APPROVE_HINT,
  isListingStatus,
  canApprove,
  canReject,
} from "../listingStatus";
import { posterLabel, posterName } from "../poster";
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
  onRowClick,
  selectionModel,
  onSelectionModelChange,
}) {
  const rows = data?.data || [];

  const columns = useMemo(() => [
    { field: "title", headerName: "Title", flex: 1 },

    {
      field: "postedBy",
      headerName: "Posted by",
      flex: 1,
      sortable: false,
      valueGetter: (value, row) => `${posterLabel(row)} · ${posterName(row)}`
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

    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={LISTING_STATUS_LABELS[value] ?? value}
          color={LISTING_STATUS_COLORS[value] ?? "default"}
          variant="outlined"
        />
      ),
    },

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

        // Mutations are shared across the whole table (one useMutation per
        // action), so scope pending/disabled state to the row actually being
        // mutated via `.variables` (the arg passed to .mutate(...)) rather
        // than disabling every row while any one row is in flight.
        const isApprovingThis =
          approveMutation.isPending && approveMutation.variables === prop._id;
        const isRejectingThis =
          rejectMutation.isPending && rejectMutation.variables?.id === prop._id;

        return (
          <>
            <Tooltip title={prop.status === LISTING_STATUS.SUSPENDED ? SUSPENDED_APPROVE_HINT : ""}>
              {/* span: a disabled button can't trigger its tooltip */}
              <span>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  disabled={!canApprove(prop.status) || isApprovingThis}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(prop._id);
                  }}
                  sx={{ mr: 1 }}
                >
                  {isApprovingThis ? "Approving…" : "Approve"}
                </Button>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={!canReject(prop.status) || isRejectingThis}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReject(prop._id);
              }}
            >
              {isRejectingThis ? "Rejecting…" : "Reject"}
            </Button>
          </>
        );
      }
    }
  ], [handleApprove, handleOpenReject, approveMutation, rejectMutation]);

  if (!data) return <p style={{ padding: 20 }}>No data</p>;

  return (
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
      checkboxSelection
      // "Select all" otherwise reports { type: "exclude", ids: [] } ("all but
      // none"), which the bulk bar reads as 0 selected; list the ids instead.
      disableRowSelectionExcludeModel
      rowSelectionModel={selectionModel}
      onRowSelectionModelChange={onSelectionModelChange}
      // admin-row-pending / -approved / -rejected / -suspended (AdminPropertyTable.css);
      // prefixed because route CSS stays loaded across the whole SPA.
      getRowClassName={(params) => (isListingStatus(params.row.status) ? `admin-row-${params.row.status}` : "")}
      onRowClick={(params) => onRowClick(params.row)}
      autoHeight
    />
  );
}
