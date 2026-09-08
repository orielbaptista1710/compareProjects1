// src/pages/PropertyPage/PropertyPageComponents/PropertyDetails 
import React, { useMemo } from "react";
import { Bed, Bath, Ruler, CheckCircle, Home, Calendar } from "lucide-react";
import PropTypes from "prop-types";
// import { formatCurrencyShort } from "../../../utils/formatters";
import "./PropertyDetails.css";

// ── Formatters ────────────────────────────────────────────────
const fmtArea = (value) =>
  value ? new Intl.NumberFormat("en-IN").format(value) : null;

// ── Icon map ──────────────────────────────────────────────────
const STAT_CONFIG = [
  {
    key: "propertyGroup",
    label: "Property",
    Icon: Home,
    resolve: (p) => p.propertyGroup ?? null,
  },
  {
    key: "bhk",
    label: "Bedrooms",
    Icon: Bed,
    resolve: (p) =>
      p.bhk != null && p.bhk !== "" ? String(p.bhk) : null,
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    Icon: Bath,
    resolve: (p) =>
      p.bathrooms != null && p.bathrooms !== "" ? String(p.bathrooms) : null,
  },
  {
    key: "area",
    label: "Area",
    Icon: Ruler,
    resolve: (p) =>
      p.area?.value
        ? `${fmtArea(p.area.value)} ${p.area.unit || "sqft"}`
        : null,
  },
  {
    key: "possessionStatus",
    label: "Possession",
    Icon: CheckCircle,
    resolve: (p) => p.possessionStatus ?? null,
  },
  {
    key: "reraDate",
    label: "Available",
    Icon: Calendar,
    resolve: (p) =>
      p.reraDate
        ? new Date(p.reraDate).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })
        : null,
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
const PropertyDetails = ({ property = {} }) => {
  // Only render stats that have actual data
  const stats = useMemo(
    () =>
      STAT_CONFIG.map(({ key, label, Icon, resolve }) => ({
        key,
        label,
        Icon,
        value: resolve(property),
      })).filter(({ value }) => value !== null && value !== undefined && value !== ""),
    [property]
  );

  if (stats.length === 0) return null;

  return (
    <section className="pd-root" aria-label="Property highlights">
      <div className="pd-grid">
        {stats.map(({ key, label, Icon, value }) => (
          <div className="pd-stat" key={key}>
            <div className="pd-stat__icon" aria-hidden="true">
              <Icon size={17} strokeWidth={1.8} />
            </div>
            <div className="pd-stat__body">
              <span className="pd-stat__label">{label}</span>
              <span className="pd-stat__value">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

PropertyDetails.propTypes = {
  property: PropTypes.shape({
    propertyGroup:    PropTypes.string,
    bhk:              PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bathrooms:        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    area:             PropTypes.shape({ value: PropTypes.number, unit: PropTypes.string }),
    possessionStatus: PropTypes.string,
    reraDate:         PropTypes.string,
  }),
};

export default React.memo(PropertyDetails);