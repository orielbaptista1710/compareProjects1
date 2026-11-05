// features/admin/poster.js
// Who posted a listing, as the admin screens show it. The admin API populates
// listing.userId with the poster: a developer (User) or an owner/agent
// (Customer), see backend/services/propertyAdminService.js.
import { POSTER, POSTER_LABELS, posterOf } from "../../constants/roles";

export const posterLabel = (listing) => POSTER_LABELS[posterOf(listing)];

export const posterName = (listing) => {
  const poster = listing?.userId ?? {};
  switch (posterOf(listing)) {
    case POSTER.BUILDER:
      return listing.developerName || poster.companyName || poster.displayName || "—";
    case POSTER.AGENT:
      return poster.agent?.agencyName || poster.customerName || "—";
    default:
      return poster.customerName || "—";
  }
};
