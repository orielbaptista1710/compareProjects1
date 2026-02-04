import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { InputNumber, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import {
  AGE_OF_PROPERTY_OPTIONS,
  // FLOOR_OPTIONS,
  PROPERTY_TYPES,
  FURNISHED_OPTIONS,
  POSSESSION_STATUS_OPTIONS,
  BHK_OPTIONS,
  BATHROOM_OPTIONS,
  BALCONY_OPTIONS,
  FACING_OPTIONS,
  PARKING_OPTIONS,
} from "../../../../assests/constants/propertyFormConstants";

const AREA_UNITS = [
  { value: "sqft", label: "Square Feet" },
  { value: "sqmts", label: "Square Meters" },
  { value: "guntas", label: "Guntas" },
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];

const typeToGroupMap = {
  "Flats/Apartments": "Residential",
  Villa: "Residential",
  Plot: "Residential",
  "Shop/Showroom": "Commercial",
  Retail: "Commercial",
  "Industrial Warehouse": "Commercial",
};
  ////////PROPERTY TYPE CHANGE


const PropertyDetailsSection = () => {
  const { control, watch, setValue, getValues, register } = useFormContext();

  const handleCheckboxChange = (name, value) => {
    const current = getValues(name) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(name, updated);
  };

  const RadioGroup = ({ name, options, withSuffix }) => (
    <div className="radio-container">
      {options.map((opt) => {
        const optionValue = typeof opt === "string" ? opt : opt.value;
        const optionLabel = typeof opt === "string" ? opt : opt.label;
        return (
          <label
            key={optionValue}
            className={`radio-label ${watch(name) === optionValue ? "selected" : ""}`}
          >
            <input type="radio" value={optionValue} {...register(name)} />
            {optionLabel} {withSuffix || ""}
          </label>
        );
      })}
    </div>
  );

  return (
    <section aria-labelledby="pricing-section">
      <h3 id="pricing-section" className="section-title">
        Property Details
      </h3>

      {/* Total Price */}
      <div className="form-row">
        <div className="form-col">
          <label>Total Price (₹)</label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
              />
            )}
          />
        </div>
      </div>

      {/* Negotiable & RERA */}
      <div className="form-col">
        <label>
          <Controller
            name="priceNegotiable"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          Price Negotiable
        </label>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label>
            <Controller
              name="reraApproved"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            RERA Approved
          </label>
        </div>

        <div className="form-col">
          <label htmlFor="reraNumber">RERA Number (Optional)</label>
          <Controller
            name="reraNumber"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="reraNumber"
                className="form-control"
                placeholder="Enter RERA Registration No."
                disabled={!watch("reraApproved")}
              />
            )}
          />
        </div>
      </div>

      {/* Age of Property */}
      <fieldset>
        <legend>Age of Property</legend>
        <RadioGroup name="ageOfProperty" options={AGE_OF_PROPERTY_OPTIONS} />
      </fieldset>

      {/* Total Floors */}
      <div className="form-row">
        <div className="form-col">
          <label htmlFor="totalFloors">Total Floors</label>
          <Controller
            name="totalFloors"
            control={control}
            render={({ field }) => (
              <input {...field} type="number" min="1" placeholder="Total floors" />
            )}
          />
        </div>
      </div>

      {/* Floor and Wing */}
<div className="form-row">
  <div className="form-col">
    <label htmlFor="floor">Floor</label>
    <Controller
      name="floor"
      control={control}
      render={({ field }) => (
        <input {...field} type="text" id="floor" placeholder="e.g. 5th Floor" />
      )}
    />
  </div>

  <div className="form-col">
    <label htmlFor="wing">Wing</label>
    <Controller
      name="wing"
      control={control}
      render={({ field }) => (
        <input {...field} type="text" id="wing" placeholder="e.g. A / B / C" />
      )}
    />
  </div>
</div>


      {/* Property Area */}
      <div className="form-row">
        <div className="form-col">
          <label>Property Area</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <Controller
              name="area.value"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} style={{ flex: 2 }} placeholder="Enter area" />
              )}
            />
            <Controller
              name="area.unit"
              control={control}
              render={({ field }) => (
                <Select {...field} options={AREA_UNITS} style={{ flex: 1 }} />
              )}
            />
          </div>
        </div>
      </div>

      {/* Units Available & Available From */}
      <div className="form-row">
        <div className="form-col">
          <label>Units Available</label>
          <Controller
            name="unitsAvailable"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} max={1000} style={{ width: "100%" }} />
            )}
          />
        </div>

        <div className="form-col">
          <label>Available From</label>
          <Controller
            name="reraDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date?.toDate() || null)}
                format="DD/MM/YYYY"
                placeholder="Select date"
              />
            )}
          />
        </div>
      </div>

      {/* Property Type */}
      {/* CHECK THIS FOR SELLPROPERTYFORM CAUSE propertyGroup is derived from propertyType- not needed in form */}
      <fieldset>
        <legend>Property Type</legend>
        <div className="property-type-container">
          {PROPERTY_TYPES.map((type) => (
            <div
              key={type.label}
              className={`property-type-card ${
                watch("propertyType") === type.label ? "selected" : ""
              }`}
              onClick={() => {
                setValue("propertyType", type.label);
                setValue("propertyGroup", typeToGroupMap[type.label]);
              }}
            >
              {type.icon}
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Furnishings, Possession, etc. */}
      <fieldset>
        <legend>Furnishings</legend>
        <RadioGroup name="furnishing" options={FURNISHED_OPTIONS} />
      </fieldset>

      <fieldset>
        <legend>Possession Status</legend>
        <RadioGroup name="possessionStatus" options={POSSESSION_STATUS_OPTIONS} />
      </fieldset>

      <fieldset>
        <legend>BHK Configuration</legend>
        <RadioGroup name="bhk" options={BHK_OPTIONS} withSuffix="BHK" />
      </fieldset>

      <fieldset>
        <legend>Bathrooms</legend>
        <RadioGroup name="bathrooms" options={BATHROOM_OPTIONS} />
      </fieldset>

      <fieldset>
        <legend>Balconies</legend>
        <RadioGroup name="balconies" options={BALCONY_OPTIONS} />
      </fieldset>

      <fieldset>
        <legend>Facing</legend>
        <RadioGroup name="facing" options={FACING_OPTIONS} />
      </fieldset>

      <fieldset>
        <legend>Parking</legend>
        <div className="radio-container">
          {PARKING_OPTIONS.map((option) => (
            <label
              key={option}
              className={`checkbox-label ${
                (watch("parkings") || []).includes(option) ? "selected" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={(watch("parkings") || []).includes(option)}
                onChange={() => handleCheckboxChange("parkings", option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
};

export default PropertyDetailsSection;
