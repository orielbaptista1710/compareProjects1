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

import PropertyMediaSection from "../../Admin/AdminDasboardComponents/PropertyMediaSection";


/**
 * Production-ready DeveloperDetailsModal
 *
 * Props:
 *  - open (bool)
 *  - onClose (fn)
 *  - property (object) : full property document (or null while loading)
 *  - loading (bool) optional: show skeletons while loading
 *  - onApprove (fn) optional
 *  - onReject (fn) optional
 *  - isApproving (bool) optional
 *  - isRejecting (bool) optional
 *
 * Notes:
 *  - The parent should pass the *full* property object (not wrapped in { success, data })
 *  - Safe-url checks performed before rendering links
 *  - Images use a fallback onError
 */

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
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch (e) {
    return null;
  }
  return null;
}

function formatPrice(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "N/A";
  try {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  } catch {
    return `₹${amount}`;
  }
}

function formatArea(area) {
  if (!area || (area.value == null && !area.unit)) return "N/A";
  const value = area?.value ?? "N/A";
  const unit = area?.unit ?? "";
  return `${value} ${unit}`;
}

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
  const safeSourceUrl = useMemo(() => safeUrl(property?.sourceUrl), [property]);
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
        {/* Developer Details */}
        <Section title="Developer Details">
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
                <Typography>
                  <strong>Name:</strong> {property?.developerName || "N/A"}
                </Typography>
                <Typography>
                  <strong>Tier:</strong> {property?.tierType || "N/A"}
                </Typography>
                <Typography>
                  <strong>Source URL:</strong>{" "}
                  {safeSourceUrl ? (
                    <a href={safeSourceUrl} target="_blank" rel="noopener noreferrer">
                      Open Link
                    </a>
                  ) : (
                    "N/A"
                  )}
                </Typography>
              </Box>
            </Stack>
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
                <strong>Price:</strong> {formatPrice(property?.price)}
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
                <strong>Available Date:</strong> {property?.availableFrom ?? "N/A"}
              </Typography>


              <Section title="Additional Details">
  <Typography><strong>Possession Status:</strong> {property?.possessionStatus || "N/A"}</Typography>
  <Typography><strong>Bathrooms:</strong> {property?.bathrooms ?? "N/A"}</Typography>
  <Typography><strong>Balconies:</strong> {property?.balconies ?? "N/A"}</Typography>
  <Typography><strong>Parking:</strong> {property?.parkings || "N/A"}</Typography>
  <Typography><strong>Facing:</strong> {property?.facing || "N/A"}</Typography>
  <Typography><strong>Age of Property:</strong> {property?.ageOfProperty || "N/A"}</Typography>
  <Typography><strong>Floor:</strong> {property?.floor || "N/A"}</Typography>
  <Typography><strong>Wing:</strong> {property?.wing || "N/A"}</Typography>
  <Typography><strong>Units Available:</strong> {property?.unitsAvailable ?? "N/A"}</Typography>
</Section>


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


        {/* Moderation */}
        <Section title="Moderation Info">
          {loading ? (
            <>
              <Skeleton width="120px" />
              <Skeleton width="100%" />
            </>
          ) : (
            <>
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
    sourceUrl: PropTypes.string,
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
  }),
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  isApproving: PropTypes.bool,
  isRejecting: PropTypes.bool,
};

export default React.memo(DeveloperDetailsModal);
