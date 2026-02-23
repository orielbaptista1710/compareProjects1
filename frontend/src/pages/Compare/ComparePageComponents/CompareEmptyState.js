// CompareEmptyState.js
import React from "react";
import { ArrowRight } from "lucide-react";
import "./CompareEmptyState.css";

export default function CompareEmptyState({ navigate }) {
  return (
    <div className="empty-compare">
      <div className="empty-compare__illustration">
        <div className="empty-compare__house">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M8 28L32 8L56 28V56H40V40H24V56H8V28Z" fill="#f5e9ff" stroke="#9417E2" strokeWidth="1.5" strokeLinejoin="round"/>
            <rect x="26" y="40" width="12" height="16" rx="1" fill="#e9d5ff" stroke="#9417E2" strokeWidth="1.5"/>
            <rect x="36" y="22" width="8" height="8" rx="1" fill="#e9d5ff" stroke="#9417E2" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="empty-compare__plus">+</div>
        <div className="empty-compare__house empty-compare__house--ghost">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M8 28L32 8L56 28V56H40V40H24V56H8V28Z" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round"/>
            <rect x="26" y="40" width="12" height="16" rx="1" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/>
          </svg>
        </div>
      </div>

      <h3 className="empty-compare__title">Nothing to compare yet</h3>
      <p className="empty-compare__desc">
        Add at least 2 properties to compare prices,<br />amenities, and specifications side by side.
      </p>

      <button
        className="empty-compare__btn"
        onClick={() => navigate("/properties")}
      >
        Browse Properties
        <ArrowRight size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}