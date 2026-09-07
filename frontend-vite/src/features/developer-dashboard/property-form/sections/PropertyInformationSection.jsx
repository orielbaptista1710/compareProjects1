// /SellPropertyFormComponents/property-form/PropertyInformationSection.jsx
// Developer name, title, short + long description.
import React from "react";
import { useFormContext } from "react-hook-form";

const DESCRIPTION_MAX = 500;
const LONG_DESC_MAX = 5000;

const PropertyInformationSection = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const descLen = (watch("description") || "").length;
  const longDescLen = (watch("long_description") || "").length;

  return (
    <section aria-labelledby="info-section-title" className="form-section">
      <h3 id="info-section-title" className="section-title">
        Property Information
      </h3>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="developerName">
            Developer / Builder Name <span className="required">*</span>
          </label>
          <input
            id="developerName"
            {...register("developerName")}
            placeholder="e.g. Lodha Group"
            autoComplete="organization"
          />
          {errors.developerName && (
            <span className="field-error" role="alert">
              {errors.developerName.message}
            </span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="title">
            Property Title <span className="required">*</span>
          </label>
          <input
            id="title"
            {...register("title")}
            placeholder="e.g. Lodha Palava Phase 3"
          />
          {errors.title && (
            <span className="field-error" role="alert">
              {errors.title.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="description">
            Short Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="A brief 1–3 sentence summary of the property"
            rows={3}
            maxLength={DESCRIPTION_MAX}
          />
          <div className="char-count" aria-live="polite">
            {descLen} / {DESCRIPTION_MAX}
          </div>
          {errors.description && (
            <span className="field-error" role="alert">
              {errors.description.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="long_description">
            Detailed Description{" "}
            <span className="optional">(optional)</span>
          </label>
          <textarea
            id="long_description"
            {...register("long_description")}
            placeholder="Describe location advantages, connectivity, USPs, nearby infrastructure…"
            rows={6}
            maxLength={LONG_DESC_MAX}
          />
          <div className="char-count" aria-live="polite">
            {longDescLen} / {LONG_DESC_MAX}
          </div>
          {errors.long_description && (
            <span className="field-error" role="alert">
              {errors.long_description.message}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(PropertyInformationSection);