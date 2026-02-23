import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  BedDouble,
  Ruler, 
  IndianRupee,
  BedIcon,
  HourglassIcon,
} from "lucide-react";
import "./PropertyCardSmall.css";
import { useCompare } from "../../../contexts/CompareContext";

import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyImage, fallbackImg } from "../../../utils/propertyHelpers";


const PropertyCardSmall = ({ property }) => {
  const { addToCompare } = useCompare();
  const navigate = useNavigate();

  const imageUrl = getPropertyImage(property);



  const handleCardClick = () => {
    navigate(`/property/${property?._id}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleCardClick();
  };

  return (
    <div
      className="modern-property-card"
      role="button"
      tabIndex={0}
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
            <Home size={16} strokeWidth={1.8} />
            {property?.possessionStatus || "NA"}
          </span>

          {/* Locality */}
          <span className="small-feature">
            <BedDouble size={16} strokeWidth={1.8} />
            {property?.locality || "NA"}
          </span>

          {/* AREA — only if exists */}
          {property?.area?.value && (
            <span className="small-feature">
              <Ruler size={16} strokeWidth={1.8} />
              {property.area.value}
              {property.area.unit ? ` ${property.area.unit}` : " sq ft"}
            </span>
          )}

          {/* BHK */}
          <span className="small-feature">
            <BedIcon size={16} strokeWidth={1.8} />
            {property?.bhk || "NA"} BHK
          </span>

          {/* Age of Property */}
          <span className="small-feature">
            <HourglassIcon size={16} strokeWidth={1.8} />
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
          onClick={(e) => {
            e.stopPropagation(); // prevent page navigation
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
