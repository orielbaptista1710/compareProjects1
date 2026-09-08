import React, { useMemo, useCallback, useState, useRef } from "react";
import { Home, ChevronDown, ChevronUp } from "lucide-react";
import { PROPERTY_TYPE_CONFIG } from "../../../assests/constants/propertyTypeConfig";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import "./PropertyTypePills.css";

const PropertyTypePills = ({ valueMap, onChange }) => {
  const sections = useMemo(() => PROPERTY_TYPE_CONFIG, []);
  const [open, setOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState(sections[0]?.key);
  const wrapperRef = useRef(null);

  useOutsideClick(open, [wrapperRef], () => setOpen(false));

  const handleToggle = useCallback((target, itemValue, currentValue) => {
    const active = currentValue.includes(itemValue);
    const newValues = active
      ? currentValue.filter((v) => v !== itemValue)
      : [...currentValue, itemValue];
    onChange(target, newValues);
  }, [onChange]);

  const selectedLabels = useMemo(() => {
    const labels = [];
    sections.forEach((section) => {
      const currentValue = Array.isArray(valueMap[section.target]) ? valueMap[section.target] : [];
      section.items.forEach((item) => {
        if (currentValue.includes(item.value)) labels.push(item.label);
      });
    });
    return labels;
  }, [sections, valueMap]);

  const summaryLabel =
    selectedLabels.length === 0
      ? "Property Type"
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels[0]} +${selectedLabels.length - 1}`;

  return (
    <div className="ptp-wrapper" ref={wrapperRef}>
      <button type="button" className="ptp-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Home size={18} className="ptp-trigger-icon" />
        <span className="ptp-trigger-label">{summaryLabel}</span>
        {open ? <ChevronUp size={16} className="ptp-trigger-chevron" /> : <ChevronDown size={16} className="ptp-trigger-chevron" />}
      </button>

      {open && (
        <div className="ptp-panel">
          {sections.map((section) => {
            const currentValue = Array.isArray(valueMap[section.target]) ? valueMap[section.target] : [];
            const expanded = expandedKey === section.key;

            return (
              <div key={section.key} className="ptp-section">
                <button
                  type="button"
                  className="ptp-group-label"
                  onClick={() => setExpandedKey(expanded ? null : section.key)}
                  aria-expanded={expanded} 
                >
                  {section.group}
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expanded && (
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
                          aria-label={`${item.label}${active ? " (selected)" : ""}`}
                          onClick={() => handleToggle(section.target, item.value, currentValue)}
                        >
                          {Icon && <Icon className="ptp-icon" size={14} strokeWidth={2} />}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(PropertyTypePills);