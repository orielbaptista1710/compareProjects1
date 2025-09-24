import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faBed } from "@fortawesome/free-solid-svg-icons/faBed";
import { faBath } from "@fortawesome/free-solid-svg-icons/faBath";
import { faCompass } from "@fortawesome/free-solid-svg-icons/faCompass";
import { faHome } from "@fortawesome/free-solid-svg-icons/faHome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons/faCalendarAlt";
import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faCodeCompare } from "@fortawesome/free-solid-svg-icons/faCodeCompare";
import { faCar } from "@fortawesome/free-solid-svg-icons/faCar";
import { faCouch } from "@fortawesome/free-solid-svg-icons/faCouch";
import { faHeart } from "@fortawesome/free-solid-svg-icons/faHeart";
import { faShareAlt } from "@fortawesome/free-solid-svg-icons/faShareAlt";
import { faRulerCombined } from "@fortawesome/free-solid-svg-icons/faRulerCombined";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons/faCircleCheck";


const placeholderImage =
  'https://via.placeholder.com/400x300?text=Property+Image';

function PropertyCard({
  property,
  addToCompare,
  goToComparePage,
  onRemove,
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
        } else {
          console.error('Property ID is missing');
        }
      }
    },
    [navigate, property]
  );

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const toggleLike = useCallback(
    (e) => {
      e.stopPropagation();
      setIsLiked((prev) => !prev);
    },
    []
  );

  const shareProperty = useCallback(
    (e) => {
      e.stopPropagation();
      const shareData = {
        title: property.title,
        text: property.description?.substring(0, 100) || '',
        url: `${window.location.origin}/property/${property._id}`,
      };
      if (navigator.share) {
        navigator.share(shareData).catch((error) =>
          console.log('Error sharing', error)
        );
      } else {
        navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    },
    [property]
  );

  /** ======================
   *  FORMATTERS (memoized)
   * ====================== */
  const location = useMemo(
    () => `${property.locality}, ${property.city}, ${property.state}`,
    [property.locality, property.city, property.state]
  );

  const imageUrl = useMemo(() => {
    if (imageError || !property.coverImage) return placeholderImage;
    return `${process.env.REACT_APP_API_URL}/uploads/${property.coverImage}`;
  }, [imageError, property.coverImage]);

  const formattedPrice = useMemo(() => {
    const price = property.price;
    if (typeof price !== 'number' || isNaN(price)) return 'Price on Request';

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
      maximumFractionDigits: 0,
    }).format(price);
  }, [property.price]);

  // const pricePerSqFt = useMemo(() => {
  //   if (!property.price || !property.area) return null;
  //   const perSqFt = Math.round(property.price / property.area);
  //   return `₹${perSqFt.toLocaleString('en-IN')}/sq.ft`;
  // }, [property.price, property.area]);


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
      {/* Remove button (for compare view) */}
      {onRemove && (
        <button
          type="button"
          className="close-button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(property._id);
          }}
          aria-label="Remove property from list"
        >
          &times;
        </button>
      )}

      {/* Image Section */}
      <div className="card-image-container">
        {property.propertyType && (
          <span className="property-type-badge">{property.propertyType}</span>
        )}
        <div className="image-actions">
          <button
            type="button"
            className={`image-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={toggleLike}
            aria-pressed={isLiked}
            aria-label={isLiked ? 'Unlike property' : 'Like property'}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button
            type="button"
            className="image-action-btn"
            onClick={shareProperty}
            aria-label="Share property"
          >
            <FontAwesomeIcon icon={faShareAlt} />
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
              {formattedPrice}
              {<span className="price-per-sqft">₹{property.pricePerSqft || 'N/A'} /{property.area.unit|| 'sqft'}</span>}
            </div>
          </div>
          <div className="more-details">
            <p className="property-locationn">
              <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />{' '}
              {location}
            </p>
            {property.developerName  && (
              <div className="property-agentt">By {property.developerName || 'N/A' }</div>
            )}
          </div>
        </header>

        {/* Features */}
        <ul className="property-featuress">
          <li className="feature">
            <FontAwesomeIcon icon={faBed} aria-hidden="true" />
            <span>{property.bhk || 'N/A'} BHK</span>
          </li>
          <li className="feature">
            <FontAwesomeIcon icon={faBath} aria-hidden="true" />
            <span>{property.bathrooms || 'N/A'} Bath</span>
          </li>

          <li className="feature">
            <FontAwesomeIcon icon={faRulerCombined} aria-hidden="true" />
            <span>{property.area.value || 'N/A'} {property.area.unit || 'sqft'}</span>
          </li>
          <li className="feature">
            <FontAwesomeIcon icon={faCompass} aria-hidden="true" />
            <span>{property.facing || 'N/A'} Facing</span>
          </li>
          <li className="feature">
            <FontAwesomeIcon icon={faHome} aria-hidden="true" />
            <span>{property.balconies || 'N/A'} Balcony</span>
          </li>
          <li className="feature">
            <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
            <span>{property.ageOfProperty || 'N/A'} </span>
          </li>


          {/* //// parking is saved in string figure out how to deal with this for filter n propertyCard */}
          <li className="feature">
            <FontAwesomeIcon icon={faCar} aria-hidden="true" />
            <span>{property.parkings || 'No Parking'}</span>
          </li>



          <li className="feature">
            <FontAwesomeIcon icon={faCalendarAlt} aria-hidden="true" />
            <span>{property.possessionStatus?.[0] || 'N/A'}</span>
          </li>
          <li className="feature">
            <FontAwesomeIcon icon={faCouch} aria-hidden="true" />
            <span>{property.furnishing?.[0] || 'N/A'}</span>
          </li>

        </ul>

        {/* Description */}
        <div
          className={`property-descriptionn ${expanded ? 'expanded' : ''}`}
          aria-expanded={expanded}
        >
          <p>
            {expanded
              ? property.description
              : `${property.description?.substring(0, 100) || ''}...`}
          </p>
          {property.description && property.description.length > 100 && (
            <button
              type="button"
              className="toggle-descriptionn"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              aria-label={expanded ? 'Collapse description' : 'Expand description'}
            >
              {expanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="property-footerr">
          <div className="property-actionss">
            <button
              type="button"
              className={`compare-action-button ${isInCompare ? 'in-compare' : ''}`}
              onClick={handleCompare}
              aria-pressed={isInCompare}
            >
              <FontAwesomeIcon
                className="contact-custom-btn-icon"
                icon={faCodeCompare}
                aria-hidden="true"
              />
              {isInCompare ? 'Comparing' : 'Compare'}
            </button>
            <button
              type="button"
              className="contact-action-button"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement contact functionality
              }}
            >
              <FontAwesomeIcon
                className="contact-custom-btn-icon"
                icon={faPhone}
                aria-hidden="true"
              />
              Contact Seller
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default React.memo(PropertyCard);
