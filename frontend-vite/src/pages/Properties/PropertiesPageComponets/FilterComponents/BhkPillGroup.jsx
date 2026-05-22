import React from "react";

/**
 * BhkPillGroup — compact horizontal pill toggles.
 * Used for BHK, Furnishing, Facing — anything that benefits
 * from a quick tap-to-select layout rather than a checkbox list.
 */
const BhkPillGroup = ({
  options = [],
  value = [],
  onChange,
  renderLabel,
}) => {
  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="bhk-pill-group" role="group">
      {options.map((opt) => {
        const active = value.includes(opt);
        const label = renderLabel ? renderLabel(opt) : opt;

        return (
          <button
            key={opt}
            type="button"
            className={`bhk-pill ${active ? "active" : ""}`}
            onClick={() => toggle(opt)}
            aria-pressed={active}
            aria-label={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(BhkPillGroup);