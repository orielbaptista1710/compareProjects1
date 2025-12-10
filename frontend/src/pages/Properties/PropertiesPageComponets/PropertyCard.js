import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';
import {
  BedDouble,
  Bath,
  Car,
  Heart,
  Share2,
  Ruler,
  CheckCircle,
  MapPin,
} from 'lucide-react';

const placeholderImage = 'https://placehold.co/600x400/000000/FFFFFF/png';

function PropertyCard({
  property,
  addToCompare,
  goToComparePage,
  // onRemove,
  cardType,
  isInCompare,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  /** ======================
   *  EVENT HANDLERS
   * ====================== */
  const handleCompare = useCallback(
    (e) => {
      e.stopPropagation();
      if (addToCompare) addToCompare(property);
      if (goToComparePage && isInCompare) goToComparePage();
    },
    [addToCompare, goToComparePage, isInCompare, property]
  );

  const handleCardClick = useCallback(
    (e) => {
      if (!e.target.closest('button') && !e.target.closest('a')) {
        if (property?._id) {
          navigate(`/property/${property._id}`);
        }
      }
    },
    [navigate, property]
  );

  const handleImageError = useCallback(() => setImageError(true), []);

  const toggleLike = useCallback((e) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  }, []);

  const shareProperty = useCallback(
    (e) => {
      e.stopPropagation();
      const shareData = {
        title: property.title,
        text: property.description?.substring(0, 100) || '',
        url: `${window.location.origin}/property/${property._id}`,
      };
      if (navigator.share) {
        navigator.share(shareData).catch((error) => console.log('Error sharing', error));
      } else {
        navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    },
    [property]
  );

  /** ======================
   *  COMPUTED VALUES
   * ====================== */
  const imageUrl = useMemo(() => {
    if (imageError) return placeholderImage;
    if (property.coverImage?.url) return property.coverImage.url;
    if (property.coverImage?.thumbnail) return property.coverImage.thumbnail;
    if (typeof property.coverImage === 'string' && property.coverImage) {
      return `${process.env.REACT_APP_API_URL}/uploads/${property.coverImage}`;
    }
    return placeholderImage;
  }, [imageError, property.coverImage]);

  const location = useMemo(
    () => `${property.locality}, ${property.city}`,
    [property.locality, property.city]
  );

  const formattedPrice = useMemo(() => {
    const price = property.price;
    if (typeof price !== 'number' || isNaN(price)) return 'Price on Request';

    if (price >= 10000000) {
      const crores = price / 10000000;
      const maxCrores = crores * 1.2; // 20% higher for range
      return `₹ ${crores.toFixed(2)} Cr - ${maxCrores.toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      const lakhs = price / 100000;
      const maxLakhs = lakhs * 1.2;
      return `₹ ${lakhs.toFixed(2)} L - ${maxLakhs.toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }, [property.price]);

  const formattedEMI = useMemo(() => {
    if (!property.emiStarts) return null;
    if (property.emiStarts >= 100000) {
      return `${(property.emiStarts / 100000).toFixed(2)} L`;
    }
    if (property.emiStarts >= 1000) {
      return `${(property.emiStarts / 1000).toFixed(1)} K`;
    }
    return property.emiStarts.toLocaleString('en-IN');
  }, [property.emiStarts]);

  const formattedPricePerSqft = useMemo(() => {
    if (!property.pricePerSqft) return null;
    if (property.pricePerSqft >= 1000) {
      return `${(property.pricePerSqft / 1000).toFixed(2)}k`;
    }
    return property.pricePerSqft.toLocaleString('en-IN');
  }, [property.pricePerSqft]);

  const parkingCount = useMemo(() => {
    if (!property.parkings) return '0';
    if (Array.isArray(property.parkings)) {
      return property.parkings.length.toString();
    }
    return property.parkings.toString();
  }, [property.parkings]);

  if (!property) return <p role="alert">Invalid property data</p>;

  /** ======================
   *  RENDER
   * ====================== */
  return (
    <article
      className={`propertyy-card ${cardType === 'compare' ? 'compare-card' : 'default-card'} ${isInCompare ? 'in-compare' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      aria-label={`Property card for ${property.title}`}
    >
      {/* Image Section */}
      <div className="card-image-container">
        <span className="property-type-badge" aria-label={property.propertyType}></span>

        {/* Property Type Label */}
        {property.propertyType && (
          <div className="property-type-label">{property.propertyType}</div>
        )}

        {/* RERA Badge */}
        {property.reraApproved && (
          <div className="rera-badge" title={`RERA: ${property.reraNumber || 'Approved'}`}>
            <CheckCircle size={16} /> RERA
          </div>
        )}

        <div className="image-actions">
          <button
            type="button"
            className={`image-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={toggleLike}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              color={isLiked ? '#D90429' : '#333'}
              fill={isLiked ? '#D90429' : 'none'}
            />
          </button>
          <button
            type="button"
            className="image-action-btn"
            onClick={shareProperty}
            aria-label="Share"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt={property.title || 'Property Image'}
          className="card-image"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="property-contentt">
        <header className="submain-headerr">
          <div className="property-headerr">
            <h2 className="property-titlee">{property.title}</h2>
            <div className="property-pricee">
              <span className="price-amount">{formattedPrice}</span>
              {formattedEMI && (
                <span className="price-per-sqft">EMI starts at ₹ {formattedEMI}</span>
              )}
            </div>
          </div>
          <div className="more-details">
            <p className="property-locationn">
              <MapPin size={16} /> {location}
            </p>
            {property.developerName && (
              <p className="property-agentt">By {property.developerName}</p>
            )}
          </div>
        </header>

        {/* Features */}
        <ul className="property-featuress">
          {property.bhk && (
            <li className="feature">
              <BedDouble size={16} />
              <span>{property.bhk} BHK</span>
            </li>
          )}
          {property.bathrooms && (
            <li className="feature">
              <Bath size={16} />
              <span>{property.bathrooms} Bath</span>
            </li>
          )}
          {property.area?.value && (
            <li className="feature">
              <Ruler size={16} />
              <span>
                {property.area.value} {property.area.unit || 'sqft'}
              </span>
            </li>
          )}
          <li className="feature">
            <Car size={16} />
            <span>{parkingCount} Parking</span>
          </li>
        </ul>

        {/* Details Row */}
        <div className="property-details-row">
          <div className="detail-item">
            <span className="detail-label">Details:</span>
            <span className="detail-value">
              {formattedPricePerSqft ? `₹${formattedPricePerSqft}/sq.ft` : 'N/A'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">
              {property.furnishing?.[0] || 'Unfurnished'}
              {property.possessionStatus?.[0] && `, ${property.possessionStatus[0]}`}
            </span>
          </div>
        </div>

        {/* Additional Info Pills */}
        {(property.ageOfProperty || property.balconies || property.floor) && (
          <div className="property-pills">
            {property.ageOfProperty && property.ageOfProperty !== 'New' && (
              <span className="info-pill">{property.ageOfProperty}</span>
            )}
            {property.balconies && (
              <span className="info-pill">{property.balconies} Balcony</span>
            )}
            {property.floor && <span className="info-pill">Floor {property.floor}</span>}
            {property.unitsAvailable && (
              <span className="info-pill">{property.unitsAvailable} Units Available</span>
            )}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className={`property-descriptionn ${expanded ? 'expanded' : ''}`}>
            <p>
              {expanded
                ? property.description
                : `${property.description?.substring(0, 120) || ''}...`}
            </p>
            {property.description.length > 120 && (
              <button
                type="button"
                className="toggle-descriptionn"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => !prev);
                }}
              >
                {expanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <footer className="property-footerr">
          <div className="property-actionss">
            <button
              type="button"
              className={`compare-action-button ${isInCompare ? 'in-compare' : ''}`}
              onClick={handleCompare}
              aria-pressed={isInCompare}
            >
              <Heart
                size={16}
                color={isInCompare ? '#D90429' : '#333'}
                fill={isInCompare ? '#D90429' : 'none'}
              />
              {isInCompare ? 'Compared' : 'Compare'}
            </button>
            <button
              type="button"
              className="contact-action-button"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement contact functionality
              }}
            >
              Contact
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default React.memo(PropertyCard);
