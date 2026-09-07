import { useState, useCallback, memo } from "react";
import DevDashPropertyCard from "./DevDashPropertyCard.jsx";
import DeleteDialog from "./DeleteDialog.jsx";
import { defaultFormatPrice } from "../../utils/Propertyutils.js";

// ── Loading skeletons ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="prop-grid">
    {[0, 1, 2].map((i) => (
      <div key={i} className="prop-card prop-card--skeleton">
        <div className="skel skel--header" />
        <div className="skel skel--image" />
        <div className="skel skel--line" />
        <div className="skel skel--line skel--line-short" />
        <div className="skel skel--line" />
      </div>
    ))}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="empty-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
    <p className="empty-state__title">No properties yet</p>
    <p className="empty-state__sub">Submit your first property using the form above.</p>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = () => (
  <div className="error-alert" role="alert">
    Failed to load properties. Please refresh the page.
  </div>
);

/**
 * DevPropertyList
 *
 * Props:
 *   properties        — array of property objects from the API
 *   isLoading         — boolean
 *   isError           — boolean
 *   onEdit            — (property) => void
 *   onDelete          — (id) => void
 *   formatIndianPrice — optional custom price formatter, falls back to defaultFormatPrice
 */
const DevPropertyList = ({
  properties,
  isLoading,
  isError,
  onEdit,
  onDelete,
  formatIndianPrice,
}) => {
  const formatPrice = formatIndianPrice ?? defaultFormatPrice;

  // Delete confirmation state: null | { id, title }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const requestDelete = useCallback((id, title) => {
    setDeleteTarget({ id, title });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDelete]);

  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  if (isLoading) return <LoadingSkeleton />;
  if (isError)   return <ErrorState />;
  if (!properties?.length) return <EmptyState />;

  return (
    <>
      <div className="prop-grid">
        {properties.map((p) => (
          <DevDashPropertyCard
            key={p._id}
            p={p}
            onEdit={onEdit}
            onDelete={requestDelete}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};

export default memo(DevPropertyList);