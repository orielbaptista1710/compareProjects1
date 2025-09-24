import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBed, 
  faRulerCombined, 
  faCheckCircle, 
  faHouseUser
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import "./PropertyDetails.css";

const PropertyDetails = ({ property }) => {
  // ✅ Format area value with commas (memoized for performance)
  const formatArea = (value) => 
    new Intl.NumberFormat("en-IN").format(value);

  return (
    <section 
      className="property-details-container" 
      aria-labelledby="property-details-heading"
    >
      <h2 id="property-details-heading" className="sr-only">
        Property Details
      </h2>

      <div className="property-details-grid">
        {/* Bedroom */}
        <div className="property-detail-item">
          <div className="detail-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faHouseUser} />
          </div>
          <div className="detail-content">
            <span className="detail-label">Property</span>
            <span className="detail-value">
              {property?.propertyGroup ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Bathroom */}
        <div className="property-detail-item">
          <div className="detail-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faBed} />
          </div>
          <div className="detail-content">
            <span className="detail-label">Bedrooms</span>
            <span className="detail-value">
              {property?.bhk ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Area */}
        <div className="property-detail-item">
          <div className="detail-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faRulerCombined} />
          </div>
          <div className="detail-content">
            <span className="detail-label">Area</span>
            <span className="detail-value">
              {property?.area?.value
                ? `${formatArea(property.area.value)} ${property.area.unit}`
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Parking */}
        <div className="property-detail-item">
          <div className="detail-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="detail-content">
            <span className="detail-label">Possession</span>
            <span className="detail-value">
              {property?.possessionStatus ?? "N/A"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ✅ Prop validation (helps catch errors early)
PropertyDetails.propTypes = {
  property: PropTypes.shape({
    bhk: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bathrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    area: PropTypes.shape({
      value: PropTypes.number,
      unit: PropTypes.string,
    }),
    parkings: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default React.memo(PropertyDetails);
