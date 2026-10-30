import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import "./Compare.css";

import CompareSummary from "../../features/compare/components/CompareSummary/CompareSummary";
import CompareEmptyState from "../../features/compare/components/CompareEmptyState/CompareEmptyState";
import CompareTable from "../../features/compare/components/CompareTable/CompareTable";
import CompareSectionNav from "../../features/compare/components/CompareSectionNav/CompareSectionNav";
import CompareErrorBoundary from "../../features/compare/components/CompareErrorBoundary/CompareErrorBoundary";
import AddSlot from "../../features/compare/components/AddSlot/AddSlot";
import { EmptySlot, RecommendedSlot } from "../../features/compare/components/RecommendedSlot/RecommendedSlot";
import { buildCompareModel } from "../../features/compare/model/buildCompareModel";
import { useCompareRecommendations } from "../../features/compare/hooks/useCompareRecommendations";
import { MAX_COMPARE } from "../../hooks/useCompareList";

function Compare({ compareList, setCompareList, removeFromCompare, addToCompare }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Drop empty entries (old or corrupted saved list) so table columns and
  // model cells always line up.
  const properties = useMemo(() => compareList.filter((p) => p?._id), [compareList]);
  const [diffOnly, setDiffOnly] = useState(false);
  // With one property nothing differs, and the toggle is disabled, so a
  // left-on filter would hide every row with no way to turn it off.
  const diffActive = diffOnly && properties.length >= 2;

  // Client-side navigation keeps the previous page's scroll position
  // (e.g. coming from a scrolled /properties via the compare bar).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Built once per compare-list change; shared by the nav and the table.
  const sections = useMemo(() => buildCompareModel(properties), [properties]);

  const clearAll = useCallback(() => setCompareList([]), [setCompareList]);
  const goToProperties = useCallback(() => navigate("/properties"), [navigate]);
  const viewProperty = useCallback((id) => navigate(`/property/${id}`), [navigate]);
  // "default" key = first page of this visit (shared link, bookmark, new tab);
  // navigate(-1) would leave the site, so go to the listings instead.
  const goBack = useCallback(
    () => (location.key === "default" ? navigate("/properties") : navigate(-1)),
    [location.key, navigate]
  );

  // addToCompare is re-created on every App render; read it through a ref so
  // the slot cards get a stable callback.
  const addToCompareRef = useRef(addToCompare);
  useEffect(() => {
    addToCompareRef.current = addToCompare;
  });
  const addRecommendation = useCallback((p) => addToCompareRef.current?.(p), []);

  const { recommendations, loading: recsLoading } = useCompareRecommendations(properties);
  const emptyCount = Math.max(0, MAX_COMPARE - properties.length);

  // One node per empty slot, each with a different suggestion.
  const slots = useMemo(
    () =>
      Array.from({ length: emptyCount }, (_, i) => (
        <EmptySlot
          key={`slot-${i}`}
          recommendation={recommendations[i]}
          loading={recsLoading}
          onAdd={addRecommendation}
          onView={viewProperty}
          onBrowse={goToProperties}
        />
      )),
    [emptyCount, recommendations, recsLoading, addRecommendation, viewProperty, goToProperties]
  );

  return (
    <div className="compare-page">
      <header className="compare-topbar">
        <button type="button" className="compare-topbar__back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div>
          <h1 className="compare-topbar__title">Compare Properties</h1>
          <p className="compare-topbar__sub">Compare up to {MAX_COMPARE} properties side by side</p>
        </div>
      </header>

      <CompareSummary properties={properties} />

      {properties.length === 0 ? (
        <CompareEmptyState navigate={navigate} />
      ) : (
        <div className="compare-page__body">
          <CompareSectionNav
            sections={sections}
            diffOnly={diffActive}
            onDiffOnlyChange={setDiffOnly}
            diffDisabled={properties.length < 2}
          />

          {/* data-diff-only is read by CSS only, so toggling it doesn't re-render the table */}
          <div className="compare-page__main" data-diff-only={diffActive || undefined}>
            <CompareErrorBoundary resetKey={properties.map((p) => p._id).join(",")}>
              <CompareTable
                properties={properties}
                sections={sections}
                slots={slots}
                onRemove={removeFromCompare}
                onView={viewProperty}
              />
            </CompareErrorBoundary>

            {/* Phones only (CSS): the table has no empty-slot columns there */}
            {emptyCount > 0 && (
              <section className="compare-recs" aria-label="Free compare slots">
                <p className="compare-recs__title">
                  <strong>
                    {emptyCount} {emptyCount === 1 ? "slot" : "slots"} left
                  </strong>
                  {recommendations.length > 0 && " · Recommended for you"}
                </p>
                <div className="compare-recs__list">
                  {recsLoading ? (
                    <EmptySlot loading />
                  ) : recommendations.length > 0 ? (
                    recommendations.slice(0, emptyCount).map((p) => (
                      <RecommendedSlot key={p._id} property={p} onAdd={addRecommendation} onView={viewProperty} />
                    ))
                  ) : (
                    <AddSlot onClick={goToProperties} />
                  )}
                </div>
              </section>
            )}

            <div className="compare-actions">
              <button className="compare-btn compare-btn--ghost" onClick={clearAll}>
                <Trash2 size={14} strokeWidth={1.5} /> Clear All
              </button>
              <button
                className="compare-btn compare-btn--primary"
                onClick={goToProperties}
                disabled={properties.length >= MAX_COMPARE}
              >
                <Plus size={14} strokeWidth={1.5} /> Add More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compare;
