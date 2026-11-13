// features/developer-dashboard/property-form/components/PageHeader.jsx
// Breadcrumb, page title and the form's actions. "Publish listing" is the
// form's submit button; it stays disabled until propertySchema accepts every
// field, and the helper text says why.

const PageHeader = ({
  isEditing,
  canPublish,
  needsFixes,
  isSubmitting,
  isAdding,
  isUpdating,
  onSaveDraft,
  onCancel,
  onShowListings,
}) => {
  const submitLabel = isEditing
    ? isUpdating ? "Updating…" : "Update listing"
    : isAdding ? "Publishing…" : "Publish listing";

  return (
    <header className="spf-page-header">
      <div className="spf-page-header__text">
        <nav aria-label="Breadcrumb" className="spf-breadcrumb">
          <ol>
            <li>
              {onShowListings ? (
                <button type="button" className="spf-breadcrumb__link" onClick={onShowListings}>
                  Listings
                </button>
              ) : (
                <span>Listings</span>
              )}
            </li>
            <li aria-current="page">{isEditing ? "Edit listing" : "New listing"}</li>
          </ol>
        </nav>
        <h1 className="spf-page-header__title">
          {isEditing ? "Edit listing" : "List a property for sale"}
        </h1>
      </div>

      <div className="spf-page-header__actions">
        {!canPublish && (
          <p className="spf-page-header__hint" id="spf-publish-hint">
            {needsFixes
              ? "Fix the fields marked in the checklist to publish"
              : "Complete every section to publish"}
          </p>
        )}
        {isEditing && (
          <button type="button" className="spf-btn spf-btn--quiet" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="button" className="spf-btn spf-btn--secondary" onClick={onSaveDraft} disabled={isSubmitting}>
          Save draft
        </button>
        <button
          type="submit"
          className="spf-btn spf-btn--primary"
          disabled={!canPublish || isSubmitting}
          aria-busy={isSubmitting}
          aria-describedby={canPublish ? undefined : "spf-publish-hint"}
        >
          {submitLabel}
        </button>
      </div>
    </header>
  );
};

export default PageHeader;
