import { Plus, Sparkles } from "lucide-react";
import AddSlot from "../AddSlot/AddSlot";
import { getOptimizedPropertyImage, getPropertyLocation } from "../../../../utils/propertyHelpers";
import { formatCurrencyShort } from "../../../../utils/formatters";
import "./RecommendedSlot.css";

// A suggested property shown in an empty compare slot.
export const RecommendedSlot = ({ property, onAdd, onView }) => {
  const title = property.title || "Untitled";
  const location = getPropertyLocation(property);

  return (
    <div className="rec-slot">
      <button type="button" className="rec-slot__media" onClick={() => onView(property._id)} aria-label={`View ${title}`}>
        <img
          src={getOptimizedPropertyImage(property, { width: 240, height: 180 })}
          alt=""
          loading="lazy"
          width="240"
          height="180"
        />
        <span className="rec-slot__badge">
          <Sparkles size={11} strokeWidth={2} aria-hidden="true" /> Recommended
        </span>
      </button>

      <div className="rec-slot__body">
        <p className="rec-slot__title">{title}</p>
        {location && <p className="rec-slot__loc">{location}</p>}
        <p className="rec-slot__price">{formatCurrencyShort(property.price)}</p>
        <button type="button" className="rec-slot__add" onClick={() => onAdd(property)}>
          <Plus size={14} strokeWidth={2} aria-hidden="true" /> Add to compare
        </button>
      </div>
    </div>
  );
};

// What an empty slot shows: a placeholder while suggestions load, a
// suggestion if there is one, otherwise the plain "Add Property" slot.
export const EmptySlot = ({ recommendation, loading, onAdd, onView, onBrowse }) => {
  if (loading) return <div className="rec-slot rec-slot--loading" aria-hidden="true" />;
  if (recommendation) return <RecommendedSlot property={recommendation} onAdd={onAdd} onView={onView} />;
  return <AddSlot onClick={onBrowse} />;
};
