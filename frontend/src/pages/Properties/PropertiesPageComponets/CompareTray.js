// CompareTray.js — Production Ready
import React, { useState } from "react";
import "./CompareTray.css";
import { X, Eye, ArrowRight } from "lucide-react";
import ComparePanel from "./ComparePanel";
import { useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://placehold.co/600x400/000000/FFFFFF/png";

const CompareTray = ({ compareList = [], removeFromCompare }) => {
  const [openPreview, setOpenPreview] = useState(false);
  const navigate = useNavigate();

  if (!compareList.length) return null;

  return (
    <>
      {/* ================== Compare Tray ================== */}
      <div className="compare-tray">
        <div className="compare-tray-items">
          {compareList.map((property, index) => {
            if (!property) return null;

            const imageSrc =
            property?.coverImage?.thumbnail ??
            property?.coverImage?.url ??
            property?.galleryImages?.[0] ??
            PLACEHOLDER;


            const title = property?.title || "Untitled";
            const developer =
              property?.developerName || "Unknown Developer";
            const price = property?.price || 0;
            const city =
              property?.city ||
              property?.locality ||
              "—";
            const locality =
              property?.location?.locality ||
              property?.locality ||
              "—";

            return (
              <div
                key={property._id || index}
                className="compare-card"
              >
                <div className="compare-image-wrapper">
                  <img
                    src={imageSrc}
                    alt={title}
                    className="compare-image"
                    onError={(e) =>
                      (e.currentTarget.src = PLACEHOLDER)
                    }
                  />

                  <button
                    className="compare-remove"
                    onClick={() =>
                      removeFromCompare(property._id)
                    }
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="compare-body">
                  <h3 className="compare-title">
                    {title}
                  </h3>

                  <p className="compare-location">
                    {developer}
                    <br />
                    {locality}, {city}
                  </p>

                  <p className="compare-price">
                    ₹{Number(price).toLocaleString("en-IN")}
                    <small> onwards</small>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================== Buttons ================== */}
        <div className="compare-tray-actions">
          <button
            className="compare-preview-btn"
            onClick={() => setOpenPreview(true)}
          >
            <Eye size={16} />
            Preview
          </button>

          <button
            className="compare-page-btn"
            onClick={() => navigate("/compare")}
          >
            Compare <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ================== Compare Panel Overlay ================== */}
      {openPreview && (
        <ComparePanel
          compareList={compareList}
          onClose={() => setOpenPreview(false)}
          removeFromCompare={removeFromCompare}
        />
      )}
    </>
  );
};

export default React.memo(CompareTray);
