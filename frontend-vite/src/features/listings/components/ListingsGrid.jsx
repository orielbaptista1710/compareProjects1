// src/features/listings/components/ListingsGrid.jsx
//
// The "my listings" grid: loading skeleton, error and empty states, the cards,
// and the "delete this listing?" confirmation. The caller passes what to say in
// the empty state, since the first action differs per dashboard.
import { useCallback, useEffect, useState } from "react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import ListingCard from "./ListingCard";
import "./ListingsGrid.css";

const Skeleton = () => (
  <div className="lg-grid" aria-hidden="true">
    {[0, 1, 2].map((i) => <div key={i} className="lg-skeleton" />)}
  </div>
);

const ConfirmDelete = ({ target, onConfirm, onCancel }) => {
  useEscapeKey(Boolean(target), onCancel);

  // Keep the page behind from scrolling while the dialog is open
  useEffect(() => {
    if (!target) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [target]);

  if (!target) return null;
  return (
    <div className="lg-backdrop" onClick={onCancel}>
      <div
        className="lg-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lg-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="lg-dialog-title" className="lg-dialog__title">Delete this listing?</h3>
        <p className="lg-dialog__body">
          <strong>{target.title}</strong> will be permanently deleted. This can&apos;t be undone.
        </p>
        <div className="lg-dialog__actions">
          <button type="button" className="lc-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="lc-btn lc-btn--danger" onClick={onConfirm} autoFocus>Delete</button>
        </div>
      </div>
    </div>
  );
};

/**
 * @param {object[]} listings
 * @param {boolean}  isLoading
 * @param {boolean}  isError
 * @param {Function} onEdit    (listing) => void
 * @param {Function} onDelete  (id) => void
 * @param {React.ReactNode} empty  shown when there are no listings
 */
const ListingsGrid = ({ listings, isLoading, isError, onEdit, onDelete, empty }) => {
  const [target, setTarget] = useState(null); // { id, title } | null

  const request = useCallback((id, title) => setTarget({ id, title }), []);
  const cancel = useCallback(() => setTarget(null), []);
  const confirm = useCallback(() => {
    if (target) onDelete(target.id);
    setTarget(null);
  }, [target, onDelete]);

  if (isLoading) return <Skeleton />;
  if (isError) {
    return <p className="lg-error" role="alert">We couldn&apos;t load your listings. Please refresh the page.</p>;
  }
  if (!listings?.length) return empty;

  return (
    <>
      <div className="lg-grid">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} onEdit={onEdit} onDelete={request} />
        ))}
      </div>
      <ConfirmDelete target={target} onConfirm={confirm} onCancel={cancel} />
    </>
  );
};

export default ListingsGrid;
