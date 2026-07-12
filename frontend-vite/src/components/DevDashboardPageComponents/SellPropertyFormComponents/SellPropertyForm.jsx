// SellPropertyFormComponents/SellPropertyForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { FormProvider } from "react-hook-form";
import { usePropertyForm } from "./hooks/usePropertyForm";

import PropertyInformationSection from "./property-form/PropertyInformationSection";
import SellProLocationSection from "./property-form/SellProLocationSection";
import PricingSection from "./property-form/PricingSection";
import PropertyDetailsSection from "./property-form/PropertyDetailsSection";
import BuildingSection from "./property-form/BuildingSection";
import ReraSection from "./property-form/ReraSection";
import PropertyAmenitiesSection from "./property-form/PropertyAmenitiesSection";
import MediaUploadSection from "./property-form/MediaUploadSection";

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



// ── Progress bar ───────────────────────────────────────────────
const ProgressBar = ({ activeStep, onStepClick }) => {
  const activeIdx = STEPS.findIndex((s) => s.id === activeStep);
  // line fills from 0 → 100 across the 7 steps
  const pct = activeIdx <= 0 ? 0 : `${(activeIdx / (STEPS.length - 1)) * 88}%`;

  return (
    <nav className="spf-progress" aria-label="Form progress">
      <div
        className="spf-progress__track"
        style={{ "--progress-pct": pct }}
        role="list"
      >
        {STEPS.map((step, idx) => {
          const done   = idx < activeIdx;
          const active = idx === activeIdx;
          return (
            <div
              key={step.id}
              className={[
                "spf-step",
                done   ? "spf-step--done"   : "",
                active ? "spf-step--active" : "",
              ].filter(Boolean).join(" ")}
              role="listitem"
              aria-current={active ? "step" : undefined}
              onClick={() => onStepClick(step.id)}
              onKeyDown={(e) => {
                if (e.key ==='Enter' || e.key === ' '){
                  e.preventDefault();
                  onStepClick(step.id)
                }
              }}
            >
              <div className="spf-step__dot">
                {done ? "✓" : idx + 1}
              </div>
              <span className="spf-step__label">{step.label}</span>
            </div>
          );
        })}
      </div>
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
    handleSubmit,
    isMapsLoaded,
    mapsLoadError,
    autocompleteRef,
    coordinates,
    handlePlaceChanged,
    handleMapClick,
    isGeocoding,
    geocodeError,
  } = usePropertyForm({ formData, onSubmit });

  const isSubmitting = isAdding || isUpdating;

  // Track which section is currently in view for the progress bar
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observers = [];

    STEPS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(id);
        },
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const sectionRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  return (
    <FormProvider {...methods}>
      <form
        className="sell-property-form"
        onSubmit={handleSubmit}
        noValidate
      >

        {/* ── Progress bar ── */}
        <div className="spf-progress-wrapper">
          <ProgressBar activeStep={activeStep}  />
        </div>

        {/* ── Sections ── */}
        <div className="spf-sections">

          <Divider step={1} label="Basic Info" />
          <div ref={sectionRef("info")}>
            <PropertyInformationSection />
          </div>

          <Divider step={2} label="Location" />
          <div ref={sectionRef("location")}>
            <SellProLocationSection
              isMapsLoaded={isMapsLoaded}
              mapsLoadError={mapsLoadError}
              autocompleteRef={autocompleteRef}
              coordinates={coordinates}
              onPlaceChanged={handlePlaceChanged}
              onMapClick={handleMapClick}
              isGeocoding={isGeocoding}
              geocodeError={geocodeError}
            />
          </div>

          <Divider step={3} label="Pricing & Area" />
          <div ref={sectionRef("pricing")}>
            <PricingSection />
          </div>

          <Divider step={4} label="Property Details" />
          <div ref={sectionRef("details")}>
            <PropertyDetailsSection />
          </div>

          <Divider step={5} label="Building Info" />
          <div ref={sectionRef("building")}>
            <BuildingSection />
          </div>

          <Divider step={6} label="RERA" />
          <div ref={sectionRef("rera")}>
            <ReraSection />
          </div>

          <Divider step={7} label="Amenities" />
          <div ref={sectionRef("amenities")}>
            <PropertyAmenitiesSection />
          </div>

          <Divider step={8} label="Media" />
          <div ref={sectionRef("media")}>
            <MediaUploadSection />
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