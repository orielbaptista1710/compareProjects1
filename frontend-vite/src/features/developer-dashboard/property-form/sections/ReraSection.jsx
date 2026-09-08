// sections/ReraSection.jsx
// RERA approved toggle, conditional RERA number + possession date.

import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";

const ReraSection = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const reraApproved = useWatch({ control, name: "reraApproved" });

  return (
    <section aria-labelledby="rera-section-title" className="form-section">
      <h3 id="rera-section-title" className="section-title">
        RERA &amp; Possession
      </h3>

      {/* RERA Approved toggle */}
      <div className="form-row">
        <div className="form-col">
          <label className="checkbox-row">
            <Controller
              name="reraApproved"
              control={control}
              render={({ field }) => (
                <input
                  id="reraApproved"
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <span>RERA Approved</span>
          </label>
        </div>
      </div>

      {/* Conditional RERA fields — only shown when approved */}
      {reraApproved && (
        <div
          className="form-row rera-fields"
          role="region"
          aria-label="RERA details"
        >
          <div className="form-col">
            <label htmlFor="reraNumber">
              RERA Registration Number <span className="required">*</span>
            </label>
            <input
              id="reraNumber"
              {...register("reraNumber")}
              placeholder="e.g. P51700045678"
              autoCapitalize="characters"
            />
            {errors.reraNumber && (
              <span className="field-error" role="alert">
                {errors.reraNumber.message}
              </span>
            )}
          </div>

          <div className="form-col">
            <label htmlFor="reraDate">
              Possession / RERA Completion Date{" "}
              <span className="optional">(optional)</span>
            </label>
            {/* Plain date input — swap for AntD DatePicker if already in bundle */}
            <input
              id="reraDate"
              {...register("reraDate")}
              type="date"
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.reraDate && (
              <span className="field-error" role="alert">
                {errors.reraDate.message}
              </span>
            )}
          </div>
        </div>
      )}

      {!reraApproved && (
        <p className="field-hint">
          Check the box above if this project has RERA registration.
        </p>
      )}
    </section>
  );
};

export default React.memo(ReraSection);