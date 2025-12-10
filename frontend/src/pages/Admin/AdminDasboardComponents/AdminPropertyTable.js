// src/components/Admin/AdminPropertyTable.js
import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, Button, CircularProgress
} from "@mui/material";

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

  return (
    <>
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No properties found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((prop) => (
                <TableRow
                  key={prop._id}
                  hover
                  sx={{
                    cursor: "pointer",
                    backgroundColor: getRowColor(prop.status),
                  }}
                  onClick={() => onRowClick(prop)}
                >
                  <TableCell>{prop.title || "N/A"}</TableCell>
                  <TableCell>{prop.developerName || "N/A"}</TableCell>
                  <TableCell>{prop.propertyType || "N/A"}</TableCell>
                  <TableCell>{Number(prop.price)?.toLocaleString("en-IN") || "N/A"}</TableCell>
                  <TableCell>{prop.status}</TableCell>
                  <TableCell>
                    {prop.submittedAt
                      ? new Date(prop.submittedAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {(prop.status === "approved" || prop.status === "rejected") &&
                    prop.reviewedAt
                      ? new Date(prop.reviewedAt).toLocaleString()
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={prop.status === "approved" || approveMutation.isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(prop._id);
                      }}
                    >
                      {approveMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        "Approve"
                      )}
                    </Button>

                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      disabled={prop.status === "rejected" || rejectMutation.isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReject(prop._id);
                      }}
                    >
                      {rejectMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Math.min(parseInt(e.target.value, 10), 100));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </>
  );
}
