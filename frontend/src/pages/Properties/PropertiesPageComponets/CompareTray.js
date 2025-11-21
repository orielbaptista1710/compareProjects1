// CompareTray.js — Production Ready
import React, { useState } from "react";
import "./CompareTray.css";
import { X, Eye, ArrowRight } from "lucide-react";
import ComparePanel from "./ComparePanel";
import { useNavigate } from "react-router-dom";

const CompareTray = ({ compareList, removeFromCompare }) => {
  const [openPreview, setOpenPreview] = useState(false);
  const navigate = useNavigate();

  if (!compareList || compareList.length === 0) return null;

  return (
    <>
      {/* ================== Compare Tray ================== */}
      <div className="compare-tray">
        <div className="compare-tray-items">
          {compareList.map((p, index) => {
            if (!p) return null;

            const img = p?.images?.[0] || "https://placehold.co/600x400/000000/FFFFFF/png";
            const title = p?.title || "Untitled";
            const developer = p?.developer || "Unknown Developer";
            const price = p?.price || 0;
            const city = p?.location?.city || "—";
            const locality = p?.location?.locality || "—";

            return (
              <div key={p._id || index} className="compare-card">
                <div className="compare-image-wrapper">
                  <img src={img} alt={title} className="compare-image" />

                  <button
                    className="compare-remove"
                    onClick={() => removeFromCompare(p._id)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="compare-body">
                  <h3 className="compare-title">{title}</h3>
                  <p className="compare-location">
                    {developer} <br />
                    {locality}, {city}
                  </p>

                  <p className="compare-price">
                    ₹{price.toLocaleString("en-IN")}
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

export default CompareTray;
