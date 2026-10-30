import { X, MapPin, Camera } from "lucide-react";
import { getOptimizedPropertyImage, getPropertyLocation } from "../../../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../../../utils/formatters";
import { getPricePerSqft } from "../../config/compareSections";

const HeaderCard = ({ property, onRemove, onView }) => {
  const location = getPropertyLocation(property);
  const photoCount = property.galleryImages?.length ?? 0;
  const pricePerSqft = getPricePerSqft(property);

  return (
    <div className="header-card" onClick={() => onView(property._id)}>
      <div className="header-card__img-wrap">
        <img
          src={getOptimizedPropertyImage(property, { width: 480, height: 360 })}
          alt={property.title || "Property"}
          loading="lazy"
          width="480"
          height="360"
          className="header-card__img"
        />
        {photoCount > 1 && (
          <span className="header-card__photos">
            <Camera size={12} strokeWidth={1.5} aria-hidden="true" /> {photoCount} Photos
          </span>
        )}
        <button
          type="button"
          className="header-card__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(property._id);
          }}
          aria-label="Remove from comparison"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="header-card__body">
        <h3 className="header-card__title">{property.title || "Untitled"}</h3>
        <p className="header-card__type">
          {property.propertyType || "Property"}
          {property.developerName && ` · By ${property.developerName}`}
        </p>
        {location && (
          <p className="header-card__loc">
            <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
            {location}
          </p>
        )}
        <p className="header-card__price">
          {formatCurrencyShort(property.price)}
          {pricePerSqft && <span className="header-card__ppsf">({pricePerSqft})</span>}
        </p>
      </div>
    </div>
  );
};

export default HeaderCard;
