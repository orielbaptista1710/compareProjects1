// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/CompareTab.jsx
import { useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";
import { useCompare } from "../../../../contexts/CompareContext";
import PropertyCard from "../../../Properties/PropertiesPageComponets/PropertyCard";

const CompareTab = () => {
  const { compareList } = useCompare();
  const navigate = useNavigate();

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Compare Properties</h2>
        <p className="panel-subtitle">
          {compareList.length > 0
            ? `${compareList.length} of 4 properties added`
            : "Add properties to compare them side by side"}
        </p>
      </div>

      {compareList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Scale size={40} strokeWidth={1.5} />
          </div>
          <h3>Nothing to compare yet</h3>
          <p>Browse properties and add up to 4 to compare</p>
        </div>
      ) : (
        <>
          <div className="compare-progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(compareList.length / 4) * 100}%` }} />
            </div>
            <span className="progress-label">{compareList.length}/4 selected</span>
          </div>

          <div className="property-list-grid">
            {compareList.slice(0, 4).map((p) => (
              <PropertyCard key={p._id} property={p} showCompareBtn={false} />
            ))}
          </div>

          <div className="panel-cta">
            <button className="btn-primary" onClick={() => navigate("/compare")}>
              View Full Comparison
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CompareTab;