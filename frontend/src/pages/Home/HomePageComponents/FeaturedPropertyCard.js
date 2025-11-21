import React from 'react';
import { useNavigate } from 'react-router-dom';
// import house from '../images/house.jpg';
import './FeaturedPropertyCard.css'
const FeaturedPropertyCard = ({ property, formatIndianPrice }) => {
  const navigate = useNavigate();

  return (
    <div key={property._id} className="property-cards-container">
      {property.coverImage && (
        <div className="property-cover-image">
          <img 
            src={property.coverImage}
            alt={property.title} 
            className="cover-image"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="property-content">
        <div className="property-headerR">
          <h3 className="property-developer">By {property.developerName }</h3>
          <h3 className="property-title-featured">{property.title || 'NA'}</h3>
          <button 
            className="view-details-btn"
            onClick={() => navigate(`/properties/${property._id}`)}
          >
            view details
          </button>
        </div>
        
        <p className="feature-property-location">
          <svg className="location-icon" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {property.locality || 'NA'}, {property.city || 'NA'}
        </p>
        
        <div className="feature-property-price">
          ₹{formatIndianPrice(property.price)}
          {property.pricePerSqft && (
            <span className="price-per-sqftt">(₹{property.pricePerSqft.toLocaleString('en-IN')}/{property.area.unit})</span>
          )}
        </div>
        
        <div className="property-types">
          {property.bedrooms && Array.isArray(property.bedrooms) ? (
            property.bedrooms.map((bedroom, index) => (
              <span key={index} className="bhk-tag">
                {bedroom} BHK
              </span>
            ))
          ) : (
            <span className="bhk-tag">
              {property.bhk || 'NA'} BHK Apartments
            </span>
          )}
        </div>
        
        <div className="feature-property-actions">
          <button 
            className="contact-btn"
            onClick={() => navigate(`/properties/${property._id}`)}
          >
            Contact Us
          </button>
          <button className="wishlist-btn" aria-label="Add to wishlist">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedPropertyCard;