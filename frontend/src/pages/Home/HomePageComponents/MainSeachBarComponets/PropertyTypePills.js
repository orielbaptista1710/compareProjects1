// src/components/PropertyTypePills/PropertyTypePills.js
import React from "react";
import "./PropertyTypePills.css";

const PROPERTY_TYPES = [
  {
    group: "Residential",
    items: ["Flats/Apartments", "Villa", "Plot"],
  },
  {
    group: "BHK",
    items: ["1 Bhk", "2 Bhk", "3 Bhk", "4 Bhk", "5 Bhk", "5+ Bhk"],
  },
  {
    group: "Commercial",
    items: ["Shop/Showroom", "Industrial Warehouse", "Office Space","Retail" ],
  },
];

const PropertyTypePills = ({ value, onChange, closeMenu }) => {
  return (
    <div className="ptp-container">
      {PROPERTY_TYPES.map((section, idx) => (
        <div key={idx} className="ptp-section">
          {/* Group Label */}
          <div className="ptp-group-label">{section.group}</div>

          {/* Pills */}
          <div className="ptp-pills-row">
            {section.items.map((item) => {
              const active = value === item;

              return (
                <div
                  key={item}
                  className={`ptp-pill ${active ? "ptp-pill-active" : ""}`}
                  onClick={() => {
                    onChange(active ? "" : item);
                    if (closeMenu) closeMenu();
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyTypePills;
