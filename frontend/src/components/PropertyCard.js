import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faWallet, faBed, faCouch, faCodeCompare, faPhone, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

function PropertyCard({ property, addToCompare, goToComparePage, onRemove, cardType }) {
  console.log("Received property:", property)
  

  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!property) return <p>Invalid property data</p>;

  const handleCompare = () => {
    if (typeof addToCompare === 'function') {
      addToCompare(property);
    }
    if (typeof goToComparePage === 'function') {
      goToComparePage();
    }
  };

  const handleCardClick = () => {
    navigate(`/property/${property._id}`);
  };

  return (
    <div 
      className={`property-card ${cardType === 'compare' ? 'compare-card' : "default-card"}`}  
      onClick={handleCardClick}
      > 
      {onRemove && (
        <button className="close-button" onClick={(e) => { e.stopPropagation(); onRemove(property._id); }}>
          <span>&times;</span>
        </button>
      )}

      <div className="card-image-container">
        <img src={property.coverimage} alt="Property" />
      </div>

      <div className="property-details">
        <h1 className="property-titlee">{property.title}</h1>
        
        <h2 className="property-pricee">
            {property.price} ({property.pricePerSqFt}/sq.ft)
        </h2>
        <p className="property-agent">By {property.agent}</p>

        <div className="property-info">
          <div className="iinfo-item">
            <FontAwesomeIcon className='custom-icon' icon={faLocationDot} />
            <span>{property.location}</span>
          </div>

          <div className="iinfo-item">
            <FontAwesomeIcon className='custom-icon' icon={faWallet} />
            <span>₹{property.pricePerSqFt}/sq.ft</span>
          </div>
          <div className="iinfo-item">
            <FontAwesomeIcon className='custom-icon' icon={faBed} />
            <span>{property.bhk} bd.</span>
          </div>
          <div className="iinfo-item">
            <FontAwesomeIcon className='custom-icon' icon={faCouch} />
            <span>{property.furnished }</span>
          </div> 

        </div>

        {/* Collapsible Property Description */}
        <div className={`property-description ${expanded ? 'expanded' : ''}`}>
  <p>
    {expanded 
      ? property.description || "No description available" 
      : `${property.description ? property.description.substring(0, 70) : "No description available"}...`}
  
    <button 
      className="toggle-description" 
      onClick={(e) => {
        e.stopPropagation(); 
        setExpanded(!expanded);
      }}
    >
      {expanded ? 'Read Less' : 'Read More'} 
      <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
    </button>
  </p>
</div>

        

        <div className="actions-btn">
          {cardType !== 'compare' && (
            <button 
              className="compare-action-button" 
              onClick={(e) => {
                e.stopPropagation();
                handleCompare();
              }}
            >
              <FontAwesomeIcon className="compare-custom-btn-icon" icon={faCodeCompare} />
              Compare
            </button>
          )}
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
  );
};

export default PropertyCard;
