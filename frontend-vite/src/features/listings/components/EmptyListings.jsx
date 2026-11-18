// src/features/listings/components/EmptyListings.jsx
// "No listings yet" with one action, shared by every listings dashboard.
// ListingCard.css first: it defines the .lc-btn this button uses, and
// ListingsGrid.css overrides one property of it.
import "./ListingCard.css";
import "./ListingsGrid.css";

const EmptyListings = ({ title, text, actionLabel, onAction }) => (
  <div className="lg-empty">
    <h3 className="lg-empty__title">{title}</h3>
    <p className="lg-empty__text">{text}</p>
    <button type="button" className="lc-btn lc-btn--primary lg-empty__action" onClick={onAction}>
      {actionLabel}
    </button>
  </div>
);

export default EmptyListings;
