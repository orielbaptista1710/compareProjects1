// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/ShortlistTab.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { CustomerActivityContext } from "../../../../contexts/CustomerActivityContext";
import PropertyCard from "../../../properties/components/PropertyCard/PropertyCard";

const ShortlistTab = () => {
  const { heartProperties, heartPagination, loadingMoreHearts, loadMoreHearts, loading } =
    useContext(CustomerActivityContext);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="panel-header">
          <h2>Shortlisted Properties</h2>
        </div>
        <div className="empty-state">
          <div className="shimmer-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Shortlisted Properties</h2>
        <p className="panel-subtitle">
          {heartPagination.total > 0
            ? `${heartPagination.total} propert${heartPagination.total === 1 ? "y" : "ies"} saved`
            : "Properties you've saved for later"}
        </p>
      </div>

      {heartProperties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Heart size={40} strokeWidth={1.5} />
          </div>
          <h3>No saved properties yet</h3>
          <p>Properties you heart will appear here for easy access</p>
          <button className="btn-primary" onClick={() => navigate("/properties")}>
            Browse Properties
          </button>
        </div>
      ) : (
        <>
          <div className="property-list-grid">
            {heartProperties.map((p) => (
              <PropertyCard key={p._id} property={p} showCompareBtn={false} />
            ))}
          </div>

          {heartPagination.hasMore && (
            <div className="panel-cta">
              <button
                className="btn-primary"
                onClick={loadMoreHearts}
                disabled={loadingMoreHearts}
              >
                {loadingMoreHearts ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShortlistTab;