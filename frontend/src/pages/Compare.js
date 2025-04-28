import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaHome, FaMapMarkerAlt, FaRulerCombined, FaMoneyBillWave, FaCity } from "react-icons/fa";
import "./Compare.css";

function Compare({ compareList, setCompareList }) {
  const [properties, setProperties] = useState(compareList);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    setProperties(compareList);
  }, [compareList]);

  const removeProperty = (propertyId) => {
    const updatedProperties = compareList.filter((property) => property._id !== propertyId);
    setCompareList(updatedProperties);
    localStorage.setItem("compareList", JSON.stringify(updatedProperties));
  };

  const renderPropertyHeader = (property) => (
    <div className="property-header">
      {property.coverimage && (
        <div className="property-image-container">
          <img 
            src={property.coverimage} 
            alt={property.title} 
            className="property-image"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/path/to/default-image.jpg';
            }}
          />
          
        </div>
      )}
      <h3>{property.title}</h3>
      <p className="location"><FaMapMarkerAlt /> {property.locality}, {property.city}</p>
      <p className="type"><FaHome /> {property.propertyType}</p>
      <button 
        className="modify-selection"
        onClick={() => removeProperty(property._id)}
      >
        <FaTrash /> Remove
      </button>
    </div>
  );

  const renderPropertyInfo = (property) => (
    <div className="info-section">
      <div className="info-grid">
        <div className="info-row">
          <span className="info-label">Property Type:</span>
          <span className="info-value">{property.propertyType}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Furnishing:</span>
          <span className="info-value">{property.furnishing?.join(", ") || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Possession:</span>
          <span className="info-value">{property.possessionStatus?.join(", ") || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Property Age:</span>
          <span className="info-value">{property.ageOfProperty}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Price:</span>
          <span className="info-value">{property.price}</span>
        </div>
      </div>
    </div>
  );

  const renderPropertyDetails = (property) => (
    <div className="details-section">
      <div className="details-grid">
        <div className="details-row">
          <span className="details-label">BHK:</span>
          <span className="details-value">{property.bhk || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Bathrooms:</span>
          <span className="details-value">{property.bathrooms || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Area:</span>
          <span className="details-value">
            <FaRulerCombined /> {property.area?.value ? `${property.area.value} ${property.area.unit}` : "N/A"}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">Price/sqft:</span>
          <span className="details-value">
            <FaMoneyBillWave /> {property.pricePerSqft ? `₹${property.pricePerSqft.toLocaleString()}` : "N/A"}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">Facing:</span>
          <span className="details-value">{property.facing || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Total No of Floor:</span>
          <span className="details-value">
            {property.totalFloors || "N/A"}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">Floor No:</span>
          <span className="details-value">
            {property.floor || "N/A"}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">Balconies:</span>
          <span className="details-value">{property.balconies || "N/A"}</span>
        </div>
      </div>
    </div>
  );

  const renderLocationDetails = (property) => (
    <div className="location-section">
      <div className="location-grid">
        <div className="location-row">
          <span className="location-label">Address:</span>
          <span className="location-value">{property.address}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Locality:</span>
          <span className="location-value">{property.locality}</span>
        </div>
        <div className="location-row">
          <span className="location-label">City:</span>
          <span className="location-value"><FaCity /> {property.city}</span>
        </div>
        <div className="location-row">
          <span className="location-label">State:</span>
          <span className="location-value">{property.state}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Pincode:</span>
          <span className="location-value">{property.pincode}</span>
        </div>
        {property.landmarks?.length > 0 && (
          <div className="location-row">
            <span className="location-label">Landmarks:</span>
            <span className="location-value">{property.landmarks.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderComparisonTabs = () => (
    <div className="comparison-tabs">
      <button 
        className={activeTab === "all" ? "active" : ""}
        onClick={() => setActiveTab("all")}
      >
        All Details
      </button>
      <button 
        className={activeTab === "info" ? "active" : ""}
        onClick={() => setActiveTab("info")}
      >
        Basic Info
      </button>
      <button 
        className={activeTab === "details" ? "active" : ""}
        onClick={() => setActiveTab("details")}
      >
        Specifications
      </button>
      <button 
        className={activeTab === "location" ? "active" : ""}
        onClick={() => setActiveTab("location")}
      >
        Location
      </button>
    </div>
  );

  return (
    <div className="compare-container">
      <div className="comparison-header">
        <h1>Compare Properties</h1>
        <p className="header-description">
          Side-by-side comparison of {properties.length} selected properties. 
          Analyze key features, pricing, and location details to make an informed decision.
        </p>
        
        {properties.length > 0 && (
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{properties.length}</div>
              <div className="stat-label">Properties</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{Math.min(...properties.map(p => p.price || 0)).toLocaleString()}</div>
              <div className="stat-label">Min Price</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{Math.max(...properties.map(p => p.price || 0)).toLocaleString()}</div>
              <div className="stat-label">Max Price</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{new Set(properties.map(p => p.city)).size}</div>
              <div className="stat-label">Cities</div>
            </div>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="empty-compare">
          <div className="empty-icon">🏠</div>
          <h3>No properties selected for comparison</h3>
          <p>Add properties to compare their features and specifications</p>
          <button onClick={() => navigate("/properties")}>Browse Properties</button>
        </div>
      ) : (
        <>
          {renderComparisonTabs()}
          
          <div className="compare-grid">
            {/* Headers row */}
            <div className="compare-row headers">
              <div className="compare-cell empty"></div>
              {properties.map((property) => (
                <div key={property._id} className="compare-cell">
                  {renderPropertyHeader(property)}
                </div>
              ))}
            </div>
            
            {(activeTab === "all" || activeTab === "info") && (
              <div className="compare-row">
                <div className="compare-cell section-title">Basic Information</div>
                {properties.map((property) => (
                  <div key={property._id} className="compare-cell">
                    {renderPropertyInfo(property)}
                  </div>
                ))}
              </div>
            )}
            
            {(activeTab === "all" || activeTab === "details") && (
              <div className="compare-row">
                <div className="compare-cell section-title">Specifications</div>
                {properties.map((property) => (
                  <div key={property._id} className="compare-cell">
                    {renderPropertyDetails(property)}
                  </div>
                ))}
              </div>
            )}
            
            {(activeTab === "all" || activeTab === "location") && (
              <div className="compare-row">
                <div className="compare-cell section-title">Location Details</div>
                {properties.map((property) => (
                  <div key={property._id} className="compare-cell">
                    {renderLocationDetails(property)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Compare;