// sections/PropertyInformationSection.jsx
// Category filter + property type, developer and project name, title and
// descriptions. Category (Residential/Commercial) only narrows the type list;
// it isn't sent — the server derives propertyGroup from propertyType.
import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { PROPERTY_TYPES } from "../../../../assests/constants/propertyFormConstants";

// Same split as backend/models/propertyType.js
const CATEGORY_TYPES = {
  Residential: ["Flats/Apartments", "Villa", "Plot"],
  Commercial: PROPERTY_TYPES.map((t) => t.label).filter(
    (l) => !["Flats/Apartments", "Villa", "Plot"].includes(l)
  ),
};
const CATEGORIES = Object.keys(CATEGORY_TYPES);
const categoryOf = (type) => (CATEGORY_TYPES.Commercial.includes(type) ? "Commercial" : "Residential");

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 500;
const LONG_DESC_MAX = 5000;

const FieldError = ({ id, error }) =>
  error ? (
    <span id={id} className="field-error" role="alert">{error.message}</span>
  ) : null;

const PropertyInformationSection = () => {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  // useWatch (not watch) so typing re-renders only this section
  const titleLen = (useWatch({ control, name: "title" }) || "").length;
  const descLen = (useWatch({ control, name: "description" }) || "").length;
  const longDescLen = (useWatch({ control, name: "long_description" }) || "").length;

  const [category, setCategory] = useState(() => categoryOf(getValues("propertyType")));

  const chooseCategory = (next) => {
    setCategory(next);
    // A type from the other category no longer fits — clear it
    if (!CATEGORY_TYPES[next].includes(getValues("propertyType"))) {
      setValue("propertyType", "", { shouldDirty: true });
    }
  };

  return (
    <section aria-labelledby="info-section-title" className="form-section">
      <h3 id="info-section-title" className="section-title">Basic information</h3>

      <div className="form-row">
        <div className="form-col">
          <span className="field-label" id="category-label">Category</span>
          <div className="spf-segmented" role="group" aria-labelledby="category-label">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => chooseCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-col">
          <label htmlFor="propertyType">
            Property type <span className="required">*</span>
          </label>
          <select
            id="propertyType"
            {...register("propertyType")}
            aria-invalid={errors.propertyType ? "true" : undefined}
            aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
          >
            <option value="">Select a type</option>
            {CATEGORY_TYPES[category].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <FieldError id="propertyType-error" error={errors.propertyType} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="developerName">
            Developer or builder name <span className="required">*</span>
          </label>
          <input
            id="developerName"
            {...register("developerName")}
            placeholder="e.g. Lodha Group"
            autoComplete="organization"
            aria-invalid={errors.developerName ? "true" : undefined}
          />
          <FieldError error={errors.developerName} />
        </div>

        <div className="form-col">
          <label htmlFor="projectName">
            Project name <span className="optional">(optional)</span>
          </label>
          <input
            id="projectName"
            {...register("projectName")}
            placeholder="e.g. Palava City"
            maxLength={150}
            aria-describedby="projectName-help"
          />
          <span id="projectName-help" className="field-hint">
            Listings with the same developer, project and locality are shown together.
          </span>
          <FieldError error={errors.projectName} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <div className="field-label-row">
            <label htmlFor="title">
              Listing title <span className="required">*</span>
            </label>
            <span className="char-count" aria-hidden="true">{titleLen} / {TITLE_MAX}</span>
          </div>
          <input
            id="title"
            {...register("title")}
            placeholder="e.g. 3 BHK apartment in Palava City, Dombivli"
            maxLength={TITLE_MAX}
            aria-describedby="title-help"
            aria-invalid={errors.title ? "true" : undefined}
          />
          <span id="title-help" className="field-hint">
            Include the configuration, project name and locality. Buyers compare by these.
          </span>
          <FieldError error={errors.title} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <div className="field-label-row">
            <label htmlFor="description">
              Short description <span className="required">*</span>
            </label>
            <span className="char-count" aria-hidden="true">{descLen} / {DESCRIPTION_MAX}</span>
          </div>
          <textarea
            id="description"
            {...register("description")}
            placeholder="What stands out: views, layout, nearby schools and metro, what's included in the price."
            rows={4}
            maxLength={DESCRIPTION_MAX}
            aria-invalid={errors.description ? "true" : undefined}
          />
          <FieldError error={errors.description} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <div className="field-label-row">
            <label htmlFor="long_description">
              Detailed description <span className="optional">(optional)</span>
            </label>
            <span className="char-count" aria-hidden="true">{longDescLen} / {LONG_DESC_MAX}</span>
          </div>
          <textarea
            id="long_description"
            {...register("long_description")}
            placeholder="Location advantages, connectivity, nearby infrastructure…"
            rows={6}
            maxLength={LONG_DESC_MAX}
          />
          <FieldError error={errors.long_description} />
        </div>
      </div>
    </section>
  );
};

export default React.memo(PropertyInformationSection);
