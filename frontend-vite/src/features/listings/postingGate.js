// src/features/listings/postingGate.js
//
// Who a customer account posts as, and whether it may post right now. This only
// mirrors backend/middleware/listingOwner.js (customerListingOwner and
// customerCanPost) so people get a clear message instead of a failed save. The
// backend is what actually enforces it, so keep the two in the same order.
import { AGENT_STATUS, LISTED_BY } from "../../constants/roles";

// An admin-approved agent posts as an agent; every other customer as an owner.
// Only picks the form layout. The server decides listedBy itself.
export const posterRoleOf = (customer) =>
  customer?.agent?.status === AGENT_STATUS.APPROVED ? LISTED_BY.AGENT : LISTED_BY.OWNER;

// null when the account may create and edit listings; otherwise what to tell
// them. Viewing and deleting your own listings is always allowed, so only the
// Post tab uses this.
export const getPostingGate = (customer) => {
  if (!customer?.emailVerified) {
    return {
      title: "Verify your email to post",
      text: "We need a verified email address before a listing can be submitted. Check your inbox for the verification link.",
    };
  }
  switch (customer.agent?.status) {
    case AGENT_STATUS.SUSPENDED:
      return {
        title: "Your agent account is suspended",
        text: "You can't post or edit listings right now. Contact support to restore access.",
      };
    case AGENT_STATUS.PENDING:
      return {
        title: "Your agent account is awaiting approval",
        text: "We're verifying your RERA registration. You can post listings as soon as you're approved.",
      };
    case AGENT_STATUS.REJECTED:
      return {
        title: "Your agent application wasn't approved",
        text: customer.agent.rejectionReason
          || "Update your details and re-apply from your profile to start posting.",
        toProfile: true,
      };
    default:
      return null;
  }
};
