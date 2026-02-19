// ComparePanel.js — Fullscreen preview compare overlay
import React, { useMemo } from "react";
import "./CompareTray.css";
import { X } from "lucide-react";

const PLACEHOLDER =
  "https://placehold.co/600x400/000000/FFFFFF/png";

export default function ComparePanel({
  compareList = [],
  onClose = () => {},
  removeFromCompare = () => {},
}) {
  const columns = useMemo(
    () => compareList.filter(Boolean),
    [compareList]
  );

  if (!columns.length) return null;

  return (
    <div
      className="compare-panel-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div className="compare-panel">
        <div className="compare-panel-header">
          <h2>Compare Properties</h2>
          <button
            className="compare-panel-close"
            onClick={onClose}
            aria-label="Close compare"
          >
            <X size={18} />
          </button>
        </div>

        <div className="compare-panel-body">
          <div className="compare-grid">

            {/* 🔹 Preview Images */}
            <div className="compare-row compare-row-images">
              <div className="compare-row-title">Preview</div>

              {columns.map((property, i) => {
                const imageSrc =
                  property?.coverImage.thumbnail ||
                  property?.images?.[0] ||    // CHECK THIS -- ADD VALID FALLBACK
                  PLACEHOLDER;

                return (
                  <div
                    key={property._id || i}
                    className="compare-col"
                  >
                    <img
                      src={imageSrc}
                      alt={property?.title || "property"}
                      loading="lazy"
                      onError={(e) =>
                        (e.currentTarget.src = PLACEHOLDER)
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* 🔹 Title */}
            <div className="compare-row">
              <div className="compare-row-title">Title</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  {property?.title || "—"}
                </div>
              ))}
            </div>

            {/* 🔹 Price */}
            <div className="compare-row">
              <div className="compare-row-title">Price</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  ₹{Number(property?.price || 0).toLocaleString("en-IN")}
                </div>
              ))}
            </div>

            {/* 🔹 Location */}
            <div className="compare-row">
              <div className="compare-row-title">Location</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  {property?.city
                    ? `${property.locality}, `
                    : ""}
                  {property?.city || "—"}
                </div>
              ))}
            </div>

            {/* 🔹 BHK / Size */}
            <div className="compare-row">
              <div className="compare-row-title">BHK / Size</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  {property?.bhkType || property?.bhk || "—"}
                  {property?.size
                    ? ` • ${property.size} sqft`
                    : ""}
                </div>
              ))}
            </div>

            {/* 🔹 Status */}
            <div className="compare-row">
              <div className="compare-row-title">Status</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  {property?.possessionStatus ||
                    property?.status ||
                    "—"}
                </div>
              ))}
            </div>

            {/* 🔹 Amenities */}
            <div className="compare-row">
              <div className="compare-row-title">Amenities</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  {(property?.amenities || [])
                    .slice(0, 4)
                    .join(", ") || "—"}
                </div>
              ))}
            </div>

            {/* 🔹 Actions */}
            <div className="compare-row compare-actions-row">
              <div className="compare-row-title">Actions</div>
              {columns.map((property, i) => (
                <div
                  key={property._id || i}
                  className="compare-col"
                >
                  <button
                    className="cmp-action-remove"
                    onClick={() =>
                      removeFromCompare(property._id)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="compare-panel-footer">
          <button
            className="cmp-footer-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
