// ComparePanel.js
import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { X, MapPin, Trash2 } from "lucide-react";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyImage, getPropertyLocation } from "../../../utils/propertyHelpers";
import "./ComparePanel.css";

const ComparePanel = ({
  compareList = [],
  onClose = () => {},
  removeFromCompare = () => {},
}) => {
  const panelRef = useRef(null);
  const columns = useMemo(() => compareList.filter(Boolean), [compareList]);

  // Close on outside click
  useOutsideClick(true, [panelRef], onClose);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while open
  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   return () => { document.body.style.overflow = ""; };
  // }, []);

  const handleRemove = useCallback(
    (id) => {
      removeFromCompare(id);
      if (columns.length <= 1) onClose();
    },
    [removeFromCompare, columns.length, onClose]
  );

  if (!columns.length) return null;

  return (
    <div
      className="cp-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Compare properties"
    >
      <div className="cp-panel" ref={panelRef}>

        {/* Header */}
        <div className="cp-header">
          <h2 className="cp-title">
            Comparing <span>{columns.length}</span> Properties
          </h2>
          <button
            className="cp-close"
            onClick={onClose}
            aria-label="Close comparison panel"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="cp-body">
          <table className="cp-table" role="table">
            <thead>
              <tr>
                <th className="cp-label-col" scope="col" />
                {columns.map((p, i) => (
                  <th key={p._id || i} className="cp-prop-col" scope="col">
                    <div className="cp-prop-header">
                      <img
                        src={getPropertyImage(p)}
                        alt={p.title || "Property"}
                        className="cp-thumb"
                        loading="lazy"
                      />
                      <button
                        className="cp-remove"
                        onClick={() => handleRemove(p._id)}
                        aria-label={`Remove ${p.title || "property"}`}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {/* Title */}
              <Row label="Property">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    <span className="cp-prop-title">{p.title || "—"}</span>
                    <span className="cp-prop-type">{p.propertyType || ""}</span>
                  </td>
                ))}
              </Row>

              {/* Price */}
              <Row label="Price">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell cp-cell--price">
                    {formatCurrencyShort(p.price)}
                  </td>
                ))}
              </Row>

              {/* Location */}
              <Row label="Location">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    <span className="cp-location">
                      <MapPin size={11} strokeWidth={1.5} />
                      {getPropertyLocation(p) || "—"}
                    </span>
                  </td>
                ))}
              </Row>

              {/* BHK + Area */}
              <Row label="BHK / Area">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    {p.bhk ? `${p.bhk} BHK` : "—"}
                    {p.area?.value
                      ? ` · ${p.area.value} ${p.area.unit || "sq.ft"}`
                      : ""}
                  </td>
                ))}
              </Row>

              {/* Status */}
              <Row label="Status">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    <StatusBadge value={p.possessionStatus} />
                  </td>
                ))}
              </Row>

              {/* RERA */}
              <Row label="RERA">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    {p.reraApproved
                      ? <span className="cp-badge cp-badge--yes">Approved</span>
                      : <span className="cp-badge cp-badge--no">Not listed</span>}
                  </td>
                ))}
              </Row>

              {/* Amenities */}
              <Row label="Amenities">
                {columns.map((p, i) => (
                  <td key={p._id || i} className="cp-cell">
                    {p.amenities?.length
                      ? p.amenities.slice(0, 3).join(", ")
                      : "—"}
                  </td>
                ))}
              </Row>

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="cp-footer">
          {/* <button className="cp-btn cp-btn--ghost" onClick={onClose}>
            Close
          </button> */}
          <a href="/compare" className="cp-btn cp-btn--primary">
            Full Comparison →
          </a>
        </div>

      </div>
    </div>
  );
};

/* ── helpers ── */
const Row = ({ label, children }) => (
  <tr className="cp-row">
    <th className="cp-row-label" scope="row">{label}</th>
    {children}
  </tr>
);

const StatusBadge = ({ value }) => {
  if (!value) return <span>—</span>;
  const ready = /ready|immediate/i.test(value);
  return (
    <span className={`cp-badge ${ready ? "cp-badge--yes" : "cp-badge--pending"}`}>
      {value}
    </span>
  );
};

export default React.memo(ComparePanel);