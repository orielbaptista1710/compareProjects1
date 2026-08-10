import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import "./Compare.css";

import CompareSummary from "./ComparePageComponents/CompareSummary";
import CompareEmptyState from "./ComparePageComponents/CompareEmptyState";
import MascotGuide from "../../components/DevDashboardPageComponents/Mascot/MascotGuide";
import HeaderCard from "./ComparePageComponents/HeaderCard";
import AddSlot from "./ComparePageComponents/AddSlot";
import CompareErrorBoundary from "./ComparePageComponents/CompareErrorBoundary";
import { TABS, TAB_MAP } from "./ComparePageComponents/tabs";

const MAX_SLOTS = 4;

const TabFallback = () => (
  <div className="tab-content tab-content--loading">
    <div className="skeleton-row" />
    <div className="skeleton-row" />
    <div className="skeleton-row" />
  </div>
);

function Compare({ compareList, setCompareList, removeFromCompare }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    setProperties(compareList);
  }, [compareList]);

  const clearAll = useCallback(() => setCompareList([]), [setCompareList]);
  const goToProperties = useCallback(() => navigate("/properties"), [navigate]);

  const emptySlots = useMemo(() => MAX_SLOTS - properties.length, [properties.length]);

  const ActiveTabComponent = TAB_MAP[activeTab] ?? TAB_MAP.overview;

  return (
    <div className="compare-page">
      <CompareSummary properties={properties} />

      {properties.length === 0 ? (
        <CompareEmptyState navigate={navigate} />
      ) : (
        <div className="compare-layout">

          {/* Header row */}
          <div className="compare-grid" style={{ "--cols": MAX_SLOTS }}>
            {properties.map((p) => (
              <HeaderCard
                key={p._id}
                property={p}
                onRemove={removeFromCompare}
                onView={(id) => navigate(`/property/${id}`)}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <AddSlot key={`add-${i}`} onClick={goToProperties} />
            ))}
          </div>

          {/* Tabs */}
          <div className="compare-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`compare-tab ${activeTab === tab.id ? "compare-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content grid */}
          <div className="compare-grid compare-grid--content" style={{ "--cols": MAX_SLOTS }}>
            {properties.map((p) => (
              <div key={p._id} className="compare-cell">
                <CompareErrorBoundary resetKey={`${p._id}-${activeTab}`}>
                  <Suspense fallback={<TabFallback />}>
                    <ActiveTabComponent property={p} />
                  </Suspense>
                </CompareErrorBoundary>
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={`empty-${i}`} className="compare-cell compare-cell--empty">
                <AddSlot onClick={goToProperties} />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="compare-actions">
            <button className="btn btn--ghost" onClick={clearAll}>
              <Trash2 size={14} strokeWidth={1.5} /> Clear All
            </button>
            <button className="btn btn--primary" onClick={goToProperties}>
              <Plus size={14} strokeWidth={1.5} /> Add More
            </button>
          </div>
        </div>
      )}

      <MascotGuide
        steps={[
          "Welcome! Use filters to narrow properties.",
          "Click on Overview, Details, Amenities, or Location to compare properties Details.",
          "You can contact sellers directly."
        ]}
      />
    </div>
  );
}

export default Compare;