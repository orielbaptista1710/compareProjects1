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
  Map,
} from 'lucide-react';

import { getPropertyImage } from "../../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyLocation } from "../../../utils/propertyHelpers";
import useHeartProperty from "../../../hooks/useHeartProperty";

function PropertyCard({
  property,
  addToCompare,
  goToComparePage,
  cardType,
  isInCompare,
  showCompareBtn = true,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  // const [isLiked, setIsLiked] = useState(false);

  const { isSaved, handleToggleHeart } = useHeartProperty(property?._id);

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

      console.log("PROPERTY OBJECT:", property);
      console.log("_id:", property?._id);
      console.log("userId:", property?.userId);

        if (property?._id) 
          console.log("Navigating to:", `/property/${property._id}`);
          navigate(`/property/${property._id}`);
      }
    },
    [navigate, property]
  );

  const handleImageError = useCallback(() => setImageError(true), []);

  const shareProperty = useCallback(
    (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}/property/${property._id}`;
      if (navigator.share) {
        navigator.share({ title: property.title, url }).catch(console.error);
      } else {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    },
    [property]
  );

  const imageUrl = useMemo(() => {
    if (imageError) return getPropertyImage(null);
    return getPropertyImage(property);
  }, [imageError, property]);

  const location = getPropertyLocation(property);
  const formattedPrice = formatCurrencyShort(property.price);

  if (!property) return <p role="alert">Invalid property data</p>;

  const descLimit = 140;
  const hasLongDesc = property.description?.length > descLimit;

  

  return (
    <article
      className={`pc-card ${cardType === 'compare' ? 'pc-compare' : ''} ${isInCompare ? 'pc-in-compare' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      aria-label={`Property: ${property.title}`}
    >
      {/* ── Image Column ── */}
      <div className="pc-img-col">


        {property.reraApproved && (
          <div className="pc-rera-badge" title={`RERA: ${property.reraNumber || 'Approved'}`}>
            <CheckCircle size={11} /> RERA
          </div>
        )}

        <div className="pc-img-actions">

          <button
            type="button"
            className={`pc-icon-btn ${isSaved ? 'pc-liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleHeart();
            }}
            aria-label={isSaved ? 'Unlike' : 'Save'}
          >
            <Heart
              size={16}
              strokeWidth={1.8}
              fill={isSaved ? '#D90429' : 'none'}
              color={isSaved ? '#D90429' : '#fff'}
            />
          </button>

          <button
            type="button"
            className="pc-icon-btn"
            onClick={shareProperty}
            aria-label="Share"
          >
            <Share2 size={15} strokeWidth={1.8} color="#fff" />
          </button>
        </div>

        <img
          src={imageUrl}
          alt={property.title || 'Property'}
          className="pc-img"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* ── Content Column ── */}
      <div className="pc-content">

        {/* Title */}
        <h2 className="pc-title">{property.title || 'Untitled Property'}</h2>

        {/* Location row */}
        <div className="pc-loc-row">
          {location && (
            <span className="pc-location">
              <MapPin size={13} />
              {location}
            </span>
          )}
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pc-map-link"
            onClick={(e) => e.stopPropagation()}
          >
            <Map size={13} />
            See on Map
          </a>
        </div>

        {/* Price — hero */}
        <div className="pc-price-block">
          <span className="pc-price">{formattedPrice}</span>
          {property.emiStarts && (
            <span className="pc-emi">EMI from ₹{property.emiStarts}/mo</span>
          )}
        </div>

        {/* Features */}
        <div className="pc-features">
          {property.bhk && (
            <div className="pc-feat">
              <BedDouble size={22} strokeWidth={1.3} className="pc-feat-icon" />
              <div>
                <div className="pc-feat-val">{property.bhk} BHK</div>
                <div className="pc-feat-sub">Bedrooms</div>
              </div>
            </div>
          )}
          {property.area?.value && (
            <div className="pc-feat">
              <Ruler size={22} strokeWidth={1.3} className="pc-feat-icon" />
              <div>
                <div className="pc-feat-val">{property.area.value} {property.area.unit || 'Sq.Ft.'}</div>
                <div className="pc-feat-sub">{property.areaType || 'Built-up Area'}</div>
              </div>
            </div>
          )}
          {property.bathrooms && (
            <div className="pc-feat">
              <Bath size={22} strokeWidth={1.3} className="pc-feat-icon" />
              <div>
                <div className="pc-feat-val">{property.bathrooms} Bath</div>
                <div className="pc-feat-sub">Bathrooms</div>
              </div>
            </div>
          )}
          {property.facing && (
            <div className="pc-feat">
              <Compass size={22} strokeWidth={1.3} className="pc-feat-icon" />
              <div>
                <div className="pc-feat-val">{property.facing} View</div>
                <div className="pc-feat-sub">Facing</div>
              </div>
            </div>
          )}
          {property.parkings && (
            <div className="pc-feat">
              <Car size={22} strokeWidth={1.3} className="pc-feat-icon" />
              <div>
                <div className="pc-feat-val">{property.parkings} Parking</div>
                <div className="pc-feat-sub">Covered</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <p className="pc-desc">
            {expanded || !hasLongDesc
              ? property.description
              : `${property.description.substring(0, descLimit)}...`}
            {hasLongDesc && (
              <button
                type="button"
                className="pc-read-more"
                onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
              >
                {expanded ? 'Show less' : 'Read More'}
              </button>
            )}
          </p>
        )}

        {/* Tags — from property.tags array OR derived from amenities */}
        {property.tags?.length > 0 && (
          <div className="pc-tags">
            {property.tags.map((tag) => (
              <span key={tag} className="pc-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Secondary meta strip */}
        {(property.developerName || property.possessionStatus || property.furnishing || property.pricePerSqft) && (
          <div className="pc-meta-strip">
            {property.developerName && (
              <span className="pc-meta-item">
                <span className="pc-meta-label">By</span> {property.developerName}
              </span>
            )}
            {property.pricePerSqft && (
              <span className="pc-meta-item">
                <span className="pc-meta-label">₹{property.pricePerSqft}</span>/sq.ft
              </span>
            )}
            {property.possessionStatus && (
              <span className="pc-meta-item">{property.possessionStatus}</span>
            )}
            {property.furnishing && (
              <span className="pc-meta-item">{property.furnishing}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pc-footer">
          {showCompareBtn && (
          <button
            type="button"
            className={`pc-btn-compare ${isInCompare ? 'active' : ''}`}
            onClick={handleCompare}
            aria-pressed={isInCompare}
          >
            {isInCompare ? 'Compared ✓' : '+ Compare'}
          </button>
        )}

          <button
            type="button"
            className="pc-btn-contact"
            onClick={(e) => e.stopPropagation()}
          >
            Contact {property.developerName ? 'Builder' : 'Owner'}
          </button>
        </footer>

      </div>
    </article>
  );
}

export default React.memo(PropertyCard);