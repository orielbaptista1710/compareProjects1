// Compare.js — Production Ready
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, MapPin, ArrowRight } from "lucide-react";
import "./Compare.css";

import CompareSummary from "../Compare/ComparePageComponents/CompareSummary";
import CompareEmptyState from "../Compare/ComparePageComponents/CompareEmptyState";
import { getPropertyImage, getPropertyLocation } from "../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../utils/formatters";

/* ─── constants ─── */
const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "details",   label: "Details"   },
  { id: "amenities", label: "Amenities" },
  { id: "location",  label: "Location"  },
];

const MAX_SLOTS = 4;

/* ─── helpers ─── */
const safeText  = (val) => (val != null && val !== "" ? val : "—");
const fmtArea   = (area) =>
  area?.value ? `${area.value.toLocaleString("en-IN")} ${area.unit || "sq.ft"}` : "—";
const fmtDate   = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const fmtList   = (arr) => (arr?.length ? arr.join(", ") : "—");

/* ─── sub-components ─── */
const AddSlot = ({ onClick }) => (
  <button className="add-slot" onClick={onClick} aria-label="Add property to compare">
    <span className="add-slot__icon"><Plus size={20} strokeWidth={1.5} /></span>
    <span className="add-slot__label">Add Property</span>
  </button>
);

const HeaderCard = ({ property, onRemove }) => {
  const location = getPropertyLocation(property);
  return (
    <div className="header-card">
      <div className="header-card__img-wrap">
        <img
          src={getPropertyImage(property)}
          alt={property.title || "Property"}
          loading="lazy"
          className="header-card__img"
        />
        {property.featured && <span className="header-card__badge">Featured</span>}
      </div>

      <div className="header-card__body">
        <p className="header-card__type">{property.propertyType || "Property"}</p>
        <h3 className="header-card__title">{property.title?.slice(0, 48) || "Untitled"}</h3>
        <p className="header-card__dev">By {property.developerName || "Developer"}</p>

        {location && (
          <p className="header-card__loc">
            <MapPin size={12} strokeWidth={1.5} />
            {location}
          </p>
        )}

        <p className="header-card__price">{formatCurrencyShort(property.price)}</p>

        {property.reraApproved && (
          <span className="header-card__rera">RERA ✓</span>
        )}
      </div>

      <button
        className="header-card__remove"
        onClick={() => onRemove(property._id)}
        aria-label="Remove from comparison"
      >
        <Trash2 size={14} strokeWidth={1.5} />
        Remove
      </button>
    </div>
  );
};

/* ─── tab renderers ─── */

const OverviewTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Pricing">
      <Row label="Price"          value={formatCurrencyShort(property.price)} highlight />
      <Row label="Price / Sq.ft"  value={property.pricePerSqft ? `₹${property.pricePerSqft.toLocaleString("en-IN")}` : "—"} />
      <Row label="EMI Starts"     value={property.emiStarts ? `₹${property.emiStarts.toLocaleString("en-IN")}` : "—"} />
    </Section>

    <Section title="Property">
      <Row label="Type"      value={safeText(property.propertyType)} />
      <Row label="Category"  value={safeText(property.propertyGroup)} />
      <Row label="BHK"       value={property.bhk ? `${property.bhk} BHK` : "—"} />
      <Row label="Area"      value={fmtArea(property.area)} />
    </Section>

    <Section title="Status">
      <Row label="Possession"    value={safeText(property.possessionStatus)} />
      <Row label="RERA Approved" value={property.reraApproved ? "Yes ✓" : "No"} />
      {property.reraApproved && property.reraNumber && (
        <Row label="RERA No." value={property.reraNumber} />
      )}
    </Section>

    {property.amenities?.length > 0 && (
      <Section title="Top Amenities">
        <div className="chip-list">
          {property.amenities.slice(0, 6).map((a, i) => (
            <span key={i} className="chip">{a}</span>
          ))}
        </div>
      </Section>
    )}
  </div>
);

const DetailsTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Unit">
      <Row label="BHK"          value={property.bhk ? `${property.bhk} BHK` : "—"} />
      <Row label="Bathrooms"    value={safeText(property.bathrooms)} />
      <Row label="Balconies"    value={safeText(property.balconies)} />
      <Row label="Parkings"     value={safeText(property.parkings)} />
    </Section>

    <Section title="Building">
      <Row label="Floor"        value={safeText(property.floor)} />
      <Row label="Total Floors" value={safeText(property.totalFloors)} />
      <Row label="Wing / Tower" value={[property.wing, property.tower].filter(Boolean).join(" / ") || "—"} />
      <Row label="Phase"        value={safeText(property.phase)} />
    </Section>

    <Section title="Specs">
      <Row label="Furnishing"       value={safeText(property.furnishing)} />
      <Row label="Facing"           value={safeText(property.facing)} />
      <Row label="Age of Property"  value={safeText(property.ageOfProperty)} />
      <Row label="Units Available"  value={safeText(property.unitsAvailable)} />
      <Row label="Available From"   value={fmtDate(property.reraDate)} />
    </Section>
  </div>
);

const AmenitiesTab = ({ property }) => (
  <div className="tab-content">
    <AmenityGroup title="Amenities"  items={property.amenities} />
    <AmenityGroup title="Facilities" items={property.facilities} />
    <AmenityGroup title="Security"   items={property.security} />
  </div>
);

const LocationTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Address">
      <Row label="State"    value={safeText(property.state)} />
      <Row label="City"     value={safeText(property.city)} />
      <Row label="Locality" value={safeText(property.locality)} />
      <Row label="Pincode"  value={safeText(property.pincode)} />
      <Row label="Address"  value={safeText(property.address)} />
    </Section>

    {property.landmarks?.length > 0 && (
      <Section title="Landmarks">
        {property.landmarks.map((lm, i) => (
          <Row key={i} label={`Landmark ${i + 1}`} value={lm.name || "—"} />
        ))}
      </Section>
    )}

    {property.mapLink && (
      <a
        href={property.mapLink}
        target="_blank"
        rel="noopener noreferrer"
        className="map-link"
      >
        View on Map <ArrowRight size={13} strokeWidth={1.5} />
      </a>
    )}
  </div>
);

/* ─── micro UI ─── */

const Section = ({ title, children }) => (
  <div className="section">
    <h5 className="section__title">{title}</h5>
    {children}
  </div>
);

const Row = ({ label, value, highlight }) => (
  <div className={`row ${highlight ? "row--highlight" : ""}`}>
    <span className="row__label">{label}</span>
    <span className="row__value">{value}</span>
  </div>
);

const AmenityGroup = ({ title, items }) => (
  <Section title={title}>
    {items?.length ? (
      <div className="chip-list">
        {items.map((item, i) => <span key={i} className="chip">{item}</span>)}
      </div>
    ) : (
      <p className="empty-list">None listed</p>
    )}
  </Section>
);

const TAB_MAP = {
  overview:  OverviewTab,
  details:   DetailsTab,
  amenities: AmenitiesTab,
  location:  LocationTab,
};

/* ─── main component ─── */

function Compare({ compareList, setCompareList, removeFromCompare }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    setProperties(compareList);
  }, [compareList]);

  const clearAll = useCallback(() => setCompareList([]), [setCompareList]);
  const goToProperties = useCallback(() => navigate("/properties"), [navigate]);

  const emptySlots = useMemo(
    () => MAX_SLOTS - properties.length,
    [properties.length]
  );

  const ActiveTabComponent = TAB_MAP[activeTab] ?? OverviewTab;

  return (
    <div className="compare-page">
      <CompareSummary properties={properties} />

      {properties.length === 0 ? (
        <CompareEmptyState navigate={navigate} />
      ) : (
        <div className="compare-layout">

          {/* ── Header row ── */}
          <div className="compare-grid" style={{ "--cols": MAX_SLOTS }}>
            {properties.map((p) => (
              <HeaderCard key={p._id} property={p} onRemove={removeFromCompare} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <AddSlot key={`add-${i}`} onClick={goToProperties} />
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="compare-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`compare-tab ${activeTab === tab.id ? "compare-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content grid ── */}
          <div className="compare-grid compare-grid--content" style={{ "--cols": MAX_SLOTS }}>
            {properties.map((p) => (
              <div key={p._id} className="compare-cell">
                <ActiveTabComponent property={p} />
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={`empty-${i}`} className="compare-cell compare-cell--empty">
                <AddSlot onClick={goToProperties} />
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div className="compare-actions">
            <button className="btn btn--ghost" onClick={clearAll}>
              <Trash2 size={14} strokeWidth={1.5} /> Clear All
            </button>
            <button className="btn btn--primary" onClick={goToProperties}>
              <Plus size={14} strokeWidth={1.5} /> Add More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compare;