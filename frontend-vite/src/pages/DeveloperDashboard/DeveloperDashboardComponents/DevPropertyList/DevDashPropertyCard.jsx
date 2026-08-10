import { memo } from "react";
import { resolveImageUrl, STATUS_CONFIG } from "../../utils/Propertyutils";

/**
 * DetailRow
 * Renders one label/value pair. Returns null for empty values so you
 * never see a blank row — same logic as the original MUI version.
 */
const DetailRow = memo(({ label, value }) => {
  if (value === null || value === undefined || value === "" || value === false) return null;
  const display = value === true ? "Yes" : value;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{display}</span>
    </div>
  );
});
DetailRow.displayName = "DetailRow";

/** Uppercase section header between detail groups */
const SectionLabel = ({ children }) => (
  <p className="section-label">{children}</p>
);

/**
 * DevDashPropertyCard
 * One card per property. Receives the property object, edit/delete handlers,
 * and the price formatter from the parent.
 */
const DevDashPropertyCard = memo(({ p, onEdit, onDelete, formatPrice }) => {
  const imageUrl = resolveImageUrl(p.coverImage);
  const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;

  const areaDisplay = p.area?.value
    ? `${p.area.value} ${p.area.unit ?? "sqft"}`
    : null;

  const locationDisplay =
    [p.locality, p.city, p.state].filter(Boolean).join(", ") || null;

  const addressDisplay =
    [p.address, p.pincode].filter(Boolean).join(", ") || null;

  return (
    <div className="prop-card">

      {/* ── Header: title + status chip ── */}
      <div className="prop-card__header">
        <span className="prop-card__title" title={p.title}>{p.title}</span>
        <span className={`status-chip ${statusCfg.cls}`}>{statusCfg.label}</span>
      </div>

      {/* ── Cover image or placeholder ── */}
      {imageUrl ? (
        <img
          className="prop-card__image"
          src={imageUrl}
          alt={p.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-property.jpg";
          }}
        />
      ) : (
        <div className="prop-card__no-image">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </div>
      )}

      {/* ── Metrics strip: price / type / BHK ── */}
      <div className="prop-card__metrics">
        <div className="metric">
          <span className="metric__label">Price</span>
          <span className="metric__value">{p.price ? formatPrice(p.price) : "On Request"}</span>
        </div>
        <div className="metric metric--bordered">
          <span className="metric__label">Type</span>
          <span className="metric__value">{p.propertyType ?? "—"}</span>
        </div>
        <div className="metric">
          <span className="metric__label">BHK</span>
          <span className="metric__value">{p.bhk ? `${p.bhk} BHK` : "—"}</span>
        </div>
      </div>

      {/* ── Detail rows ── */}
      <div className="prop-card__details">

        <SectionLabel>Location</SectionLabel>
        <DetailRow label="Area"    value={locationDisplay} />
        <DetailRow label="Address" value={addressDisplay} />

        <SectionLabel>Property</SectionLabel>
        <DetailRow label="Furnishing"   value={p.furnishing} />
        <DetailRow label="Possession"   value={p.possessionStatus} />
        <DetailRow label="Age"          value={p.ageOfProperty} />
        <DetailRow label="Area"         value={areaDisplay} />
        <DetailRow label="Parking"      value={Array.isArray(p.parkings) ? p.parkings.join(", ") : p.parkings} />
        <DetailRow label="Facing"       value={p.facing} />
        <DetailRow label="Bathrooms"    value={p.bathrooms} />
        <DetailRow label="Balconies"    value={p.balconies} />

        <SectionLabel>Building</SectionLabel>
        <DetailRow label="Total Floors" value={p.totalFloors} />
        <DetailRow label="Floor"        value={p.floor} />
        <DetailRow label="Wing"         value={p.wing} />
        <DetailRow label="Phase"        value={p.phase} />
        <DetailRow label="Tower"        value={p.tower} />
        <DetailRow label="Units Avail." value={p.unitsAvailable} />

        <SectionLabel>RERA &amp; Pricing</SectionLabel>
        <DetailRow label="RERA"         value={p.reraApproved ? "Approved" : null} />
        <DetailRow label="RERA No."     value={p.reraNumber} />
        <DetailRow
          label="Available From"
          value={
            p.reraDate
              ? new Date(p.reraDate).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : null
          }
        />
        <DetailRow label="Negotiable"   value={p.priceNegotiable ? "Yes" : null} />
        <DetailRow label="EMI from"     value={p.emiStarts ? `${formatPrice(p.emiStarts)}/mo` : null} />

        {(p.amenities?.length > 0 || p.facilities?.length > 0 || p.security?.length > 0) && (
          <>
            <SectionLabel>Amenities</SectionLabel>
            <DetailRow label="Amenities"  value={p.amenities?.join(", ")} />
            <DetailRow label="Facilities" value={p.facilities?.join(", ")} />
            <DetailRow label="Security"   value={p.security?.join(", ")} />
          </>
        )}

        {p.description && (
          <div className="prop-card__description">
            <SectionLabel>Description</SectionLabel>
            <p className="description-text">{p.description}</p>
          </div>
        )}

        {p.status === "rejected" && p.rejectionReason && (
          <div className="rejection-banner">
            <span className="rejection-banner__label">Rejection reason</span>
            <p className="rejection-banner__text">{p.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="prop-card__actions">
        <button
          className="btn btn--outline"
          onClick={() => onEdit(p)}
          aria-label={`Edit ${p.title}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button
          className="btn btn--danger-outline"
          onClick={() => onDelete(p._id, p.title)}
          aria-label={`Delete ${p.title}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
});

DevDashPropertyCard.displayName = "DevDashPropertyCard";

export default DevDashPropertyCard;