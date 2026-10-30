import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';
import {
  Heart,
  Share2,
  CheckCircle,
  MapPin,
  Map as MapIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { getPropertyImage } from "../../../../utils/propertyHelpers";
import { formatCurrencyShort, formatParkingText } from "../../../../utils/formatters";
import { getPropertyLocation } from "../../../../utils/propertyHelpers";
import useHeartProperty from "../../../../hooks/useHeartProperty";

// Builds a unit-shaped object out of a flat (ungrouped) property, so the rest
// of this component never has to branch on "is this grouped or not" — every
// property, grouped or not, is rendered as "a project with 1+ units."
const toUnit = (property) => ({
  _id: property._id,
  slug: property.slug,
  bhk: property.bhk,
  area: property.area,
  price: property.price,
  bathrooms: property.bathrooms,
  parkings: property.parkings,
  facing: property.facing,
  balconies: property.balconies,
  floor: property.floor,
  totalFloors: property.totalFloors,
  wing: property.wing,
  tower: property.tower,
  phase: property.phase,
  image: getPropertyImage(property),
});

function PropertyCard({
  property,
  addToCompare,
  goToComparePage,
  cardType,
  compareIds,
  isInCompare,
  showCompareBtn = true,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tileRefs = useRef([]);
  const configRowRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canPrev: false, canNext: false });

  // Grouped projects (from the Properties listing endpoint) already carry
  // `units`, sorted cheapest-first by the backend. Anything else (featured/
  // recent/related/shortlist/dev-dashboard cards, all still flat properties)
  // gets wrapped as a single-unit "project" so every code path below is
  // identical regardless of where the card is used.
  const units = useMemo(
    () => (property?.units?.length ? property.units : [toUnit(property ?? {})]),
    [property]
  );
  const isGrouped = units.length > 1;

  const selectedUnit = units[selectedIndex] ?? units[0];

  // The view the rest of the card renders from: shared project fields
  // (title, location, amenities…) plus whichever unit is currently selected.
  // For a single-unit card this is just `property` again — identical to the
  // old flat rendering.
  const effective = useMemo(
    () => ({ ...property, ...selectedUnit }),
    [property, selectedUnit]
  );

  const { isSaved, handleToggleHeart } = useHeartProperty(effective?._id);

  const isCompared = useMemo(() => {
    if (compareIds) return compareIds.has(effective?._id?.toString());
    return !!isInCompare;
  }, [compareIds, isInCompare, effective]);

  const handleCompare = useCallback(
    (e) => {
      e.stopPropagation();
      if (addToCompare) addToCompare(effective);
      if (goToComparePage && isCompared) goToComparePage();
    },
    [addToCompare, goToComparePage, isCompared, effective]
  );

  const handleCardClick = useCallback(
    (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      if (effective?._id) {
        navigate(`/property/${effective._id}`);
      }
    },
    [navigate, effective]
  );

  // Roving focus across configuration tiles (flat — one per unit, exactly
  // like the project's original BHK-tile design).
  const handleTileKeyDown = useCallback(
    (e, idx) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + units.length) % units.length;
      setSelectedIndex(next);
      tileRefs.current[next]?.focus();
      // Optional call, not just optional chaining on the element — jsdom
      // (used in tests) doesn't implement scrollIntoView at all.
      tileRefs.current[next]?.scrollIntoView?.({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    },
    [units.length]
  );

  // Configuration tiles scroll horizontally instead of wrapping onto more
  // rows, so a project with many units at the same BHK (different areas)
  // stays a single, scannable row — "slider" nav buttons only appear once
  // there's actually more to scroll to.
  const updateScrollState = useCallback(() => {
    const el = configRowRef.current;
    if (!el) return;
    setScrollState({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = configRowRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [units, updateScrollState]);

  const scrollConfigs = useCallback((direction) => {
    configRowRef.current?.scrollBy({ left: direction * 180, behavior: 'smooth' });
  }, []);

  const handleImageError = useCallback(() => setImageError(true), []);

  const shareProperty = useCallback(
    (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}/property/${effective._id}`;
      if (navigator.share) {
        navigator.share({ title: property.title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    },
    [property, effective]
  );

  const imageUrl = useMemo(() => {
    if (imageError) return getPropertyImage(null);
    return getPropertyImage(property);
  }, [imageError, property]);

  const location = getPropertyLocation(property);

  if (!property) return <p role="alert">Invalid property data</p>;

  // The hero price always reflects whichever unit is currently selected
  // (defaults to the cheapest, index 0) — picking a different configuration
  // tile swaps it. The "Starting From" badge is the project's price range
  // (minPrice), shown alongside it only when there's an actual range to
  // anchor against; a single-unit card never shows it, so it looks exactly
  // like it did before grouping existed.
  const formattedPrice = formatCurrencyShort(effective.price);
  const showStartingFrom =
    isGrouped && property.minPrice != null && property.maxPrice != null && property.minPrice !== property.maxPrice;

  const displayTitle = isGrouped ? (property.projectName || property.title) : property.title;

  const descLimit = 140;
  const hasLongDesc = property.description?.length > descLimit;

  const developerAvatarSrc = property.developerAvatar?.thumbnail || property.developerAvatar?.url;
  const possessionDate = property.reraDate
    ? new Date(property.reraDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  // One compact line instead of separate stats/feature blocks — possession
  // status, unit count, parking, bathrooms, facing and furnishing all live
  // together here to keep the card narrow.
  const metaLineText = [
    property.possessionStatus && (possessionDate ? `${property.possessionStatus} · ${possessionDate}` : property.possessionStatus),
    property.unitsAvailable && `${property.unitsAvailable} Units`,
    formatParkingText(effective.parkings),
    effective.bathrooms && `${effective.bathrooms} Bath`,
    effective.facing && `${effective.facing} Facing`,
    property.furnishing,
  ].filter(Boolean).join(' · ');

  return (
    <article
      className={`pc-card ${cardType === 'compare' ? 'pc-compare' : ''} ${isCompared ? 'pc-in-compare' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      aria-label={`Property: ${displayTitle || 'Untitled Property'}`}
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
          alt={displayTitle || 'Property'}
          className="pc-img"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* ── Content Column ── */}
      <div className="pc-content">

        {/* Header — developer logo (when available) + eyebrow + title */}
        <div className="pc-header-row">
          {developerAvatarSrc && (
            <div className="pc-dev-avatar">
              <img src={developerAvatarSrc} alt={property.developerName || 'Developer'} />
            </div>
          )}
          <div className="pc-header-text">
            {isGrouped && property.bhkList?.length > 0 && (
              <div className="pc-eyebrow">{property.bhkList.join(', ')} BHK Flats in</div>
            )}
            <h2 className="pc-title">{displayTitle || 'Untitled Property'}</h2>
          </div>
        </div>

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
            <MapIcon size={13} />
            See on Map
          </a>
        </div>

        {/* Price — hero. Reflects the selected unit; "Starting From" anchors
            it to the project's cheapest unit when the price actually varies. */}
        <div className="pc-price-block">
          {showStartingFrom && (
            <span className="pc-price-label">Starting From {formatCurrencyShort(property.minPrice)}</span>
          )}
          <span className="pc-price">{formattedPrice}</span>
          {property.emiStarts && (
            <span className="pc-emi">EMI from ₹{property.emiStarts}/mo</span>
          )}
        </div>

        {/* One compact line — possession status, units, parking, bathrooms,
            facing, furnishing — instead of separate stat/feature blocks. */}
        {metaLineText && <div className="pc-meta-row">{metaLineText}</div>}

        {/* Configurations — one tile per unit (BHK · price, area below), in a
            horizontally scrolling row rather than wrapping, so a project with
            many units doesn't turn into a wall of repeated chips. */}
        <div className="pc-config-section">
          <div className="pc-config-label">Available Configurations</div>
          <div className="pc-config-wrap">
            <div className="pc-config-row" ref={configRowRef} role="group" aria-label="Choose a configuration">
              {units.map((unit, idx) => (
                <button
                  key={unit._id ?? idx}
                  type="button"
                  ref={(el) => { tileRefs.current[idx] = el; }}
                  className={`pc-config-tile ${idx === selectedIndex ? 'pc-config-tile--active' : ''}`}
                  aria-pressed={idx === selectedIndex}
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(idx); }}
                  onKeyDown={(e) => handleTileKeyDown(e, idx)}
                >
                  <span className="pc-config-tile__top">
                    {unit.bhk ? `${unit.bhk} BHK` : 'Unit'}
                    {unit.price != null && ` · ${formatCurrencyShort(unit.price)}`}
                  </span>
                  {unit.area?.value && (
                    <span className="pc-config-tile__sub">
                      {unit.area.value} {unit.area.unit || 'Sq.Ft.'}
                      <ChevronDown size={12} strokeWidth={2} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {scrollState.canPrev && (
              <button
                type="button"
                className="pc-config-nav pc-config-nav--prev"
                onClick={(e) => { e.stopPropagation(); scrollConfigs(-1); }}
                aria-label="Show previous configurations"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {scrollState.canNext && (
              <button
                type="button"
                className="pc-config-nav pc-config-nav--next"
                onClick={(e) => { e.stopPropagation(); scrollConfigs(1); }}
                aria-label="Show more configurations"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
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
        {(property.developerName || property.pricePerSqft) && (
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
          </div>
        )}

        {/* Footer */}
        <footer className="pc-footer">
          {showCompareBtn && (
          <button
            type="button"
            className={`pc-btn-compare ${isCompared ? 'active' : ''}`}
            onClick={handleCompare}
            aria-pressed={isCompared}
          >
            {isCompared ? 'Compared ✓' : '+ Compare'}
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
