// sections/PropertyInformationSection.jsx
// Property type, developer and project name, and descriptions. The listing
// title is generated from these details (features/listings/listingTitle.js).
// The type list is the same one the search bar uses (propertyTypeConfig.js),
// so every type a buyer can filter by can be posted. The group heading
// (Residential / Commercial) isn't sent: the server derives propertyGroup
// from propertyType.
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { PROPERTY_TYPE_CONFIG } from "../../../../assests/constants/propertyTypeConfig";

const TYPE_GROUPS = PROPERTY_TYPE_CONFIG.filter((g) => g.target === "propertyType");
const KNOWN_TYPES = new Set(TYPE_GROUPS.flatMap((g) => g.items.map((i) => i.value)));

const DESCRIPTION_MAX = 500;
const LONG_DESC_MAX = 5000;

const FieldError = ({ id, error }) =>
  error ? (
    <span id={id} className="field-error" role="alert">{error.message}</span>
  ) : null;

// showDeveloperFields: false for owners and agents (see roleConfig.js)
const PropertyInformationSection = ({ showDeveloperFields = true }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  // useWatch (not watch) so typing re-renders only this section
  const descLen = (useWatch({ control, name: "description" }) || "").length;
  const longDescLen = (useWatch({ control, name: "long_description" }) || "").length;

  // An older listing can carry a type that is no longer offered; keep it
  // selectable so the dropdown doesn't show "Select a type" with a value set.
  const propertyType = useWatch({ control, name: "propertyType" });
  const legacyType = propertyType && !KNOWN_TYPES.has(propertyType) ? propertyType : null;

  return (
    <section aria-labelledby="info-section-title" className="form-section">
      <h3 id="info-section-title" className="section-title">Basic information</h3>

      <div className="form-row">
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
            {legacyType && <option value={legacyType}>{legacyType}</option>}
            {TYPE_GROUPS.map((group) => (
              <optgroup key={group.key} label={group.group}>
                {group.items.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldError id="propertyType-error" error={errors.propertyType} />
        </div>
      </div>

      {showDeveloperFields && (
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
      )}

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
