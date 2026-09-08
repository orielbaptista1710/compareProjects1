// sections/BuildingSection.jsx
// Total floors, floor of unit, wing, phase, tower, units available.

import React from "react";
import { useFormContext } from "react-hook-form";

const BuildingSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <section aria-labelledby="building-section-title" className="form-section">
      <h3 id="building-section-title" className="section-title">
        Building Details
      </h3>

      <div className="form-row">
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

        <div className="form-col">
          <label htmlFor="floor">Unit Floor</label>
          <input
            id="floor"
            {...register("floor")}
            type="text"
            placeholder="e.g. 12 or Ground"
          />
          {errors.floor && (
            <span className="field-error" role="alert">{errors.floor.message}</span>
          )}
        </div>
      </div>

      <div className="form-row">
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

        <div className="form-col">
          <label htmlFor="tower">
            Tower <span className="optional">(optional)</span>
          </label>
          <input
            id="tower"
            {...register("tower")}
            type="number"
            min="1"
            placeholder="e.g. 3"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col form-col--narrow">
          <label htmlFor="unitsAvailable">
            Units Available <span className="required">*</span>
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