// features/admin/listings/RejectListingDialog.jsx
// Reject one or many listings with a required reason. The reason lives here,
// not in AdminListings, so typing doesn't re-render the whole listings grid.
import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button,
} from "@mui/material";

export default function RejectListingDialog({ open, count = 1, isPending, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  // Start empty each time it opens (render-time reset, no effect needed).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason("");
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{count > 1 ? `Reject ${count} properties` : "Reject property"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The poster sees this reason on their listing, so say what to fix.
        </Typography>
        <TextField
          label="Reason for rejection"
          required
          placeholder="e.g. Missing RERA number, incorrect price…"
          fullWidth
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => onConfirm(trimmed)}
          disabled={isPending || !trimmed}
        >
          {isPending ? "Rejecting…" : "Reject"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
