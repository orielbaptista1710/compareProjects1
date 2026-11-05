// features/developer-dashboard/property-form/SellPropertyForm.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { FormProvider } from "react-hook-form";
import { usePropertyForm } from "../../../components/DevDashboardPageComponents/SellPropertyFormComponents/hooks/usePropertyForm";

import PropertyInformationSection from "./sections/PropertyInformationSection";
import SellProLocationSection from "./sections/SellProLocationSection";
import PricingSection from "./sections/PricingSection";
import PropertyDetailsSection from "./sections/PropertyDetailsSection";
import BuildingSection from "./sections/BuildingSection";
import ReraSection from "./sections/ReraSection";
import PropertyAmenitiesSection from "./sections/PropertyAmenitiesSection";
// import MediaUploadSection from "./property-form/MediaUploadSection";

import "./SellPropertyForm.css";

// ── Step definitions ───────────────────────────────────────────
const STEPS = [
  { id: "info",      label: "Basic Info"  },
  { id: "location",  label: "Location"    },
  { id: "pricing",   label: "Pricing"     },
  { id: "details",   label: "Details"     },
  { id: "building",  label: "Building"    },
  { id: "rera",      label: "RERA"        },
  { id: "amenities", label: "Amenities"   },
  { id: "media",     label: "Media"       },
];

// A section counts as "current" while it crosses this band in the middle of
// the viewport. A plain threshold never fires for sections taller than the
// screen (Location with the map, Amenities on mobile).
const ACTIVE_BAND = { rootMargin: "-45% 0px -50% 0px", threshold: 0 };

// After a step click, ignore the observer while the smooth scroll runs so it
// can't highlight the sections it passes (or the one below a short section).
const CLICK_LOCK_MS = 900;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ── Progress bar ───────────────────────────────────────────────
const ProgressBar = ({ activeStep, onStepClick }) => {
  const activeIdx = STEPS.findIndex((s) => s.id === activeStep);
  // line fills from 0 → 88% across the steps
  const pct = activeIdx <= 0 ? "0%" : `${(activeIdx / (STEPS.length - 1)) * 88}%`;

  return (
    <nav className="spf-progress" aria-label="Form progress">
      <ol className="spf-progress__track" style={{ "--progress-pct": pct }}>
        {STEPS.map((step, idx) => {
          const done   = idx < activeIdx;
          const active = idx === activeIdx;
          return (
            <li key={step.id} className="spf-step-item">
              <button
                type="button"
                className={[
                  "spf-step",
                  done   ? "spf-step--done"   : "",
                  active ? "spf-step--active" : "",
                ].filter(Boolean).join(" ")}
                aria-current={active ? "step" : undefined}
                onClick={() => onStepClick(step.id)}
              >
                <span className="spf-step__dot" aria-hidden="true">
                  {done ? "✓" : idx + 1}
                </span>
                <span className="spf-step__label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ── Main component ─────────────────────────────────────────────
const SellPropertyForm = ({
  formData = {},
  onSubmit,
  handleCancelEdit,
  editingId,
  isAdding,
  isUpdating,
}) => {
  const {
    methods,
    formRef,
    handleSubmit,
    autocompleteRef,
    coordinates,
    handlePlaceChanged,
    handleMapClick,
  } = usePropertyForm({ formData, onSubmit, editingId });

  const isSubmitting = isAdding || isUpdating;

  // Track which section is currently in view for the progress bar.
  // Sections are found by their data-step attribute inside the form.
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const lockUntil = useRef(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form || typeof IntersectionObserver === "undefined") return undefined;
    const isLocked = () => Date.now() < lockUntil.current;

    const obs = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit && !isLocked()) setActiveStep(hit.target.dataset.step);
    }, ACTIVE_BAND);
    form.querySelectorAll("[data-step]").forEach((el) => obs.observe(el));

    // The last section can't scroll up into the middle band, so mark it
    // active once the end of the form is on screen.
    const endObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isLocked()) setActiveStep(STEPS[STEPS.length - 1].id);
    });
    const end = form.querySelector(".spf-end");
    if (end) endObs.observe(end);

    return () => {
      obs.disconnect();
      endObs.disconnect();
    };
  }, [formRef]);

  const handleStepClick = useCallback((id) => {
    lockUntil.current = Date.now() + CLICK_LOCK_MS;
    setActiveStep(id);
    formRef.current?.querySelector(`[data-step="${id}"]`)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [formRef]);

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        className="sell-property-form"
        onSubmit={handleSubmit}
        noValidate
      >

        {/* ── Progress bar ── */}
        <div className="spf-progress-wrapper">
          <ProgressBar activeStep={activeStep} onStepClick={handleStepClick} />
        </div>

        {/* ── Sections ── */}
        <div className="spf-sections">

          <Divider step={1} label="Basic Info" />
          <div className="spf-anchor" data-step="info">
            <PropertyInformationSection />
          </div>

          <Divider step={2} label="Location" />
          <div className="spf-anchor" data-step="location">
            <SellProLocationSection
              autocompleteRef={autocompleteRef}
              coordinates={coordinates}
              onPlaceChanged={handlePlaceChanged}
              onMapClick={handleMapClick}
            />
          </div>

          <Divider step={3} label="Pricing & Area" />
          <div className="spf-anchor" data-step="pricing">
            <PricingSection />
          </div>

          <Divider step={4} label="Property Details" />
          <div className="spf-anchor" data-step="details">
            <PropertyDetailsSection />
          </div>

          <Divider step={5} label="Building Info" />
          <div className="spf-anchor" data-step="building">
            <BuildingSection />
          </div>

          <Divider step={6} label="RERA" />
          <div className="spf-anchor" data-step="rera">
            <ReraSection />
          </div>

          <Divider step={7} label="Amenities" />
          <div className="spf-anchor" data-step="amenities">
            <PropertyAmenitiesSection />
          </div>

          <Divider step={8} label="Media" />
          <div className="spf-anchor" data-step="media">
            {/* <MediaUploadSection /> */}
            <section aria-labelledby="media-section-title" className="form-section">
              <h3 id="media-section-title" className="section-title">
                Photos &amp; Media
              </h3>
              <p className="spf-coming-soon">
                Coming soon — photo, floor plan and brochure uploads will be added here.
              </p>
            </section>
          </div>

        </div>

        {/* ── Footer ── */}
        <footer className="spf-footer">
          <div className="form-actions">
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {editingId
                ? isUpdating ? "Updating…"   : "Update Property"
                : isAdding   ? "Submitting…" : "Submit Property"}
            </button>
          </div>
        </footer>
        <div className="spf-end" aria-hidden="true" />
      </form>
    </FormProvider>
  );
};

// ── Divider ────────────────────────────────────────────────────
const Divider = ({ step, label }) => (
  <div className="spf-divider" aria-hidden="true">
    <span className="spf-divider__step">{step}</span>
    <span className="spf-divider__label">{label}</span>
    <hr />
  </div>
);

export default SellPropertyForm;
