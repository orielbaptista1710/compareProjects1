// SellPropertyFormComponents/property-form/PropertyDetailsSection.jsx
// Property type cards, BHK/bathrooms/balconies/facing radio groups,
// parking (multi-select), furnishing, possession status, age of property.

import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  PROPERTY_TYPES,
  FURNISHED_OPTIONS,
  POSSESSION_STATUS_OPTIONS,
  AGE_OF_PROPERTY_OPTIONS,
  BHK_OPTIONS, 
  BATHROOM_OPTIONS,
  BALCONY_OPTIONS,
  FACING_OPTIONS,
  PARKING_OPTIONS,
} from "../../../../assests/constants/propertyFormConstants";

// ── Reusable RadioGroup ────────────────────────────────────────────────────────
const RadioGroup = React.memo(({ name, options, withSuffix = "" }) => {
  const { register, control } = useFormContext();
  const value = useWatch({ control, name });

  return (
    <div className="radio-container" role="radiogroup">
      {options.map((opt) => {
        const optValue = typeof opt === "object" ? opt.value : String(opt);
        const optLabel = typeof opt === "object" ? opt.label : String(opt);
        return (
          <label
            key={optValue}
            className={`radio-label ${value === optValue ? "radio-label--selected" : ""}`}
          >
            <input
              type="radio"
              value={optValue}
              {...register(name)}
            />
            {optLabel}
            {withSuffix && ` ${withSuffix}`}
          </label>
        );
      })}
    </div>
  );
});

// ── MultiCheckboxGroup ─────────────────────────────────────────────────────────
const MultiCheckboxGroup = React.memo(({ name, options }) => {
  const { setValue, getValues, control } = useFormContext();
  const selected = useWatch({ control, name }) || [];

  const toggle = useCallback(
    (val) => {
      const current = getValues(name) || [];
      const updated = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];
      setValue(name, updated, { shouldValidate: true });
    },
    [name, setValue, getValues]
  );

  return (
    <div className="radio-container">
      {options.map((opt) => {
        const optValue = typeof opt === "object" ? opt.value : String(opt);
        const optLabel = typeof opt === "object" ? opt.label : String(opt);
        return (
          <label
            key={optValue}
            className={`checkbox-label ${selected.includes(optValue) ? "checkbox-label--selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(optValue)}
              onChange={() => toggle(optValue)}
            />
            {optLabel}
          </label>
        );
      })}
    </div>
  );
});

// ── Main Section ───────────────────────────────────────────────────────────────
const RESIDENTIAL_TYPES = ["Flats/Apartments", "Villa", "Plot"];
const COMMERCIAL_TYPES  = ["Shop/Showroom", "Industrial Warehouse/Godown", "Office Space","Commercial Land", "Industrial Building" ];

const typeToGroupMap = Object.fromEntries([
  ...RESIDENTIAL_TYPES.map((t) => [t, "Residential"]),
  ...COMMERCIAL_TYPES.map((t) => [t, "Commercial"]),
]);

const PropertyDetailsSection = () => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const selectedType = useWatch({ control, name: "propertyType" });

  const handleTypeSelect = (label) => {
    setValue("propertyType", label, { shouldValidate: true });
    // propertyGroup is derived server-side but we send it for convenience
    if (typeToGroupMap[label]) {
      setValue("propertyGroup", typeToGroupMap[label], { shouldValidate: false });
    }
  };

  return (
    <section aria-labelledby="details-section-title" className="form-section">
      <h3 id="details-section-title" className="section-title">
        Property Details
      </h3>

      {/* Property Type */}
      <fieldset className="fieldset">
        <legend> 
          Property Type <span className="required">*</span>
        </legend>
        {/* Hidden input so RHF tracks value through Zod */}
        <input type="hidden" {...register("propertyType")} />
        <div className="property-type-grid">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.label}
              type="button"
              className={`property-type-card ${
                selectedType === type.label ? "property-type-card--selected" : ""
              }`}
              onClick={() => handleTypeSelect(type.label)}
              aria-pressed={selectedType === type.label}
            >
              {type.icon && <span className="type-icon">{type.icon}</span>}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        {errors.propertyType && (
          <span className="field-error" role="alert">{errors.propertyType.message}</span>
        )}
      </fieldset>

      {/* BHK */}
      <fieldset className="fieldset">
        <legend>BHK Configuration</legend>
        <RadioGroup name="bhk" options={BHK_OPTIONS} withSuffix="BHK" />
        {errors.bhk && (
          <span className="field-error" role="alert">{errors.bhk.message}</span>
        )}
      </fieldset>

      {/* Bathrooms */}
      <fieldset className="fieldset">
        <legend>Bathrooms</legend>
        <RadioGroup name="bathrooms" options={BATHROOM_OPTIONS} />
      </fieldset>

      {/* Balconies */}
      <fieldset className="fieldset">
        <legend>Balconies</legend>
        <RadioGroup name="balconies" options={BALCONY_OPTIONS} />
      </fieldset>

      {/* Facing */}
      <fieldset className="fieldset">
        <legend>Facing</legend>
        <RadioGroup name="facing" options={FACING_OPTIONS} />
      </fieldset>

      {/* Parking — multi-select maps to schema field "parkings" */}
      <fieldset className="fieldset">
        <legend>Parking</legend>
        <MultiCheckboxGroup name="parkings" options={PARKING_OPTIONS} />
      </fieldset>

      {/* Furnishing */}
      <fieldset className="fieldset">
        <legend>
          Furnishing <span className="required">*</span>
        </legend>
        <RadioGroup name="furnishing" options={FURNISHED_OPTIONS} />
        {errors.furnishing && (
          <span className="field-error" role="alert">{errors.furnishing.message}</span>
        )}
      </fieldset>

      {/* Possession Status */}
      <fieldset className="fieldset">
        <legend>
          Possession Status <span className="required">*</span>
        </legend>
        <RadioGroup name="possessionStatus" options={POSSESSION_STATUS_OPTIONS} />
        {errors.possessionStatus && (
          <span className="field-error" role="alert">{errors.possessionStatus.message}</span>
        )}
      </fieldset>

      {/* Age of Property */}
      <fieldset className="fieldset">
        <legend>Age of Property</legend>
        <RadioGroup name="ageOfProperty" options={AGE_OF_PROPERTY_OPTIONS} />
      </fieldset>
    </section>
  );
};

export default React.memo(PropertyDetailsSection);