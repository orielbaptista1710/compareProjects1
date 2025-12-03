// Compare.js (Final Production Ready)
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Compare.css";

import CompareSummary from "../Compare/ComparePageComponents/CompareSummary";
import CompareEmptyState from "../Compare/ComparePageComponents/CompareEmptyState";

function Compare({ compareList, setCompareList, removeFromCompare }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState([]);

  const safeText = (val) => val || "—";
  const TABS = ["overview", "details", "amenities", "location"];

  useEffect(() => {
    setProperties(compareList);
  }, [compareList]);

  const clearAll = () => setCompareList([]);

  const getPropertyImage = useCallback(
  (property) =>
    property.coverImage?.url ||
    property.galleryImages?.[0]?.url ||
    "https://placehold.co/600x400/000000/FFFFFF/png",
  []
);

const renderAddPropertyBox = useCallback(
  () => (
    <div className="add-property-box" onClick={() => navigate("/properties")}>
      <div className="add-icon">+</div>
      <p>Add Property</p>
    </div>
  ),
  [navigate]
);

const renderHeaderCard = useCallback(
  (property) => (
    <div className="compare-header-card">
      <img src={getPropertyImage(property)} alt={property.title} />

      <h3 className="property-title">
        {property.title?.slice(0, 45) || "Untitled"}
      </h3>

      <h4 className="developer">By {property.developerName || "Developer"}</h4>

      <p className="location">
        {property.locality || "—"}, {property.city || "—"}
      </p>

      <p className="price">
        ₹{property.price?.toLocaleString("en-IN") || "N/A"}
      </p>

      <button
        className="remove-btn"
        onClick={() => removeFromCompare(property._id)}
      >
        Remove
      </button>
    </div>
  ),
  [getPropertyImage, removeFromCompare]
);


  /* ---------------- TAB LOGIC ---------------- */
  const renderTabContent = (property) => {
  switch (activeTab) {
    /** ---------------- OVERVIEW ---------------- */
    case "overview":
  return (
    <div className="tab-info overview-summary">

      {/* BASIC DETAILS */}
      <h4 className="section-title">Basic Details</h4>
      <div className="info-row">
        <p><strong>Price:</strong> 
          {property.price ? `₹${property.price.toLocaleString("en-IN")}` : "—"}
        </p>

        <p><strong>Price per Sqft:</strong> 
          {property.pricePerSqft ? `₹${property.pricePerSqft.toLocaleString("en-IN")}` : "—"}
        </p>

        <p><strong>Unit Type:</strong> 
          {property.bhk ? `${property.bhk} BHK` : "—"}
        </p>

        <p><strong>Area:</strong>
          {property.area?.value ? `${property.area.value} ${property.area.unit}` : "—"}
        </p>

        <p><strong>Property Type:</strong> {property.propertyType || "—"}</p>
        <p><strong>Category:</strong> {property.propertyGroup || "—"}</p>
      </div>


      {/* LOCATION */}
      <h4 className="section-title">Location</h4>
      <div className="info-row">
        <p><strong>City:</strong> {safeText(property.city)}</p>
        <p><strong>Locality:</strong> {safeText(property.locality)}</p>
        <p><strong>Pincode:</strong> {safeText(property.pincode)}</p>

        {property.mapLink && (
          <a 
            href={property.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="map-btn"
          >
            View on Map →
          </a>
        )}
      </div>


      {/* POSSESSION + RERA */}
      <h4 className="section-title">Approval & Status</h4>
      <div className="info-row">
        <p><strong>Possession:</strong> {safeText(property.possessionStatus)}</p>

        {property.reraApproved ? (
  <>
    <p><strong>RERA Approved:</strong> Yes</p>
    {property.reraNumber && <p><strong>RERA No:</strong> {property.reraNumber}</p>}
  </>
) : (
  <p><strong>RERA Approved:</strong> No</p>
)}

      </div>


      {/* AMENITIES SNAPSHOT */}
      <h4 className="section-title">Top Amenities</h4>
      <div className="amenities-row">
        {(property.amenities?.slice(0, 5) || []).map((item, i) => (
          <span className="amenity-chip" key={i}>
            {item}
          </span>
        ))}

        {(!property.amenities || property.amenities.length === 0) && (
          <p>No amenities listed</p>
        )}
      </div>
    </div>
  );


    /** ---------------- DETAILS ---------------- */
    case "details":
      return (
        <div className="tab-info">
          <p><strong>Bathrooms:</strong> {safeText(property.bathrooms)}</p>
          <p><strong>Balconies:</strong> {safeText(property.balconies)}</p>
          <p><strong>Floor:</strong> {safeText(property.floor)}</p>
          <p><strong>Total Floors:</strong> {safeText(property.totalFloors)}</p>

          <p><strong>Furnishing:</strong> 
            {property.furnishing?.length 
              ? property.furnishing.join(", ") 
              : "—"}
          </p>

          <p><strong>Facing:</strong> {safeText(property.facing)}</p>

          <p><strong>Age of Property:</strong> {safeText(property.ageOfProperty)}</p>

          <p><strong>Parkings:</strong> {safeText(property.parkings)}</p>
          <p><strong>Units Available:</strong> {safeText(property.unitsAvailable)}</p>
          <p><strong>Available From:</strong> 
            {property.availableFrom 
              ? new Date(property.availableFrom).toLocaleDateString("en-IN") 
              : "—"}
          </p>
        </div>
      );

    /** ---------------- AMENITIES ---------------- */
    case "amenities":
      return (
        <div className="tab-info">
          <h4>Amenities</h4>
          {property.amenities?.length ? 
            property.amenities.map((item, i) => (
              <p key={i}>• {item}</p>
            ))
          : <p>No amenities available</p>
          }

          <h4>Facilities</h4>
          {property.facilities?.length ? 
            property.facilities.map((item, i) => (
              <p key={i}>• {item}</p>
            ))
          : <p>No facilities listed</p>
          }

          <h4>Security</h4>
          {property.security?.length ? 
            property.security.map((item, i) => (
              <p key={i}>• {item}</p>
            ))
          : <p>No security features listed</p>
          }
        </div>
      );

    /** ---------------- LOCATION ---------------- */
    case "location":
      return (
        <div className="tab-info">
          <p><strong>State:</strong> {safeText(property.state)}</p>
          <p><strong>City:</strong> {safeText(property.city)}</p>
          <p><strong>Locality:</strong> {safeText(property.locality)}</p>
          <p><strong>Address:</strong> {safeText(property.address)}</p>
          <p><strong>Pincode:</strong> {safeText(property.pincode)}</p>

          <p><strong>Landmarks:</strong></p>
          {property.landmarks?.length ? (
            property.landmarks.map((landmark, i) => (
              <p key={i}>• {landmark.name}</p>
            ))
          ) : (
            <p>No landmarks provided</p>
          )}

          {property.mapLink &&
            <a 
              href={property.mapLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="map-link"
            >
              View on Map →
            </a>
          }
        </div>
      );

    default:
      return null;
  }
};


  return (
    <div className="compare-page">
      {/* TITLE */}
      <div className="compare-header">
        {/* <h1>Compare Properties</h1> */}
      </div>

      {/* SUMMARY */}
      <CompareSummary properties={properties} />

      {/* EMPTY STATE */}
      {properties.length === 0 ? (
        <CompareEmptyState navigate={navigate} />
      ) : (
        <>
          {/* HEADER GRID */}
          <div className="compare-grid-header">
            {properties.map((property) => (
              <div key={property._id} className="compare-header-cell">
                {renderHeaderCard(property)}
              </div>
            ))}

            {/* Fill up to 4 columns */}
            {Array.from({ length: 4 - properties.length }).map((_, i) => (
              <div key={`empty-${i}`} className="compare-header-cell empty">
                {renderAddPropertyBox()}
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="compare-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CONTENT GRID */}
          <div className="compare-grid-content">
            {properties.map((property) => (
              <div key={property._id} className="compare-content-cell">
                {renderTabContent(property)}
              </div>
            ))}

            {Array.from({ length: 4 - properties.length }).map((_, i) => (
              <div key={`empty-content-${i}`} className="compare-content-cell empty">
                {renderAddPropertyBox()}
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="compare-buttons">
            <button className="clear-btn" onClick={clearAll}>
              Clear All
            </button>

            <button
              className="add-more-btn"
              onClick={() => navigate("/properties")}
            >
              Add More
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Compare;
