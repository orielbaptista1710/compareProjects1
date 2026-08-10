// sections/PricingSection.jsx
// Price, EMI starts, price negotiable toggle, area value + unit.

import React from "react";
import { useFormContext, Controller } from "react-hook-form";

//can use from propertyFormConstants
// const AREA_UNITS = [
//   { value: "sqft",     label: "sq.ft" },
//   { value: "sqmts",    label: "sq.m" },
//   { value: "guntas",   label: "Guntas" },
//   { value: "hectares", label: "Hectares" },
//   { value: "acres",    label: "Acres" },
// ];

/** Formats number as Indian currency string for display only */
const formatINR = (val) => {
  if (!val && val !== 0) return "";
  const num = Number(String(val).replace(/[^\d]/g, ""));
  if (isNaN(num)) return "";
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000)    return `₹${(num / 1_00_000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const PricingSection = () => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const priceRaw = watch("price");
  const emiRaw   = watch("emiStarts");

  return (
    <section aria-labelledby="pricing-section-title" className="form-section">
      <h3 id="pricing-section-title" className="section-title">
        Pricing &amp; Area
      </h3>

      {/* Price */}
      <div className="form-row">
        <div className="form-col">
          <label htmlFor="price">
            Total Price (₹) <span className="required">*</span>
          </label>
          <input
            id="price"
            {...register("price")}
            type="number"
            min="0"
            placeholder="e.g. 7500000"
            inputMode="numeric"
          />
          {priceRaw && (
            <span className="field-hint" aria-live="polite">
              {formatINR(priceRaw)}
            </span>
          )}
          {errors.price && (
            <span className="field-error" role="alert">{errors.price.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="emiStarts">
            EMI Starts From (₹/mo){" "}
            <span className="optional">(optional)</span>
          </label>
          <input
            id="emiStarts"
            {...register("emiStarts")}
            type="number"
            min="0"
            placeholder="e.g. 45000"
            inputMode="numeric"
          />
          {emiRaw > 0 && (
            <span className="field-hint" aria-live="polite">
              {formatINR(emiRaw)} / month
            </span>
          )}
          {errors.emiStarts && (
            <span className="field-error" role="alert">{errors.emiStarts.message}</span>
          )}
        </div>
      </div>

      {/* Price Negotiable */}
      <div className="form-row">
        <div className="form-col">
          <label className="checkbox-row">
            <Controller
              name="priceNegotiable"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="priceNegotiable"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <span>Price is Negotiable</span>
          </label>
        </div>
      </div>

      {/* Area */}
      {/* <div className="form-row">
        <div className="form-col">
          <label htmlFor="areaValue">
            Property Area <span className="optional">(optional)</span>
          </label>
          <div className="input-group">
            <input
              id="areaValue"
              {...register("areaValue")}
              type="number"
              min="0"
              placeholder="e.g. 1200"
              inputMode="decimal"
              className="input-group__input"
            />
            <select
              {...register("areaUnit")}
              className="input-group__addon"
              aria-label="Area unit"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          {errors.areaValue && (
            <span className="field-error" role="alert">{errors.areaValue.message}</span>
          )}
        </div>
      </div> */}
    </section>
  );
};

export default React.memo(PricingSection);