// DevPropertyList.js
// ==============================
// Displays all developer properties in the dashboard
// Supports: View, Edit, Delete, and handles loading states

import React from "react";
import SkeletonPropertyCard from "../../../components/SkeletonComponents/SkeletonPropertyCard";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const DevPropertyList = ({
  properties,
  isLoading,
  isError,
  onEdit,
  onDelete,
  formatIndianPrice,
}) => {
  if (isLoading) {
    return (
      <div className="properties-grid">
        {[...Array(3)].map((_, index) => (
          <SkeletonPropertyCard key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="error">Error loading properties</div>;
  }

  if (!properties || properties.length === 0) {
    return <div className="empty-state">No properties found</div>;
  }

  return (
    <div className="properties-grid">
      {properties.map((p) => (
        <div className="property-card" key={p._id}>
          {/* Header */}
          <div className="dashboard-property-header">
            <h4 className="dashboard-property-title">{p.title}</h4>
            <div
              className="property-status"
              style={{
                color:
                  p.status === "approved"
                    ? "green"
                    : p.status === "rejected"
                    ? "red"
                    : "orange",
              }}
            >
              {p.status}
            </div>
          </div>

          {/* Cover Image */}
          {p.coverImage && (
            <div className="property-cover">
              <img
                src={
                  p.coverImage.startsWith("http")
                    ? p.coverImage
                    : `${API_BASE_URL}${p.coverImage}`
                }
                alt={p.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-property.jpg";
                }}
              />
            </div>
          )}

          {/* Details */}
          <div className="dashboard-property-details">
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span>
                {p.state}, {p.locality}, {p.city}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span>
                {p.address}, {p.pincode}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Map Link:</span>
              <span>{p.mapLink}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Property Type:</span>
              <span>{p.propertyType}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Furnishing:</span>
              <span>{p.furnishing}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Possession Status:</span>
              <span>{p.possessionStatus}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">BHK:</span>
              <span>{p.bhk}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Bathrooms:</span>
              <span>{p.bathrooms}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Balconies:</span>
              <span>{p.balconies}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Facing:</span>
              <span>{p.facing}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Parking:</span>
              <span>{p.parkings}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Developer Name:</span>
              <span>{p.developerName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Price:</span>
              <span>
                {formatIndianPrice(p.price)} (₹{p.price})
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Area:</span>
              <span>
                {p.area?.value} {p.area?.unit}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Property Age:</span>
              <span>{p.ageOfProperty}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Floors:</span>
              <span>{p.totalFloors}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Wing:</span>
              <span>{p.wing}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Floor No:</span>
              <span>{p.floor}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Units Availability:</span>
              <span>{p.unitsAvailable}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Availability Date:</span>
              <span>
                {p.availableFrom
                  ? new Date(p.availableFrom).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not set"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">RERA Approved:</span>
              <span>{p.reraApproved ? "✅" : "❌"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">RERA No:</span>
              <span>{p.reraNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Price Negotiable:</span>
              <span>{p.priceNegotiable ? "✅" : "❌"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amenities:</span>
              <span>{p.amenities?.join(", ")}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Facilities:</span>
              <span>{p.facilities?.join(", ")}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Security:</span>
              <span>{p.security?.join(", ")}</span>
            </div>
          </div>

          {/* Description */}
          <div className="property-description">
            <h5>Description:</h5>
            <p>{p.description}</p>
            {p.long_description && (
              <>
                <h5>Details:</h5>
                <p>{p.long_description}</p>
              </>
            )}
          </div>

          {/* Rejection Reason */}
          {p.status === "rejected" && p.rejectionReason && (
            <div className="property-rejection">
              <h5>Rejection Reason:</h5>
              <p>{p.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="property-actions">
            <button
              className="edit-button"
              onClick={() => onEdit(p)}
              aria-label={`Edit ${p.title}`}
            >
              Edit
            </button>
            <button
              className="delete-button"
              onClick={() => onDelete(p._id)}
              aria-label={`Delete ${p.title}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DevPropertyList;
