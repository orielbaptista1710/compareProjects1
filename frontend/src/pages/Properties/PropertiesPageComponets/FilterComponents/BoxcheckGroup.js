import React from "react";
import { Check } from "lucide-react";
import "./BoxcheckGroup.css";

const BoxcheckGroup = ({
  options = [],
  value = [],
  onChange,
  renderLabel,
}) => {
  const handleToggle = (option) => {
    let newValue;

    if (value.includes(option)) {
      newValue = value.filter((v) => v !== option);
    } else {
      newValue = [...value, option];
    }

    onChange(newValue);
  };

  return (
    <div className="box-pill-group">
      {options.map((option) => {
        const isSelected = value.includes(option);

        return (
          <button
            key={option}
            type="button"
            className={`box-pill ${isSelected ? "selected" : ""}`}
            onClick={() => handleToggle(option)}
          >
            <span className="box-pill-icon">
              {isSelected && <Check size={12} />}
            </span>

            <span className="box-pill-label">
              {renderLabel ? renderLabel(option) : option}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(BoxcheckGroup);