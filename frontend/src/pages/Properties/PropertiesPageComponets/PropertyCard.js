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
  Compass,
} from 'lucide-react';

import { getPropertyImage } from "../../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyLocation } from"../../../utils/propertyHelpers";

function PropertyCard({
  property,
  addToCompare,
  goToComparePage,
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
  if (imageError) return getPropertyImage(null);
  return getPropertyImage(property);
}, [imageError, property]);

  const location = getPropertyLocation(property);

  const formattedPrice = formatCurrencyShort(property.price);

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
            
            <h2 className="property-titlee">
              {property.title || "Untitled Property"}
            </h2>

            <div className="property-pricee">
              <span className="price-amount">{formattedPrice}</span>
              {property.emiStarts && (
  <span className="price-per-sqft">
    EMI starts at ₹ {property.emiStarts}
  </span>
)}

            </div>
          </div>
          <div className="more-details">

            {location && (
              <p className="property-locationn">
                <MapPin /> {location}
              </p>
            )}

            {property.developerName && (
              <p className="property-agentt">By {property.developerName}</p>
            )}

          </div>
        </header>

        {/* Features */}
        <ul className="property-featuress">
          
          {property.bhk && (
            <li className="feature">
              <BedDouble />
              <span>{property.bhk} BHK</span>
            </li>
          )}

          {property.bathrooms && (
            <li className="feature">
              <Bath />
              <span>{property.bathrooms} Bath</span>
            </li>
          )}
          {property.area?.value && (
            <li className="feature">
              <Ruler />
              <span>
                {property.area.value} {property.area.unit || 'sqft'}
              </span>
            </li>
          )}

          {property.parkings && (
            <li className="feature">
              <Car />
              <span>{property.parkings}</span>
            </li>
          )}


          {property.parkings && (
            <li className="feature">
              <Compass />
              <span>{property.facing} Facing</span>
            </li>
          )}

        </ul>

        {/* Details Row */}
        <div className="property-details-row">
  <div className="property-card-detail-item">

    {property.pricePerSqft && (
  <>
    <span className="property-card-detail-label">Price/Sqft:</span>
    <span className="property-card-detail-value">
      ₹{property.pricePerSqft}/sq.ft
    </span>
  </>
)}


    {property.possessionStatus && (
      <>
        <span className="property-card-detail-label">Status:</span>
        <span className="property-card-detail-value">
          {property.possessionStatus}
        </span>
      </>
    )}

    {property.furnishing && (
      <>
        <span className="property-card-detail-label">Furnishing:</span>
        <span className="property-card-detail-value">
          {property.furnishing}
        </span>
      </>
    )}

  </div>
</div>


        {/* Additional Info Pills */}
        {(property.propertyGroup || property.balconies || property.floor) && (
          <div className="property-pills">
            {property.propertyGroup && (
              <span className="info-pill">{property.propertyGroup}</span>
            )}
            {property.balconies && (
              <span className="info-pill">{property.balconies} Balcony</span>
            )}
            {property.totalFloors && <span className="info-pill">totalFloors {property.totalFloors}</span>}
            {property.floor && <span className="info-pill">Floor {property.floor}</span>}
            {property.floorLabel && <span className="info-pill">{property.floorLabel}</span>}
            {property.unitsAvailable && (
              <span className="info-pill">{property.unitsAvailable} Units Available</span>
            )}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className={`property-description ${expanded ? 'expanded' : ''}`}>
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
