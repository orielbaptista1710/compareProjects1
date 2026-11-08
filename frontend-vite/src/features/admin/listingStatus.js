// features/admin/listingStatus.js
// Listing review states as the admin screens show them, and which review
// actions each state allows. Shared by the table, the details modal and the
// filters so they can't disagree. Mirrors Property.status in the backend.

export const LISTING_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
});

export const LISTING_STATUS_LABELS = Object.freeze({
  [LISTING_STATUS.PENDING]: "Pending",
  [LISTING_STATUS.APPROVED]: "Approved",
  [LISTING_STATUS.REJECTED]: "Rejected",
  [LISTING_STATUS.SUSPENDED]: "Hidden (agent suspended)",
});

export const LISTING_STATUS_COLORS = Object.freeze({
  [LISTING_STATUS.PENDING]: "warning",
  [LISTING_STATUS.APPROVED]: "success",
  [LISTING_STATUS.REJECTED]: "error",
  [LISTING_STATUS.SUSPENDED]: "default",
});

export const isListingStatus = (value) => Object.values(LISTING_STATUS).includes(value);

// Approving a hidden listing changes nothing until the agent is reinstated
// (Agents tab), so it isn't offered.
export const SUSPENDED_APPROVE_HINT = "Hidden while the posting agent is suspended. Reinstate the agent in the Agents tab.";

export const canApprove = (status) => status !== LISTING_STATUS.APPROVED && status !== LISTING_STATUS.SUSPENDED;
export const canReject = (status) => status !== LISTING_STATUS.REJECTED;
