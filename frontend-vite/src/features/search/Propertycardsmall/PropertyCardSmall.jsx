// frontend-vite/src/features/search/Propertycardsmall/PropertyCardSmall.jsx
// One result row in the home search dropdown (ExpandableSearch).
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import "./PropertyCardSmall.css";
import { useCompare } from "../../../contexts/CompareContext";
import { posterOf, POSTER, POSTER_LABELS } from "../../../constants/roles";
import { formatCurrencyShort } from "../../../utils/formatters";
import { getOptimizedPropertyImage, fallbackImg } from "../../../utils/propertyHelpers";

// disableNavigation — pass true when the parent (e.g. ExpandableSearch) owns
// routing.  This prevents the card's own navigate() from firing alongside the
// parent's handler and causing a double-navigation race.
const PropertyCardSmall = ({ property, disableNavigation = false }) => {
  const { addToCompare } = useCompare();
  const navigate = useNavigate();

  // Sized for the 112×84 thumbnail at 2x.
  const imageUrl = getOptimizedPropertyImage(property, { width: 240, height: 180 });

  // Short project name when the poster gave one, otherwise the listing title.
  const name = property?.projectName || property?.title || "Untitled Property";
  const place = [property?.locality, property?.city].filter(Boolean).join(", ");
  const poster =
    posterOf(property) === POSTER.BUILDER && property?.developerName
      ? `by ${property.developerName}`
      : `Posted by ${POSTER_LABELS[posterOf(property)]}`;

  const handleCardClick = () => {
    if (!disableNavigation) {
      navigate(`/property/${property?._id}`);
    }
    // When disableNavigation is true, the parent's onClick on the wrapper
    // handles routing.  We do nothing here so there's one navigation, not two.
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleCardClick();
  };

  return (
    <div
      className="psm-card"
      role={disableNavigation ? "presentation" : "button"}
      tabIndex={disableNavigation ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
    >
      <div className="psm-image">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
          }}
        />
      </div>

      <div className="psm-content">
        <h3 className="psm-title">{name}</h3>

        <p className="psm-meta">
          <MapPin size={14} aria-hidden="true" className="psm-meta-icon" />
          <span className="psm-meta-text">
            {place && <>{place} · </>}
            {poster}
          </span>
        </p>

        {(property?.possessionStatus || property?.bhk) && (
          <div className="psm-facts">
            {property?.possessionStatus && (
              <span className="psm-tag">{property.possessionStatus}</span>
            )}
            {property?.bhk ? <span className="psm-fact">{property.bhk} BHK</span> : null}
          </div>
        )}
      </div>

      <div className="psm-side">
        <div className="psm-price">{formatCurrencyShort(property?.price)}</div>

        <button
          className="psm-compare-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // prevent card click / parent click
            addToCompare(property);
          }}
        >
          <Plus size={14} aria-hidden="true" />
          Compare
        </button>
      </div>
    </div>
  );
};

export default memo(PropertyCardSmall);
