import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLocationDot,
  faBed,
  faBath,
  faCompass,
  faHome,
  faCalendarAlt,
  faPhone,
  faCodeCompare,
  faCar,
  faCouch,
} from '@fortawesome/free-solid-svg-icons';
import img from '../images/house.jpg';

function PropertyCard({ 
  property, 
  addToCompare, 
  goToComparePage, 
  onRemove, 
  cardType,
  isInCompare 
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!property) return <p>Invalid property data</p>;

  const handleCompare = (e) => {
    e.stopPropagation();
    if (addToCompare) {
      addToCompare(property);
    }
    if (goToComparePage && isInCompare) {
      goToComparePage();
    }
  };

  const handleCardClick = () => {
    navigate(`/property/${property._id}`);
  };

  // Format the location string
  const formatLocation = () => {
    return `${property.locality}, ${property.city}, ${property.state}`;
  };

  // Format the price (placeholder - you'll need to add price to your data)
  const formatPrice = () => {
    return "Price on Request";
  };

  return (
    <div 
      className={`propertyy-card ${cardType === 'compare' ? 'compare-card' : 'default-card'} ${isInCompare ? 'in-compare' : ''}`}
      onClick={handleCardClick}
    > 
      {onRemove && (
        <button 
          className="close-button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            onRemove(property._id); 
          }}
        >
          &times;
        </button>
      )}

      <div className="card-image-container">
        <div className="property-type-badge">{property.propertyType}</div>
        <img src={property.coverimage || img} alt={property.title} className="card-image" />
      </div>

      <div className="property-content">
        <div className="property-header">
          <h2 className="property-title">{property.title}</h2>
          <div className="property-price">{formatPrice()}</div>
          
        </div>
          <p className="property-location">
            <FontAwesomeIcon icon={faLocationDot} /> {formatLocation()}
          </p>
          <div className="property-agent">By {property.firstName}</div>

        <div className="property-features">
          <div className="feature">
            <FontAwesomeIcon icon={faBed} />
            <span>{property.bhk} BHK</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faBath} />
            <span>{property.bathrooms} Bath</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCompass} />
            <span>{property.facing} Facing</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faHome} />
            <span>{property.balconies} Balcony</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCar} />
            <span>{property.parkings[0] || 'No Parking'}</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>{property.possessionStatus[0] || 'N/A'}</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCouch} />
            <span>{property.furnishing[0] || 'N/A'}</span>
          </div>

        </div>

        <div className={`property-description ${expanded ? 'expanded' : ''}`}>
          <p>
            {expanded 
              ? property.description
              : `${property.description.substring(0, 70)}...`}
            
            <button 
              className="toggle-description" 
              onClick={(e) => {
                e.stopPropagation(); 
                setExpanded(!expanded);
              }}
            >
              {expanded ? 'Read Less' : 'Read More'} 
            </button>
          </p>
        </div>

        <div className="property-footer">
          <div className="property-actions">
            <button 
              className={`compare-action-button ${isInCompare ? 'in-compare' : ''}`}
              onClick={handleCompare}
            >
              <FontAwesomeIcon className="contact-custom-btn-icon" icon={faCodeCompare} />
              {isInCompare ? 'Comparing' : 'Compare'}
            </button>
            <button 
              className="contact-action-button"
              onClick={(e) => e.stopPropagation()}
            >
              <FontAwesomeIcon className="contact-custom-btn-icon" icon={faPhone} />
              Contact Seller
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyCard;