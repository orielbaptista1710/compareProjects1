import React from "react";
import { Check } from "lucide-react";


const BoxcheckGroup = ({
  options = [],
  value = [],
  onChange,
  renderLabel,
}) => {
  const handleToggle = (option) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option]
    );
  };

  return (
    <div className="box-pill-group" role="group">
      {options.map((option) => {
        const selected = value.includes(option);
        const label = renderLabel ? renderLabel(option) : option;

        return (
          <button
            key={option}
            type="button"
            className={`box-pill ${selected ? "selected" : ""}`}
            onClick={() => handleToggle(option)}
            aria-pressed={selected}
            aria-label={label}
          >
            <span className="box-pill-icon" aria-hidden="true">
              {selected && <Check size={10} strokeWidth={3} />}
            </span>
            <span className="box-pill-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(BoxcheckGroup);