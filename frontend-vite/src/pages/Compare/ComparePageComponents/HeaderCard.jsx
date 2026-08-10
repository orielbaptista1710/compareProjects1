import { Trash2, MapPin } from "lucide-react";
import { getPropertyImage, getPropertyLocation } from "../../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../../utils/formatters";

const HeaderCard = ({ property, onRemove, onView }) => {
  const location = getPropertyLocation(property);
  return (
    <div className="header-card" onClick={() => onView(property._id)} style={{ cursor: "pointer" }}>
      <div className="header-card__img-wrap">
        <img
          src={getPropertyImage(property)}
          alt={property.title || "Property"}
          loading="lazy"
          className="header-card__img"
        />
        {property.featured && <span className="header-card__badge">Featured</span>}
      </div>

      <div className="header-card__body">
        <p className="header-card__type">{property.propertyType || "Property"}</p>
        <h3 className="header-card__title">{property.title?.slice(0, 48) || "Untitled"}</h3>
        <p className="header-card__dev">By {property.developerName || "Developer"}</p>

        {location && (
          <p className="header-card__loc">
            <MapPin size={12} strokeWidth={1.5} />
            {location}
          </p>
        )}

        <p className="header-card__price">{formatCurrencyShort(property.price)}</p>

        {property.reraApproved && <span className="header-card__rera">RERA ✓</span>}
      </div>

      <button
        className="header-card__remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(property._id);
        }}
        aria-label="Remove from comparison"
      >
        <Trash2 size={14} strokeWidth={1.5} />
        Remove
      </button>
    </div>
  );
};

export default HeaderCard;