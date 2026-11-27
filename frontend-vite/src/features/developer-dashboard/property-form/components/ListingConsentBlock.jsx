// features/developer-dashboard/property-form/components/ListingConsentBlock.jsx
// The end of the form: the two ticks the API requires, and a second publish
// button so the lister doesn't scroll back up. The button is a plain submit, so
// it runs the same handler and follows the same disabled rules as the one in
// PageHeader.
import { useFormContext, useFormState } from "react-hook-form";
import { useSectionStatusContext } from "../hooks/sectionStatusContext";
import { publishHintFor, submitLabelFor } from "./publishText";

const ListingConsentBlock = ({ isEditing, isSubmitting, isAdding, isUpdating }) => {
  const { register, control } = useFormContext();
  const { errors } = useFormState({ control });
  const status = useSectionStatusContext();
  const hint = publishHintFor(status);

  return (
    <section className="spf-end" aria-labelledby="spf-end-title">
      <div className="spf-end__block">
        <h2 id="spf-end-title" className="spf-end__title">Before you publish</h2>

        <label className="checkbox-row spf-end__check">
          <input type="checkbox" {...register("termsAccepted")} aria-invalid={Boolean(errors.termsAccepted)} />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </span>
        </label>
        {errors.termsAccepted && (
          <span className="field-error" role="alert">{errors.termsAccepted.message}</span>
        )}

        <label className="checkbox-row spf-end__check">
          <input type="checkbox" {...register("detailsConfirmed")} aria-invalid={Boolean(errors.detailsConfirmed)} />
          <span>I confirm the details in this listing are accurate</span>
        </label>
        {errors.detailsConfirmed && (
          <span className="field-error" role="alert">{errors.detailsConfirmed.message}</span>
        )}

        <p className="spf-end__nudge">
          A right locality, city and pin means genuine responses from real buyers.
        </p>
      </div>

      <div className="spf-end__actions">
        {hint && (
          <p className="spf-page-header__hint" id="spf-publish-hint-end">{hint}</p>
        )}
        <button
          type="submit"
          className="spf-btn spf-btn--primary"
          disabled={!status.canPublish || isSubmitting}
          aria-busy={isSubmitting}
          aria-describedby={hint ? "spf-publish-hint-end" : undefined}
        >
          {submitLabelFor({ isEditing, isAdding, isUpdating })}
        </button>
      </div>
    </section>
  );
};

export default ListingConsentBlock;
