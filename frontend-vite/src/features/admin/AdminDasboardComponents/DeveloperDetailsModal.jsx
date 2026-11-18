import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography, 
  Box,
  Button,
  Stack,
  Divider,
  Chip,
  Skeleton,
} from "@mui/material";

import { formatCurrency, fmtDate } from "../../../utils/formatters";
import { POSTER, posterOf } from "../../../constants/roles";
import { posterLabel, posterName } from "../poster";
import { LISTING_STATUS, LISTING_STATUS_LABELS, LISTING_STATUS_COLORS } from "../listingStatus";
import { describeChangedFields } from "../changedFields";
import { floorText } from "../../listings/floor";

import PropertyMediaSection from "./PropertyMediaSection";

const FALLBACK_IMAGE = "https://placehold.co/600x400/EBEBEB/555/png?text=No+image";

const Section = ({ title, children }) => (
  <Box mb={3}>
    <Typography variant="h6" color="primary" gutterBottom>
      {title}
    </Typography>
    <Box>{children}</Box>
    <Divider sx={{ mt: 2 }} />
  </Box>
);

function safeUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url, window.location.origin);
    // only allow http/https
    if ( u.protocol === "https:") return u.toString();
        //u.protocol === "http:" || why need to add is http not as secure
  } catch {
    return null;
  }
  return null;
}


function formatArea(area) {
  if (!area || (area.value == null && !area.unit)) return "N/A";
  const value = area?.value ?? "N/A";
  const unit = area?.unit ?? "";
  return `${value} ${unit}`;
}

// floor 0 is the ground floor, not "missing"; -1 is B1
const formatFloor = (floor) => (floor == null || floor === "" ? "N/A" : floorText(floor));

const formatWhen = (value) => (value ? new Date(value).toLocaleString("en-IN") : "N/A");

// reviewHistory entries: { action, by: { displayName } | id | null, at, reason }.
// `by` is an id only when the reviewer's account no longer exists.
const reviewerName = (entry) => (typeof entry?.by === "object" && entry.by?.displayName) || "an admin";

// Newest first. The backend keeps the last 20 decisions.
const historyNewestFirst = (property) =>
  Array.isArray(property?.reviewHistory) ? [...property.reviewHistory].reverse() : [];

// A pending listing the poster edited after it had been reviewed: say so, say
// what changed, and remind the reviewer what was decided last time.
const EditedNotice = ({ property }) => {
  const changed = describeChangedFields(property?.changedFields);
  const last = historyNewestFirst(property)[0];

  return (
    <Box
      role="note"
      sx={{ mb: 3, p: 2, borderRadius: 1, border: 1, borderColor: "info.main", bgcolor: "action.hover" }}
    >
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Edited listing: check what changed
      </Typography>
      <Typography variant="body2" sx={{ mb: changed.length ? 1 : 0 }}>
        The poster edited this listing on {formatWhen(property.lastEditedAt)}, after an earlier review.
      </Typography>
      {changed.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 1 }} aria-label="Changed fields">
          {changed.map(({ key, label, priority }) => (
            <Chip
              key={key}
              size="small"
              label={label}
              color={priority ? "warning" : "default"}
              variant={priority ? "filled" : "outlined"}
            />
          ))}
        </Stack>
      )}
      {last && (
        <Typography variant="body2" color="text.secondary">
          Last decision: {LISTING_STATUS_LABELS[last.action] ?? last.action} by {reviewerName(last)} on{" "}
          {formatWhen(last.at)}
          {last.reason ? `. Reason: ${last.reason}` : ""}
        </Typography>
      )}
    </Box>
  );
};

const ReviewHistory = ({ property }) => {
  const entries = historyNewestFirst(property);
  if (!entries.length) return <Typography>No decisions yet.</Typography>;

  return (
    <Stack component="ol" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {entries.map((entry, i) => (
        <Typography component="li" variant="body2" key={`${entry.at}-${i}`}>
          <strong>{LISTING_STATUS_LABELS[entry.action] ?? entry.action}</strong> by {reviewerName(entry)} on{" "}
          {formatWhen(entry.at)}
          {entry.reason ? `. Reason: ${entry.reason}` : ""}
        </Typography>
      ))}
    </Stack>
  );
};

// Who posted the listing and how to reach them. userId is the populated
// poster: a developer (User) or an owner/agent (Customer).
const PosterDetails = ({ property }) => {
  const poster = property?.userId ?? {};
  const kind = posterOf(property);

  if (kind === POSTER.BUILDER) {
    return (
      <Stack direction="row" spacing={3} alignItems="center">
        <Box
          component="img"
          src={property?.developerAvatar?.url || FALLBACK_IMAGE}
          alt={property?.developerName || "developer avatar"}
          width={80}
          height={80}
          sx={{ borderRadius: 1, objectFit: "cover" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        <Box>
          <Typography><strong>Developer:</strong> {posterName(property)}</Typography>
          <Typography><strong>Tier:</strong> {property?.tierType || "N/A"}</Typography>
          {poster.displayName && (
            <Typography><strong>Account:</strong> {poster.displayName}</Typography>
          )}
          {poster.email && <Typography><strong>Email:</strong> {poster.email}</Typography>}
          {poster.phone && <Typography><strong>Phone:</strong> {poster.phone}</Typography>}
        </Box>
      </Stack>
    );
  }

  const isAgent = kind === POSTER.AGENT;
  return (
    <Box>
      <Typography>
        <strong>{posterLabel(property)}:</strong> {poster.customerName || "N/A"}
      </Typography>
      {isAgent && (
        <>
          <Typography><strong>Agency:</strong> {poster.agent?.agencyName || "N/A"}</Typography>
          <Typography><strong>RERA agent ID:</strong> {poster.agent?.reraAgentId || "N/A"}</Typography>
          <Typography><strong>Agent status:</strong> {poster.agent?.status || "N/A"}</Typography>
        </>
      )}
      <Typography component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span><strong>Email:</strong> {poster.customerEmail || "N/A"}</span>
        {poster.customerEmail && (
          <Chip
            size="small"
            variant="outlined"
            label={poster.emailVerified ? "Verified" : "Not verified"}
            color={poster.emailVerified ? "success" : "warning"}
          />
        )}
      </Typography>
      <Typography><strong>Phone:</strong> {poster.customerPhone || "N/A"}</Typography>
    </Box>
  );
};

function DeveloperDetailsModal({
  open,
  onClose,
  property,
  loading = false,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}) {
  // Memoized safe links
  const safeMapLink = useMemo(() => safeUrl(property?.mapLink), [property]);

  // If loading, show skeleton instead of null
  if (!property && !loading) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="developer-details-title"
    >
      <DialogTitle id="developer-details-title">
        {loading ? <Skeleton width={300} /> : `Property Verification — ${property?.title || "Untitled"}`}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, maxHeight: "70vh", overflowY: "auto" }}>
        {/* An edit, not a new listing */}
        {!loading && property?.status === LISTING_STATUS.PENDING && property?.lastEditedAt && (
          <EditedNotice property={property} />
        )}

        {/* Who posted it */}
        <Section title="Posted by">
          {loading ? (
            <Stack direction="row" spacing={3} alignItems="center">
              <Skeleton variant="circular" width={80} height={80} />
              <Box>
                <Skeleton width={180} height={26} />
                <Skeleton width={120} height={20} />
                <Skeleton width={200} height={20} />
              </Box>
            </Stack>
          ) : (
            <PosterDetails property={property} />
          )}
        </Section>

        {/* Property Information */}
        <Section title="Property Information">
          {loading ? (
            <>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
              <Skeleton width="30%" />
              <Skeleton width="80%" />
              <Skeleton width="90%" />
            </>
          ) : (
            <>
              <Typography>
                <strong>Title:</strong> {property?.title || "N/A"}
              </Typography>
              <Typography>
                <strong>Type:</strong> {property?.propertyType || "N/A"}
              </Typography>
              <Typography>
                <strong>BHK:</strong> {property?.bhk ?? "N/A"}
              </Typography>
              <Typography>
                <strong>Furnishing:</strong> {property?.furnishing || "N/A"}
              </Typography>
              <Typography>
                <strong>Price:</strong> {formatCurrency(property?.price)}
              </Typography>
              <Typography>
                <strong>Area:</strong> {formatArea(property?.area)}
              </Typography>
              <Typography>
                <strong>RERA:</strong>{" "}
                {property?.reraApproved ? `Yes (${property?.reraNumber || "N/A"})` : "No"}
              </Typography>
              {property?.long_description ? (
                <Box mt={1}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {property.long_description}
                  </Typography>
                </Box>
              ) : (
                <Box mt={1}>
                  <Typography>
                    <strong>Brief Description:</strong> {property?.description || "N/A"}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Section>

        {/* Location */}
        <Section title="Location">
          {loading ? (
            <>
              <Skeleton width="40%" />
              <Skeleton width="40%" />
              <Skeleton width="40%" />
              <Skeleton width="80%" />
              <Skeleton width="30%" />
            </>
          ) : (
            <>
              <Typography>
                <strong>State:</strong> {property?.state || "N/A"}
              </Typography>
              <Typography>
                <strong>City:</strong> {property?.city || "N/A"}
              </Typography>
              <Typography>
                <strong>Locality:</strong> {property?.locality || "N/A"}
              </Typography>
              <Typography>
                <strong>Address:</strong> {property?.address || "N/A"}
              </Typography>
              <Typography>
                <strong>Pincode:</strong> {property?.pincode ?? "N/A"}
              </Typography>
              <Typography>
                <strong>Completion date:</strong> {fmtDate(property?.reraDate)}
              </Typography>

              {safeMapLink && (
                <Typography>
                  <strong>Map:</strong>{" "}
                  <a href={safeMapLink} target="_blank" rel="noopener noreferrer">
                    Open Map
                  </a>
                </Typography>
              )}

              <Typography mt={1}>
                <strong>Coordinates:</strong>{" "}
                {property?.coordinates?.lat != null && property?.coordinates?.lng != null
                  ? `${property.coordinates.lat}, ${property.coordinates.lng}`
                  : "N/A"}
              </Typography>

              <Box mt={1}>
                <Typography>
                  <strong>Nearby Landmarks:</strong>
                </Typography>
                {property?.landmarks?.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
                    {property.landmarks.map((l, i) => (
                      <Chip key={i} label={l.name || "Unknown"} sx={{ mr: 1, mt: 1 }} />
                    ))}
                  </Stack>
                ) : (
                  <Typography mt={1}>None</Typography>
                )}
              </Box>
            </>
          )}
        </Section>

        <Section title="Additional Details">
          {loading ? (
            <Skeleton width="50%" />
          ) : (
            <>
              <Typography><strong>Possession Status:</strong> {property?.possessionStatus || "N/A"}</Typography>
              <Typography><strong>Bathrooms:</strong> {property?.bathrooms ?? "N/A"}</Typography>
              <Typography><strong>Balconies:</strong> {property?.balconies ?? "N/A"}</Typography>
              <Typography>
                <strong>Parking:</strong>{" "}
                {Array.isArray(property?.parkings) ? property.parkings.join(", ") || "N/A" : property?.parkings || "N/A"}
              </Typography>
              <Typography><strong>Facing:</strong> {property?.facing || "N/A"}</Typography>
              <Typography><strong>Age of Property:</strong> {property?.ageOfProperty || "N/A"}</Typography>
              <Typography><strong>Floor:</strong> {formatFloor(property?.floor)}</Typography>
              <Typography><strong>Wing:</strong> {property?.wing || "N/A"}</Typography>
              <Typography><strong>Units Available:</strong> {property?.unitsAvailable ?? "N/A"}</Typography>
            </>
          )}
        </Section>

        <Section title="Media & Gallery">
  {loading ? (
    <Skeleton variant="rectangular" width="100%" height={200} />
  ) : (
    <PropertyMediaSection property={property} />
  )}
</Section>


<Section title="Amenities & Features">
  <Typography><strong>Amenities:</strong></Typography>
  {property?.amenities?.length > 0 ? (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
      {property.amenities.map((a, i) => (
        <Chip key={i} label={a} sx={{ mr: 1, mt: 1 }} />
      ))}
    </Stack>
  ) : <Typography mt={1}>None</Typography>}

  <Typography mt={2}><strong>Facilities:</strong></Typography>
  {property?.facilities?.length > 0 ? (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
      {property.facilities.map((f, i) => (
        <Chip key={i} label={f} sx={{ mr: 1, mt: 1 }} />
      ))}
    </Stack>
  ) : <Typography mt={1}>None</Typography>}

  <Typography mt={2}><strong>Security:</strong></Typography>
  {property?.security?.length > 0 ? (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
      {property.security.map((s, i) => (
        <Chip key={i} label={s} sx={{ mr: 1, mt: 1 }} />
      ))}
    </Stack>
  ) : <Typography mt={1}>None</Typography>}
</Section>


        {/* Every decision made on this listing, newest first */}
        <Section title="Review history">
          {loading ? <Skeleton width="70%" /> : <ReviewHistory property={property} />}
        </Section>

        {/* Moderation */}
        <Section title="Moderation Info">
          {loading ? (
            <>
              <Skeleton width="120px" />
              <Skeleton width="100%" />
            </>
          ) : (
            <>
              <Typography component="div" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <strong>Status:</strong>
                <Chip
                  size="small"
                  variant="outlined"
                  label={LISTING_STATUS_LABELS[property?.status] ?? property?.status ?? "N/A"}
                  color={LISTING_STATUS_COLORS[property?.status] ?? "default"}
                />
              </Typography>
              {property?.status === LISTING_STATUS.REJECTED && (
                <Typography>
                  <strong>Rejection reason:</strong> {property?.rejectionReason || "None"}
                </Typography>
              )}
              <Typography>
                <strong>Verified by Admin:</strong>{" "}
                {property?.metadata?.moderation?.verifiedByAdmin ? "Yes" : "No"}
              </Typography>
              <Typography>
                <strong>Notes:</strong>{" "}
                {property?.metadata?.moderation?.verificationNotes || "None"}
              </Typography>
            </>
          )}
        </Section>
      </DialogContent>

      <DialogActions>
        {/* Optional admin actions */}
        {onReject && (
          <Button
            color="error"
            onClick={onReject}
            disabled={isRejecting}
            sx={{ mr: 1 }}
            aria-label="Reject property"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        )}

        {onApprove && (
          <Button
            color="success"
            onClick={onApprove}
            disabled={isApproving}
            aria-label="Approve property"
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        )}

        <Button onClick={onClose} aria-label="Close details">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

DeveloperDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  property: PropTypes.shape({
    title: PropTypes.string,
    developerAvatar: PropTypes.shape({
      url: PropTypes.string,
    }),
    developerName: PropTypes.string,
    tierType: PropTypes.string,
    propertyType: PropTypes.string,
    bhk: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    furnishing: PropTypes.string,
    price: PropTypes.number,
    area: PropTypes.shape({
      value: PropTypes.number,
      unit: PropTypes.string,
    }),
    reraApproved: PropTypes.bool,
    reraNumber: PropTypes.string,
    description: PropTypes.string,
    long_description: PropTypes.string,
    state: PropTypes.string,
    city: PropTypes.string,
    locality: PropTypes.string,
    address: PropTypes.string,
    pincode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mapLink: PropTypes.string,
    coordinates: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number,
    }),
    landmarks: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
      })
    ),
    coverImage: PropTypes.shape({
      url: PropTypes.string,
      thumbnail: PropTypes.string,
    }),
    galleryImages: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        thumbnail: PropTypes.string,
        caption: PropTypes.string,
        src: PropTypes.string,
      })
    ),
    metadata: PropTypes.object,
    status: PropTypes.string,
    rejectionReason: PropTypes.string,
    // an edit of a listing that was reviewed before (see backend updateProperty)
    lastEditedAt: PropTypes.string,
    changedFields: PropTypes.arrayOf(PropTypes.string),
    reviewHistory: PropTypes.arrayOf(
      PropTypes.shape({
        action: PropTypes.string,
        by: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        at: PropTypes.string,
        reason: PropTypes.string,
      })
    ),
    listedBy: PropTypes.string,
    // populated poster: developer (User) or owner/agent (Customer)
    userId: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }),
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  isApproving: PropTypes.bool,
  isRejecting: PropTypes.bool,
};

export default React.memo(DeveloperDetailsModal);
