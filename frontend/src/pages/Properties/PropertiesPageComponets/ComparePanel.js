// ComparePanel.js — Fullscreen preview compare overlay
import React, { useMemo } from "react";
import "./CompareTray.css";
import { X } from "lucide-react";

const PLACEHOLDER = "https://placehold.co/600x400/000000/FFFFFF/png";

export default function ComparePanel({ compareList = [], onClose = () => {}, removeFromCompare = () => {} }) {
  const columns = useMemo(() => compareList.filter(Boolean), [compareList]);

  if (!columns || columns.length === 0) return null;

  return (
    <div className="compare-panel-backdrop" role="dialog" aria-modal="true">
      <div className="compare-panel">
        <div className="compare-panel-header">
          <h2>Compare properties</h2>
          <button className="compare-panel-close" onClick={onClose} aria-label="Close compare"> <X size={18} /> </button>
        </div>

        <div className="compare-panel-body">
          <div className="compare-grid">
            {/* Top row: images */}
            <div className="compare-row compare-row-images">
              <div className="compare-row-title">Preview</div>
              {columns.map((p, i) => (
                <div key={p._id || i} className="compare-col">
                  <img src={p?.images?.[0] || PLACEHOLDER} alt={p?.title || "img"} loading="lazy" onError={(e)=> (e.currentTarget.src=PLACEHOLDER)} />
                </div>
              ))}
            </div>

            {/* Name / price */}
            <div className="compare-row">
              <div className="compare-row-title">Title</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">{p?.title || "—"}</div>)}
            </div>

            <div className="compare-row">
              <div className="compare-row-title">Price</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">₹{Number(p?.price || 0).toLocaleString("en-IN")}</div>)}
            </div>

            <div className="compare-row">
              <div className="compare-row-title">Location</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">{p?.location?.locality ? `${p.location.locality}, ` : ""}{p?.location?.city || "—"}</div>)}
            </div>

            <div className="compare-row">
              <div className="compare-row-title">BHK / Size</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">{p?.bhkType || p?.bhk || "—"} {p?.size ? `• ${p.size} sqft` : ""}</div>)}
            </div>

            <div className="compare-row">
              <div className="compare-row-title">Status</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">{p?.possessionStatus || p?.status || "—"}</div>)}
            </div>

            <div className="compare-row">
              <div className="compare-row-title">Amenities</div>
              {columns.map((p, i) => <div key={p._id || i} className="compare-col">{(p?.amenities || []).slice(0,4).join(", ") || "—"}</div>)}
            </div>

            {/* Action row */}
            <div className="compare-row compare-actions-row">
              <div className="compare-row-title">Actions</div>
              {columns.map((p, i) => (
                <div key={p._id || i} className="compare-col">
                  <button className="cmp-action-remove" onClick={() => removeFromCompare(p._id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="compare-panel-footer">
          <button className="cmp-footer-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
