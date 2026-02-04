import React from "react";

const CheckboxGroup = ({
  options = [],
  value = [],
  onChange,
  renderLabel,
}) => {
  const toggleValue = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="checkbox-group">
      {options.map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggleValue(opt)}
          />
          {renderLabel ? renderLabel(opt) : opt}
        </label>
      ))}
    </div>
  );
};

export default React.memo(CheckboxGroup);
