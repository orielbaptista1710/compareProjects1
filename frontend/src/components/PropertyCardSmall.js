import React from "react";
import "./PropertyCardSmall.css";

const PropertyCardSmall = ({ property }) => {
  return (
    <div className="property-card-small">
      <div className="property-image-wrapper">
        <img
          src={property.image || 'https://via.placeholder.com/80x60'}
          alt={property.title || 'Property image'}
          className="property-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x60';
          }}
        />
      </div>
      <div className="property-card-details">
        <h4 className="property-title">{property.title || 'Property'}</h4>
        <p className="property-location">
          {[property.locality, property.city].filter(Boolean).join(', ')}
        </p>
        {property.price && (
          <p className="property-price">
            ₹ {property.price.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
};

export default PropertyCardSmall;