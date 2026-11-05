// features/admin/listingStatus.js
// Listing review states as the admin screens show them, and which review
// actions each state allows. Shared by the table, the details modal and the
// filters so they can't disagree.

export const LISTING_STATUS_LABELS = Object.freeze({
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Hidden (agent suspended)",
});

export const LISTING_STATUS_COLORS = Object.freeze({
  pending: "warning",
  approved: "success",
  rejected: "error",
  suspended: "default",
});

// Approving a hidden listing changes nothing until the agent is reinstated
// (Agents tab), so it isn't offered.
export const SUSPENDED_APPROVE_HINT = "Hidden while the posting agent is suspended. Reinstate the agent in the Agents tab.";

export const canApprove = (status) => status !== "approved" && status !== "suspended";
export const canReject = (status) => status !== "rejected";
