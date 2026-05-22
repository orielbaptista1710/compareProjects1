import React from "react";
import { Check } from "lucide-react";

const CheckboxGroup = ({
  options = [],
  value = [],
  onChange,
  renderLabel,
  counts = {},
  scrollable = false,
}) => {
  const toggleValue = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className={`checkbox-group ${scrollable ? "scrollable" : ""}`}>
      {options.map((opt) => {
        const checked = value.includes(opt);
        const label = renderLabel ? renderLabel(opt) : opt;
        const count = counts[opt];

        return (
          <label key={opt} className={checked ? "checked" : ""}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleValue(opt)}
              aria-label={label}
            />
            <div className="cb-visual" aria-hidden="true">
              <Check size={9} strokeWidth={3} color="#fff" />
            </div>
            <span className="cb-label-text">{label}</span>
            {count !== undefined && (
              <span className="cb-count">{count.toLocaleString()}</span>
            )}
          </label>
        );
      })}
    </div>
  );
};

export default React.memo(CheckboxGroup);