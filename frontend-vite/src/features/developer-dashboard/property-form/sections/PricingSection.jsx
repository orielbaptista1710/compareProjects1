// sections/PricingSection.jsx
// Price (amount + Lakh / Crore, stored as rupees: FORM-06), EMI, negotiable,
// and area with its unit and optional type (FORM-07).

import React from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { AREA_UNITS } from "../../../../assests/constants/propertyFormConstants";
import { AREA_TYPES } from "../../../../constants/listingRules";
import { formatRupees } from "../../../listings/price";
import PriceInput from "../components/PriceInput";

// Labels for the stored area types (constants/listingRules.js)
const AREA_TYPE_LABELS = Object.freeze({
  carpet: "Carpet area",
  built_up: "Built-up area",
  super_built_up: "Super built-up area",
  plot: "Plot area",
});

const PricingSection = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  // useWatch (not watch) so typing re-renders only this section, not the form
  const emiRaw = useWatch({ control, name: "emiStarts" });

  return (
    <section aria-labelledby="pricing-section-title" className="form-section">
      <h3 id="pricing-section-title" className="section-title">
        Pricing &amp; Area
      </h3>

      {/* Price */}
      <div className="form-row">
        <div className="form-col">
          <label htmlFor="price">
            Total Price <span className="required">*</span>
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <PriceInput
                id="price"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                invalid={Boolean(errors.price)}
                describedBy={errors.price ? "price-error" : "price-amount"}
              />
            )}
          />
          {errors.price && (
            <span id="price-error" className="field-error" role="alert">{errors.price.message}</span>
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
            min="1"
            step="1"
            placeholder="e.g. 45000"
            inputMode="numeric"
          />
          {emiRaw > 0 && (
            <span className="field-hint" aria-live="polite">
              {formatRupees(emiRaw)} / month
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
      <div className="form-row">
        <div className="form-col">
          <label htmlFor="areaValue">
            Property Area <span className="optional">(optional)</span>
          </label>
          <div className="input-group">
            <input
              id="areaValue"
              {...register("area.value")}
              type="number"
              min="0"
              placeholder="e.g. 1200"
              inputMode="decimal"
              className="input-group__input"
            />
            <select
              {...register("area.unit")}
              className="input-group__addon"
              aria-label="Area unit"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          {errors.area?.value && (
            <span className="field-error" role="alert">{errors.area.value.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="areaType">
            Area type <span className="optional">(optional)</span>
          </label>
          <select id="areaType" {...register("area.type")}>
            <option value="">Not specified</option>
            {AREA_TYPES.map((t) => (
              <option key={t} value={t}>{AREA_TYPE_LABELS[t]}</option>
            ))}
          </select>
          {errors.area?.type && (
            <span className="field-error" role="alert">{errors.area.type.message}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(PricingSection);