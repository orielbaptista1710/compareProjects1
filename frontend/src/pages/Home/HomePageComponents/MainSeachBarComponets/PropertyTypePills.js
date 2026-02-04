import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROPERTY_TYPE_CONFIG } from "../../../../assests/constants/propertyTypeConfig";
import "./PropertyTypePills.css";

const PropertyTypePills = ({ valueMap, onChange }) => {
  return (
    <div className="ptp-container">
      {PROPERTY_TYPE_CONFIG.map((section) => {
        const currentValue = valueMap[section.target];

        return (
          <div key={section.key} className="ptp-section">
            <div className="ptp-group-label">{section.group}</div>

            <div className="ptp-pills-row">
              {section.items.map((item) => {
                const itemValue = item.value; // keep as string
                const active = currentValue === itemValue;

                return (
                  <button
                    key={`${section.target}-${itemValue}`}
                    type="button"
                    className={`ptp-pill ${
                      active ? "ptp-pill-active" : ""
                    }`}
                    aria-pressed={active}
                    onClick={() =>
                      onChange(
                        section.target,
                        active ? "" : itemValue
                      )
                    }
                  >
                    {item.icon && (
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="ptp-icon"
                      />
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyTypePills;
