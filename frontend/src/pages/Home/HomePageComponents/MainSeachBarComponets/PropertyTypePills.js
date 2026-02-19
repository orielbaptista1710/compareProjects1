import React, { useMemo, useCallback } from "react";
import { PROPERTY_TYPE_CONFIG } from "../../../../assests/constants/propertyTypeConfig";
import "./PropertyTypePills.css";

const PropertyTypePills = ({ valueMap, onChange }) => {
  // Memoize sections to avoid re-renders
  const sections = useMemo(() => PROPERTY_TYPE_CONFIG, []);

  // Memoized toggle handler
  const handleToggle = useCallback((target, itemValue, currentValue) => {
    const active = currentValue.includes(itemValue);
    const newValues = active
      ? currentValue.filter((v) => v !== itemValue)
      : [...currentValue, itemValue];
    
    onChange(target, newValues);
  }, [onChange]);

  return (
    <div className="ptp-container">
      {sections.map((section) => {
        const currentValue = Array.isArray(valueMap[section.target])
          ? valueMap[section.target]
          : [];

        return (
          <div key={section.key} className="ptp-section">
            <div className="ptp-group-label">{section.group}</div>

            <div className="ptp-pills-row">
              {section.items.map((item) => {
                const active = currentValue.includes(item.value);
                const Icon = item.icon;

                return (
                  <button
                    key={`${section.target}-${item.value}`}
                    type="button"
                    className={`ptp-pill ${active ? "ptp-pill-active" : ""}`}
                    aria-pressed={active}
                    aria-label={`${item.label}${active ? ' (selected)' : ''}`}
                    onClick={() => handleToggle(section.target, item.value, currentValue)}
                  >
                    {Icon && <Icon className="ptp-icon" size={14} strokeWidth={2} />}
                    <span>{item.label}</span>
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

export default React.memo(PropertyTypePills);