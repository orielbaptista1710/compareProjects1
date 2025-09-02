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
  faHeart,
  faShareAlt,
  faRulerCombined
} from '@fortawesome/free-solid-svg-icons';

const placeholderImage = 'https://via.placeholder.com/400x300?text=Property+Image';

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
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 

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

  const handleCardClick = (e) => {
    if (!e.target.closest('button') && !e.target.closest('a')) {
      if (property && property._id) {
        navigate(`/property/${property._id}`);
      } else {
        console.error("Property ID is missing");
      }
    }
  };

  const formatLocation = () => {
    return `${property.locality}, ${property.city}, ${property.state}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUrl = () => {
    if (imageError || !property.coverImage) {
      return placeholderImage;
    }
    return `${process.env.REACT_APP_API_URL}/uploads/${property.coverImage}`;
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return "Price on Request";
    }
  
    if (price >= 10000000) {
      const crores = price / 10000000;
      return `₹${crores.toFixed(2)} Crore${crores !== 1 ? 's' : ''}`;
    }
    
    if (price >= 100000) {
      const lakhs = price / 100000;
      return `₹${lakhs.toFixed(2)} Lakh${lakhs !== 1 ? 's' : ''}`;
    }
  
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPricePerSqFt = () => {
    if (!property.price || !property.area) return null;
    const pricePerSqFt = Math.round(property.price / property.area);
    return `₹${pricePerSqFt.toLocaleString('en-IN')}/sq.ft`;
  };

  const formatArea = () => {
    if (!property.area) return "N/A";
    return `${property.area.toLocaleString('en-IN')} sq.ft`;
  };

  const toggleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const shareProperty = (e) => {
    e.stopPropagation();
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description.substring(0, 100),
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div 
      className={`propertyy-card ${cardType === 'compare' ? 'compare-card' : 'default-card'} ${isInCompare ? 'in-compare' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
    > 
      {onRemove && (
        <button 
          className="close-button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            onRemove(property._id); 
          }}
          aria-label="Remove property"
        >
          &times;
        </button>
      )}

      <div className="card-image-container">
        <div className="property-type-badge">{property.propertyType}</div>
        <div className="image-actions">
          <button 
            className={`image-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={toggleLike}
            aria-label={isLiked ? "Unlike property" : "Like property"}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button 
            className="image-action-btn"
            onClick={shareProperty}
            aria-label="Share property"
          >
            <FontAwesomeIcon icon={faShareAlt} />
          </button>
        </div>
        <img 
          src={getImageUrl()}
          alt={property.title}
          className="card-image"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      <div className="property-contentt">
        <div className='submain-headerr'>                  
          <div className="property-headerr">
            <h2 className="property-titlee">{property.title}</h2>
            <div className="property-pricee">
              {formatPrice(property.price)} 
              <span className="price-per-sqft">{getPricePerSqFt()}</span>
            </div>
          </div>
          <div className='more-details'>
            <p className="property-locationn">
              <FontAwesomeIcon icon={faLocationDot} /> {formatLocation()}
            </p>
            <div className="property-agentt">By {property.firstName}</div>   
          </div>
        </div>

        <div className="property-featuress">
          <div className="feature">
            <FontAwesomeIcon icon={faBed} />
            <span>{property.bhk || 'N/A'} BHK</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faBath} />
            <span>{property.bathrooms || 'N/A'} Bath</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faRulerCombined} />
            <span>{formatArea()}</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCompass} />
            <span>{property.facing || 'N/A'} Facing</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faHome} />
            <span>{property.balconies || 'N/A'} Balcony</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCar} />
            <span>{property.parkings?.[0] || 'No Parking'}</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>{property.possessionStatus?.[0] || 'N/A'}</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCouch} />
            <span>{property.furnishing?.[0] || 'N/A'}</span>
          </div>
        </div>

        <div className={`property-descriptionn ${expanded ? 'expanded' : ''}`}>
          <p>
            {expanded 
              ? property.description
              : `${property.description.substring(0, 100)}...`}
            
            <button 
              className="toggle-descriptionn" 
              onClick={(e) => {
                e.stopPropagation(); 
                setExpanded(!expanded);
              }}
            >
              {expanded ? 'Read Less' : 'Read More'} 
            </button>
          </p>
        </div>

        <div className="property-footerr">
          <div className="property-actionss">
            <button 
              className={`compare-action-button ${isInCompare ? 'in-compare' : ''}`}
              onClick={handleCompare}
            >
              <FontAwesomeIcon className="contact-custom-btn-icon" icon={faCodeCompare} />
              {isInCompare ? 'Comparing' : 'Compare'}
            </button>
            <button 
              className="contact-action-button"
              onClick={(e) => {
                e.stopPropagation();
                // Implement contact functionality
              }}
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