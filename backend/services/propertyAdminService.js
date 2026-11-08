//backend/services/propertyAdminService.js

import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import { AGENT_STATUS, LISTED_BY, OWNER_MODEL } from '../constants/roles.js';
import { invalidatePropertyCaches } from '../utils/propertyCache.js';
import logger from '../utils/logger.js';
/**
 * Fetch paginated properties for Admin Dashboard
 * - Safe pagination
 * - Composable filters (search + image filters work together)
 * - Predictable sorting
 * - Lean projection for performance
 */

// Poster name for the admin views; userId points to a User (developer) or a
// Customer (owner/agent) depending on Property.ownerModel.
const POSTER_FIELDS = "displayName companyName customerName customerEmail agent.status agent.agencyName";
// The details view also needs how to reach and verify the poster.
const POSTER_DETAIL_FIELDS =
  `${POSTER_FIELDS} email phone customerPhone emailVerified agent.reraAgentId`;

// Admins decide approve/reject; "pending" is only ever set by an owner edit.
const REVIEW_STATUSES = ["approved", "rejected"];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const fetchProperties = async ({
  page = 1,
  limit = 20,
  status,
  propertyType, 
  city,
  locality,
  search,
  sortBy = "latest",
  imageFilter,
  listedBy,
}) => {

  /* --------------------------------------------------
   * 1. SANITIZE & PROTECT PAGINATION
   * -------------------------------------------------- */
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20); // prevent abuse
  const skip = (page - 1) * limit;

  /* --------------------------------------------------
   * 2. BASE FILTER (simple equality filters)
   * -------------------------------------------------- */
  const filter = {};
  const andConditions = []; // used to safely combine $or conditions

  if (status) filter.status = status;
  if (city) filter.city = city;
  if (locality) filter.locality = locality;
  if (propertyType) filter.propertyType = propertyType;
  if (listedBy === LISTED_BY.DEVELOPER) {
    // Developer listings saved before listedBy existed have none. Owner and
    // agent listings always have it, so anything unlabelled that wasn't posted
    // from a customer account is a developer listing.
    andConditions.push({
      $or: [
        { listedBy: LISTED_BY.DEVELOPER },
        { listedBy: null, ownerModel: { $ne: OWNER_MODEL.CUSTOMER } },
      ],
    });
  } else if (listedBy) {
    filter.listedBy = listedBy;
  }

  /* --------------------------------------------------
   * 3. SEARCH FILTER (case-insensitive, safe length)
   * -------------------------------------------------- */
  if (search && search.length <= 50) {
  const safeSearch = escapeRegex(search);
  andConditions.push({
    $or: [
      { title: { $regex: safeSearch, $options: "i" } },
      { developerName: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
      { long_description: { $regex: safeSearch, $options: "i" } },
    ],
  });
}

  /* --------------------------------------------------
   * 4. IMAGE FILTERS (robust + null-safe)
   * -------------------------------------------------- */
  if (imageFilter === "withImages") {
    // Has either cover image OR gallery images
    andConditions.push({
      $or: [
        { "coverImage.url": { $exists: true, $ne: "" } },
        { galleryImages: { $exists: true, $ne: [] } },
      ],
    });
  }

  if (imageFilter === "withoutImages") {
    // No cover image AND no gallery images
    andConditions.push({
      $and: [
        { "coverImage.url": { $in: [null, ""] } },
        {
          $or: [
            { galleryImages: { $exists: false } },
            { galleryImages: { $size: 0 } },
          ],
        },
      ],
    });
  }

  if (imageFilter === "coverOnly") {
    andConditions.push({
      $and: [
        { "coverImage.url": { $exists: true, $ne: "" } },
        {
          $or: [
            { galleryImages: { $exists: false } },
            { galleryImages: { $size: 0 } },
          ],
        },
      ],
    });
  }

  if (imageFilter === "galleryOnly") {
    andConditions.push({
      $and: [
        { galleryImages: { $exists: true, $ne: [] }},
        { "coverImage.url": { $in: [null, ""] } },
      ],
    });
  }

  // Attach AND conditions only if they exist
  if (andConditions.length) {
    filter.$and = andConditions;
  }

  /* --------------------------------------------------
   * 5. SORTING (explicit & predictable)
   * -------------------------------------------------- */
  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceHigh: { price: -1 },
    priceLow: { price: 1 },
    mostViewed: { 'metadata.analytics.viewCount': -1 },
  };

  const sort = sortMap[sortBy] || sortMap.latest;

  /* --------------------------------------------------
   * 6. ADMIN LIST PROJECTION (performance-first)
   * -------------------------------------------------- */
  const LIST_PROJECTION = {
    title: 1,
    developerName: 1,
    propertyType: 1,
    price: 1,
    state: 1,
    city: 1,
    locality: 1,
    status: 1,
    submittedAt: 1,
    reviewedAt: 1,
    reviewedBy: 1,
    "coverImage.url": 1,
    "coverImage.thumbnail": 1, //add galleryImages??
    userId: 1,
    ownerModel: 1, // needed by populate("userId") to pick User vs Customer
    listedBy: 1,
    listingType: 1,
    views: 1,
    createdAt: 1,
  };

  /* --------------------------------------------------
   * 7. PARALLEL QUERY (count + data)
   * -------------------------------------------------- */
  const [total, properties] = await Promise.all([
    Property.countDocuments(filter),
    Property.find(filter)
      .select(LIST_PROJECTION)
      .populate("userId", POSTER_FIELDS)
      // .populate("reviewedBy", "displayName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { data: properties, total };
};

/* --------------------------------------------------
 * Fetch just a property's owner (Admin self-review check)
 * -------------------------------------------------- */
export const fetchPropertyOwner = async (id) => {
  return await Property.findById(id).select('userId').lean();
};

/* --------------------------------------------------
 * Fetch full property details (Admin view)
 * -------------------------------------------------- */
export const fetchPropertyById = async (id) => {
  const property = await Property.findById(id)
    .populate("userId", POSTER_DETAIL_FIELDS)
    // .populate("reviewedBy", "displayName")
    .lean();

  return property; // null if not found — caller decides the response
};

/* --------------------------------------------------
 * Review update shared by single + bulk: sets the latest decision and appends
 * it to reviewHistory (last 20 kept), so every decision leaves a trace.
 * -------------------------------------------------- */
// storedStatus: what the listing's status becomes. Usually the decision itself;
// an approved listing of a suspended agent is stored as 'suspended' (hidden).
const buildReviewUpdate = (status, adminId, rejectionReason, storedStatus = status) => {
  const at = new Date();
  const reason = status === "rejected" ? (rejectionReason || "").trim().slice(0, 500) : undefined;

  return {
    $set: {
      status: storedStatus,
      reviewedBy: adminId,
      reviewedAt: at,
      ...(reason !== undefined && { rejectionReason: reason }),
    },
    $push: {
      reviewHistory: {
        $each: [{ action: status, by: adminId, at, ...(reason && { reason }) }],
        $slice: -20,
      },
    },
  };
};

/* --------------------------------------------------
 * Listings that must stay hidden even when approved: already hidden by an
 * agent suspension, or posted by an agent who is suspended right now. They
 * only go live when the agent is reinstated (agentAdminService).
 * -------------------------------------------------- */
const findHeldListingIds = async (listings) => {
  const customerOwnerIds = listings
    .filter((p) => p.ownerModel === OWNER_MODEL.CUSTOMER)
    .map((p) => p.userId);
  const suspendedOwners = customerOwnerIds.length
    ? await Customer.find({ _id: { $in: customerOwnerIds }, "agent.status": AGENT_STATUS.SUSPENDED })
        .select("_id")
        .lean()
    : [];
  const suspended = new Set(suspendedOwners.map((c) => String(c._id)));

  return new Set(
    listings
      .filter((p) => p.status === "suspended" || suspended.has(String(p.userId)))
      .map((p) => String(p._id))
  );
};

/* --------------------------------------------------
 * A decision that's already been made isn't made again: re-approving an
 * approved (or approved-but-hidden 'suspended') listing, or re-rejecting a
 * rejected one, would only re-stamp reviewedBy/At and push a duplicate into
 * reviewHistory (capped at 20, so real decisions fall out). Enforced in the
 * update filter itself, so it also holds for two admins clicking at once.
 * -------------------------------------------------- */
const ALREADY_DECIDED = {
  approved: ["approved", "suspended"],
  rejected: ["rejected"],
};

/* --------------------------------------------------
 * Update property status (approve / reject)
 * @returns {{ property } | { error: 'not_found' } | { error: 'already_reviewed', status }}
 * -------------------------------------------------- */
export const updatePropertyStatus = async (
  id,
  status,
  adminId,
  rejectionReason = null
) => {
  if (!REVIEW_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  const existing = await Property.findById(id).select("status ownerModel userId").lean();
  if (!existing) return { error: "not_found" };
  if (ALREADY_DECIDED[status].includes(existing.status)) {
    return { error: "already_reviewed", status: existing.status };
  }

  const held = status === "approved" && (await findHeldListingIds([existing])).size > 0;
  const property = await Property.findOneAndUpdate(
    { _id: id, status: { $nin: ALREADY_DECIDED[status] } },
    buildReviewUpdate(status, adminId, rejectionReason, held ? "suspended" : status),
    { new: true }
  );
  if (!property) {
    // Decided (or deleted) between the read above and this update.
    const now = await Property.findById(id).select("status").lean();
    return now ? { error: "already_reviewed", status: now.status } : { error: "not_found" };
  }

  invalidatePropertyCaches();
  logger.info("Listing reviewed", { action: status, adminId: String(adminId), propertyIds: [String(id)] });
  return { property };
};

/* --------------------------------------------------
 * Bulk update property status (approve / reject many)
 * -------------------------------------------------- */
export const bulkUpdatePropertyStatus = async (
  ids,
  status,
  adminId,
  rejectionReason = null
) => {
  if (!REVIEW_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  const validIds = [...new Set(ids)]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, 100);

  if (!validIds.length) {
    return { matched: 0, modified: 0 };
  }

  // Exclude properties the reviewer submitted themselves — no self-approval/
  // rejection, same as the single approve/reject path. Silently dropped from
  // the batch rather than failing it, consistent with how malformed/duplicate/
  // nonexistent ids are already handled above.
  // Listings already in that decision are skipped too (see ALREADY_DECIDED).
  const reviewable = await Property.find({
    _id: { $in: validIds },
    userId: { $ne: adminId },
    status: { $nin: ALREADY_DECIDED[status] },
  })
    .select("_id status ownerModel userId")
    .lean();
  const reviewableIds = reviewable.map((p) => p._id);

  if (!reviewableIds.length) {
    return { matched: 0, modified: 0 };
  }

  // Approving a suspended agent's listings records the approval but keeps
  // them hidden until the agent is reinstated.
  const held = status === "approved" ? await findHeldListingIds(reviewable) : new Set();
  const heldIds = reviewableIds.filter((pid) => held.has(String(pid)));
  const liveIds = reviewableIds.filter((pid) => !held.has(String(pid)));

  const notDecided = { status: { $nin: ALREADY_DECIDED[status] } };
  const [live, hidden] = await Promise.all([
    liveIds.length
      ? Property.updateMany({ _id: { $in: liveIds }, ...notDecided }, buildReviewUpdate(status, adminId, rejectionReason))
      : { matchedCount: 0, modifiedCount: 0 },
    heldIds.length
      ? Property.updateMany({ _id: { $in: heldIds }, ...notDecided }, buildReviewUpdate(status, adminId, rejectionReason, "suspended"))
      : { matchedCount: 0, modifiedCount: 0 },
  ]);
  const result = {
    matchedCount: live.matchedCount + hidden.matchedCount,
    modifiedCount: live.modifiedCount + hidden.modifiedCount,
  };
  if (result.modifiedCount) {
    invalidatePropertyCaches();
    logger.info("Listings bulk-reviewed", {
      action: status,
      adminId: String(adminId),
      propertyIds: reviewableIds.map(String),
    });
  }

  return { matched: result.matchedCount, modified: result.modifiedCount, hidden: heldIds.length };
};


  /* --------------------------------------------------
 * Fetch distinct cities (Admin)
 * -------------------------------------------------- */
export const fetchCities = async () => {
  return await Property.distinct("city", {
    city: { $nin: [null, ""] }
  });
};

/* --------------------------------------------------
 * Fetch distinct localities by city (Admin)
 * -------------------------------------------------- */
export const fetchLocalities = async ({ city, q = "" }) => {
  if (!city) return [];

  return await Property.distinct("locality", {
    city,
    locality: { $regex: escapeRegex(q), $options: "i" }
  });
};
