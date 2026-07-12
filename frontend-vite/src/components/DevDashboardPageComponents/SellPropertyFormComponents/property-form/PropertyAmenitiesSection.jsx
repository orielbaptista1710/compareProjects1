// SellPropertyFormComponents/property-form/PropertyAmenitiesSection.jsx
// Amenities, Facilities, Security — all multi-select checkbox grids.
// Uses a single reusable CheckboxGrid component to avoid code duplication.

import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  amenitiesList,
  facilitiesList,
  securityList,
} from "../../../../assests/constants/propertyFormConstants";

// ── Reusable CheckboxGrid ──────────────────────────────────────────────────────
const CheckboxGrid = React.memo(({ fieldName, items, legend }) => {
  const { setValue, getValues, control } = useFormContext();
  const selected = useWatch({ control, name: fieldName }) || [];

  const toggle = useCallback(
    (itemName) => {
      const current = getValues(fieldName) || [];
      const next = current.includes(itemName)
        ? current.filter((v) => v !== itemName)
        : [...current, itemName];
      // shouldDirty keeps the form aware this field changed
      setValue(fieldName, next, { shouldDirty: true });
    },
    [fieldName, getValues, setValue]
  );

  return (
    <fieldset className="fieldset">
      <legend className="section-subtitle">{legend}</legend>
      <div className="checkbox-grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.name);
          return (
            <label
              key={item.name}
              className={`checkbox-card ${isSelected ? "checkbox-card--selected" : ""}`}
              // Keyboard accessible — label wraps input so clicking label toggles
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(item.name)}
                // Not registered with RHF directly — setValue handles state
              />
              {item.icon && (
                <span className="checkbox-card__icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="checkbox-card__label">{item.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
});

// ── Section ────────────────────────────────────────────────────────────────────
const PropertyAmenitiesSection = () => (
  <section aria-labelledby="amenities-section-title" className="form-section">
    <h3 id="amenities-section-title" className="section-title">
      Amenities &amp; Facilities
    </h3>

    <CheckboxGrid
      fieldName="amenities"
      items={amenitiesList}
      legend="Amenities"
    />

    <CheckboxGrid
      fieldName="facilities"
      items={facilitiesList}
      legend="Facilities"
    />

    <CheckboxGrid
      fieldName="security"
      items={securityList}
      legend="Security Features"
    />
  </section>
);

export default React.memo(PropertyAmenitiesSection);