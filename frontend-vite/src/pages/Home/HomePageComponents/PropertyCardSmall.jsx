// frontend-vite/src/pages/Home/HomePageComponents/PropertyCardSmall.jsx
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  BedDouble,
  Ruler,
  BedIcon,
  HourglassIcon,
} from "lucide-react";
import "./PropertyCardSmall.css";
import { useCompare } from "../../../contexts/CompareContext";
import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyImage, fallbackImg } from "../../../utils/propertyHelpers";

// disableNavigation — pass true when the parent (e.g. ExpandableSearch) owns
// routing.  This prevents the card's own navigate() from firing alongside the
// parent's handler and causing a double-navigation race.
const PropertyCardSmall = ({ property, disableNavigation = false }) => {
  const { addToCompare } = useCompare();
  const navigate = useNavigate();

  const imageUrl = getPropertyImage(property);

  const handleCardClick = () => {
    if (!disableNavigation) {
      navigate(`/property/${property?._id}`);
    }
    // When disableNavigation is true, the parent's onClick on the wrapper
    // handles routing.  We do nothing here so there's one navigation, not two.
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleCardClick();
  };

  return (
    <div
      className="modern-property-card"
      role={disableNavigation ? "presentation" : "button"}
      tabIndex={disableNavigation ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
    >
      {/* IMAGE */}
      <div className="modern-property-image">
        <img
          src={imageUrl}
          alt={property?.title || "Property"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="modern-property-content">
        {/* Header */}
        <div className="modern-property-header">
          <h3 className="small-property-title">
            {property?.title || "Untitled Property"}
          </h3>

          <p className="property-sub">
            <span className="span_propertytype">
              {property?.propertyType || "Apartment NA"} |{" "}
            </span>
            <span className="span_developerName">
              by {property?.developerName || "Developer NA"}
            </span>
          </p>
        </div>

        {/* Features */}
        <div className="property-features">
          {/* Possession */}
          <span className="small-feature">
            <Home size={16} strokeWidth={1.8} aria-hidden="true" />
            {property?.possessionStatus || "NA"}
          </span>

          {/* Locality */}
          <span className="small-feature">
            <BedDouble size={16} strokeWidth={1.8} aria-hidden="true" />
            {property?.locality || "NA"}
          </span>

          {/* Area — only if exists */}
          {property?.area?.value && (
            <span className="small-feature">
              <Ruler size={16} strokeWidth={1.8} aria-hidden="true" />
              {property.area.value}
              {property.area.unit ? ` ${property.area.unit}` : " sq ft"}
            </span>
          )}

          {/* BHK */}
          <span className="small-feature">
            <BedIcon size={16} strokeWidth={1.8} aria-hidden="true" />
            {property?.bhk || "NA"} BHK
          </span>

          {/* Age of Property */}
          <span className="small-feature">
            <HourglassIcon size={16} strokeWidth={1.8} aria-hidden="true" />
            {property?.ageOfProperty || "NA"}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: PRICE + COMPARE */}
      <div className="modern-property-side">
        {/* Price */}
        <div className="modern-property-price">
          {formatCurrencyShort(property?.price)}
        </div>

        {/* Compare Button */}
        <button
          className="small-compare-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // prevent card click / parent click
            addToCompare(property);
          }}
        >
          Compare
        </button>
      </div>
    </div>
  );
};

export default memo(PropertyCardSmall);