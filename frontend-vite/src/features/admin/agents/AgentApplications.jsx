// features/admin/agents/AgentApplications.jsx
// The admin "Agents" tab: review agent sign-ups (approve / reject) and
// suspend or reinstate agents. Endpoints: GET/PUT /api/admin/agents
// (backend/API_CONTRACT.md). Suspending hides the agent's live listings and
// approving them again brings exactly those back, so both refresh the
// Listings tab too.
import { useState } from "react";
import {
  Box, Tabs, Tab, Table, TableHead, TableBody, TableRow, TableCell, TablePagination,
  Button, Chip, IconButton, Tooltip, Typography, Skeleton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../../api/api";
import toastError from "../../../utils/toastError";
import { AGENT_STATUS } from "../../../constants/roles";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: AGENT_STATUS.PENDING, label: "Pending" },
  { value: AGENT_STATUS.APPROVED, label: "Approved" },
  { value: AGENT_STATUS.REJECTED, label: "Rejected" },
  { value: AGENT_STATUS.SUSPENDED, label: "Suspended" },
];

// Success toast per action; "approve" on a suspended agent is a reinstatement.
const doneMessage = (action, fromStatus) => {
  if (action === "reject") return "Application rejected";
  if (action === "suspend") return "Agent suspended — their live listings are hidden";
  return fromStatus === AGENT_STATUS.SUSPENDED
    ? "Agent reinstated — their listings are live again"
    : "Agent approved";
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy the ${label}`);
  }
};

export default function AgentApplications() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(AGENT_STATUS.PENDING);
  const [page, setPage] = useState(0);
  // { action: "reject" | "suspend", agent } while a confirm dialog is open
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: ["adminAgents", status, page],
    queryFn: async () =>
      (await API.get("/api/admin/agents", { params: { status, page: page + 1, limit: PAGE_SIZE } })).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const review = useMutation({
    mutationFn: ({ agent, action, rejectionReason }) =>
      API.put(`/api/admin/agents/${agent._id}/${action}`, rejectionReason ? { rejectionReason } : {}),
    onSuccess: (_, { agent, action }) => {
      toast.success(doneMessage(action, agent.agent?.status));
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      // Suspend/reinstate change which of their listings are public.
      queryClient.invalidateQueries({ queryKey: ["adminProperties"] });
      setDialog(null);
      setReason("");
    },
    onError: (err) => toastError(err, "Couldn't update the agent"),
  });

  // One action at a time: a second click elsewhere would replace the first
  // one's pending state and re-enable its buttons mid-request.
  const busy = review.isPending;

  const changeStatus = (_, next) => {
    setStatus(next);
    setPage(0);
  };

  const closeDialog = () => {
    if (review.isPending) return;
    setDialog(null);
    setReason("");
  };

  const agents = data?.data ?? [];
  const showReason = status === AGENT_STATUS.REJECTED;

  // Acting on the last agent of a later page empties it; step back instead of
  // stranding the admin on a blank page with no pagination. Skipped while the
  // previous page's data is only a placeholder.
  if (data && !isPlaceholderData && agents.length === 0 && page > 0) {
    setPage(page - 1);
  }

  const renderActions = (agent) => {
    switch (agent.agent?.status) {
      case AGENT_STATUS.PENDING:
        return (
          <>
            <Tooltip title={agent.emailVerified ? "" : "Waiting for the agent to verify their email"}>
              {/* span: a disabled button can't trigger its tooltip */}
              <span>
                <Button
                  size="small" variant="contained" color="success" sx={{ mr: 1 }}
                  disabled={!agent.emailVerified || busy}
                  onClick={() => review.mutate({ agent, action: "approve" })}
                >
                  Approve
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small" variant="outlined" color="error" disabled={busy}
              onClick={() => setDialog({ action: "reject", agent })}
            >
              Reject
            </Button>
          </>
        );
      case AGENT_STATUS.APPROVED:
        return (
          <Button
            size="small" variant="outlined" color="error" disabled={busy}
            onClick={() => setDialog({ action: "suspend", agent })}
          >
            Suspend
          </Button>
        );
      case AGENT_STATUS.REJECTED:
      case AGENT_STATUS.SUSPENDED: {
        const reinstate = agent.agent.status === AGENT_STATUS.SUSPENDED;
        return (
          <Tooltip title={agent.emailVerified ? "" : "Waiting for the agent to verify their email"}>
            <span>
              <Button
                size="small" variant="contained" color="success"
                disabled={!agent.emailVerified || busy}
                onClick={() => review.mutate({ agent, action: "approve" })}
              >
                {reinstate ? "Reinstate" : "Approve"}
              </Button>
            </span>
          </Tooltip>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Box>
      <Tabs value={status} onChange={changeStatus} sx={{ mb: 2 }} aria-label="Agent status">
        {STATUS_TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label} />)}
      </Tabs>

      {isError && !data ? (
        <Alert severity="error" action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
          Failed to load agents.
        </Alert>
      ) : isLoading && !data ? (
        [...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 0.5, borderRadius: 1 }} />
        ))
      ) : agents.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No {STATUS_TABS.find((t) => t.value === status).label.toLowerCase()} agents.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Agency</TableCell>
                <TableCell>RERA agent ID</TableCell>
                <TableCell>Applied</TableCell>
                {showReason && <TableCell>Reason</TableCell>}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{agent.customerName || "—"}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">{agent.customerEmail || "—"}</Typography>
                      <Chip
                        size="small"
                        label={agent.emailVerified ? "Verified" : "Not verified"}
                        color={agent.emailVerified ? "success" : "warning"}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{agent.customerPhone || "—"}</TableCell>
                  <TableCell>{agent.agent?.agencyName || "—"}</TableCell>
                  <TableCell>
                    {agent.agent?.reraAgentId ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <span>{agent.agent.reraAgentId}</span>
                        <IconButton
                          size="small"
                          aria-label={`Copy RERA ID of ${agent.customerName}`}
                          onClick={() => copyText(agent.agent.reraAgentId, "RERA ID")}
                        >
                          <Copy size={14} />
                        </IconButton>
                      </Box>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{formatDate(agent.agent?.appliedAt)}</TableCell>
                  {showReason && <TableCell>{agent.agent?.rejectionReason || "—"}</TableCell>}
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{renderActions(agent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </Box>
      )}

      <Dialog open={dialog?.action === "reject"} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject {dialog?.agent.customerName}&apos;s application</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The agent sees this reason on their profile and can fix it and apply again.
          </Typography>
          <TextField
            label="Reason for rejection"
            placeholder="e.g. RERA agent ID not found on the MahaRERA site"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            required
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained" color="error"
            disabled={!reason.trim() || review.isPending}
            onClick={() => review.mutate({ agent: dialog.agent, action: "reject", rejectionReason: reason.trim() })}
          >
            {review.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog?.action === "suspend"} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Suspend {dialog?.agent.customerName}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Their live listings are hidden from the site and they can&apos;t post. Reinstating them
            brings those listings back.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained" color="error" disabled={review.isPending}
            onClick={() => review.mutate({ agent: dialog.agent, action: "suspend" })}
          >
            {review.isPending ? "Suspending…" : "Suspend"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
