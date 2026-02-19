//PropertyDetails.js is used in PropertyPage.js?
import React from "react";
import { Bed, Ruler, CheckCircle, Home } from "lucide-react";
import PropTypes from "prop-types";
import "./PropertyDetails.css";

const PropertyDetails = ({ property = {} }) => {
  // Format area with commas
  //CHECK THIS - USE FORMATTER.JS HERE????
  const formatArea = (value) =>
    value ? new Intl.NumberFormat("en-IN").format(value) : "N/A";

  return (
    <section
      className="property-details-container"
      aria-labelledby="property-details-heading"
    >
      <h2 id="property-details-heading" className="sr-only">
        Property DetailsSSSS
      </h2>

      <div className="property-details-grid">
        {/* Property Group */}
        {/* hAVE TO USE THE DERIVED propertyGroup here */}
        <div className="property-detail-item" aria-label="Property Type">
          <div className="detail-icon" aria-hidden="true">
            <Home size={18} strokeWidth={1.5} />
          </div>
          <div className="detail-content">
            <span className="property-details-detail-label">PropertyYYY</span>
            <span className="property-detail-detail-value">
              {property.propertyGroup ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="property-detail-item" aria-label="Bedrooms">
          <div className="detail-icon" aria-hidden="true">
            <Bed size={18} strokeWidth={1.5} />
          </div>
          <div className="detail-content">
            <span className="property-details-detail-label">Bedrooms</span>
            <span className="property-detail-detail-value">{property.bhk ?? "N/A"}</span>
          </div>
        </div>

        {/* Area */}
        <div className="property-detail-item" aria-label="Area">
          <div className="detail-icon" aria-hidden="true">
            <Ruler size={18} strokeWidth={1.5} />
          </div>
          <div className="detail-content">
            <span className="property-details-detail-label">Area</span>
            <span className="property-detail-detail-value">
              {property.area?.value
                ? `${formatArea(property.area.value)} ${
                    property.area.unit ?? ""
                  }`
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Possession Status */}
        <div className="property-detail-item" aria-label="Possession Status">
          <div className="detail-icon" aria-hidden="true">
            <CheckCircle size={18} strokeWidth={1.5} />
          </div>
          <div className="detail-content">
            <span className="property-details-detail-label">Possession</span>
            <span className="property-detail-detail-value">
              {property.possessionStatus ?? "N/A"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Prop validation
PropertyDetails.propTypes = {
  property: PropTypes.shape({
    propertyGroup: PropTypes.string,
    bhk: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    area: PropTypes.shape({
      value: PropTypes.number,
      unit: PropTypes.string,
    }),
    possessionStatus: PropTypes.string,
  }),
};

export default React.memo(PropertyDetails);
// React.memo is used to optimize the component by preventing unnecessary re-renders