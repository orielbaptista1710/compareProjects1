// sections/BuildingSection.jsx
// Total floors, floor of unit, wing, phase, tower, units available. Fields the
// property type doesn't have are hidden (a Plot has no floors, FORM-08).

import React from "react";
import { useFormContext } from "react-hook-form";
import { TEXT_LIMITS as MAX } from "../../../../constants/listingRules";
import { useTypeFields } from "../hooks/useTypeFields";

// unitsRequired: developers must give units available; agents may (roleConfig.js)
const BuildingSection = ({ unitsRequired = true }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const { skips } = useTypeFields();

  return (
    <section aria-labelledby="building-section-title" className="form-section">
      <h3 id="building-section-title" className="section-title">
        Building Details
      </h3>

      {!(skips("totalFloors") && skips("floor")) && (
      <div className="form-row">
        {!skips("totalFloors") && (
        <div className="form-col">
          <label htmlFor="totalFloors">Total Floors in Building</label>
          <input
            id="totalFloors"
            {...register("totalFloors")}
            type="number"
            min="1"
            placeholder="e.g. 25"
            inputMode="numeric"
          />
          {errors.totalFloors && (
            <span className="field-error" role="alert">{errors.totalFloors.message}</span>
          )}
        </div>
        )}

        {!skips("floor") && (
        <div className="form-col">
          <label htmlFor="floor">Unit Floor</label>
          <input
            id="floor"
            {...register("floor")}
            type="text"
            placeholder="e.g. 12, Ground or B1"
            aria-invalid={errors.floor ? "true" : undefined}
          />
          {errors.floor && (
            <span className="field-error" role="alert">{errors.floor.message}</span>
          )}
        </div>
        )}
      </div>
      )}

      <div className="form-row">
        {!skips("wing") && (
        <div className="form-col">
          <label htmlFor="wing">
            Wing <span className="optional">(optional)</span>
          </label>
          <input
            id="wing"
            {...register("wing")}
            type="text"
            placeholder="e.g. A, B, East"
            maxLength={10}
          />
        </div>
        )}

        <div className="form-col">
          <label htmlFor="phase">
            Phase <span className="optional">(optional)</span>
          </label>
          <input
            id="phase"
            {...register("phase")}
            type="text"
            placeholder="e.g. Phase 1"
            maxLength={20}
          />
        </div>

        {!skips("tower") && (
        <div className="form-col">
          <label htmlFor="tower">
            Tower <span className="optional">(optional)</span>
          </label>
          <input
            id="tower"
            {...register("tower")}
            type="text"
            placeholder="e.g. A or T2"
            maxLength={MAX.tower}
            aria-invalid={errors.tower ? "true" : undefined}
          />
          {errors.tower && (
            <span className="field-error" role="alert">{errors.tower.message}</span>
          )}
        </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-col form-col--narrow">
          <label htmlFor="unitsAvailable">
            Units Available{" "}
            {unitsRequired
              ? <span className="required">*</span>
              : <span className="optional">(optional)</span>}
          </label>
          <input
            id="unitsAvailable"
            {...register("unitsAvailable")}
            type="number"
            min="1"
            placeholder="e.g. 4"
            inputMode="numeric"
          />
          {errors.unitsAvailable && (
            <span className="field-error" role="alert">{errors.unitsAvailable.message}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(BuildingSection);