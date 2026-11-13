// features/developer-dashboard/property-form/SellPropertyForm.jsx
// New-listing page: header with actions, numbered accordion sections (one
// open at a time) and a right rail with a live buyer preview and the publish
// checklist. Data, validation and the submit payload all still come from
// usePropertyForm + propertySchema.
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { usePropertyForm } from "../../../components/DevDashboardPageComponents/SellPropertyFormComponents/hooks/usePropertyForm";

import PropertyInformationSection from "./sections/PropertyInformationSection";
import SellProLocationSection from "./sections/SellProLocationSection";
import PricingSection from "./sections/PricingSection";
import PropertyDetailsSection from "./sections/PropertyDetailsSection";
import BuildingSection from "./sections/BuildingSection";
import ReraSection from "./sections/ReraSection";
import PropertyAmenitiesSection from "./sections/PropertyAmenitiesSection";
// MediaUploadSection stays "coming soon" until uploads ship.

import PageHeader from "./components/PageHeader";
import SectionCard from "./components/SectionCard";
import BuyerPreview from "./components/BuyerPreview";
import PublishChecklist from "./components/PublishChecklist";
import { useSectionStatus } from "./hooks/useSectionStatus";
import { useDraft, draftKeyFor, removeDraft } from "./hooks/useDraft";
import { SECTIONS, focusFirstError, prefersReducedMotion } from "./sectionConfig";

import "./SellPropertyForm.css";

const FIRST_ID = SECTIONS[0].id;
const NO_VISITS = new Set();

const DRAFT_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const SellPropertyForm = ({
  formData = {},
  onSubmit,
  handleCancelEdit,
  onShowListings,
  editingId,
  isAdding,
  isUpdating,
}) => {
  const isEditing = Boolean(editingId);
  const isSubmitting = isAdding || isUpdating;
  const draftKey = draftKeyFor(editingId);

  // A valid submit means the draft has done its job
  const handleValidSubmit = useCallback(
    (payload) => {
      removeDraft(draftKey);
      onSubmit(payload);
    },
    [draftKey, onSubmit]
  );

  const {
    methods,
    formRef,
    handleSubmit,
    autocompleteRef,
    coordinates,
    handlePlaceChanged,
    handleMapClick,
  } = usePropertyForm({ formData, onSubmit: handleValidSubmit, editingId });
  const { control, trigger, getValues, getFieldState, reset } = methods;

  // ── Which section is open, and which ones the lister has been through ──
  // Reset when switching between add and edit (adjusted during render so
  // there's no flash of the old state).
  const [view, setView] = useState({ key: editingId, openId: FIRST_ID, visited: NO_VISITS });
  let { openId, visited } = view;
  if (view.key !== editingId) {
    openId = FIRST_ID;
    visited = NO_VISITS;
    setView({ key: editingId, openId, visited });
  }

  const pendingScroll = useRef(null); // section id to bring into view
  const pendingFocus = useRef(null);  // Set of invalid field keys to focus

  const goTo = useCallback((nextId, { scroll = true } = {}) => {
    setView((v) => ({
      ...v,
      openId: nextId,
      visited: v.openId && v.openId !== nextId ? new Set(v.visited).add(v.openId) : v.visited,
    }));
    pendingScroll.current = scroll ? nextId : null;
  }, []);

  const toggle = useCallback(
    (id) => goTo(id === openId ? null : id),
    [goTo, openId]
  );

  // After a section opens: focus its first error, or bring its card into view
  useEffect(() => {
    if (!openId) return;
    const card = formRef.current?.querySelector(`[data-section="${openId}"]`);
    if (!card) return;
    const keys = pendingFocus.current;
    pendingFocus.current = null;
    if (keys && focusFirstError(card, keys)) {
      pendingScroll.current = null;
      return;
    }
    if (pendingScroll.current === openId) {
      pendingScroll.current = null;
      card.scrollIntoView?.({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }, [openId, formRef]);

  const invalidKeys = useCallback(
    (section) => new Set(section.fields.filter((f) => getFieldState(f).invalid)),
    [getFieldState]
  );

  // ── Continue: validate only this section, then open the next ──
  const handleContinue = useCallback(
    async (section) => {
      const ok = await trigger(section.fields);
      if (!ok) {
        const card = formRef.current?.querySelector(`[data-section="${section.id}"]`);
        focusFirstError(card, invalidKeys(section));
        return;
      }
      const idx = SECTIONS.findIndex((s) => s.id === section.id);
      goTo(SECTIONS[idx + 1]?.id ?? null);
    },
    [trigger, formRef, invalidKeys, goTo]
  );

  // ── Submit: the hook validates, toasts and sends. If it was blocked (e.g.
  // a value changed after Publish enabled), open the first section with an
  // error; closed sections have no fields in the DOM for the hook to focus.
  const handleFormSubmit = useCallback(
    async (e) => {
      await handleSubmit(e);
      const bad = SECTIONS.find((s) => s.fields.some((f) => getFieldState(f).invalid));
      if (!bad) return;
      const keys = invalidKeys(bad);
      if (bad.id === openId) {
        focusFirstError(formRef.current?.querySelector(`[data-section="${bad.id}"]`), keys);
      } else {
        pendingFocus.current = keys;
        goTo(bad.id, { scroll: false });
      }
    },
    [handleSubmit, getFieldState, invalidKeys, openId, formRef, goTo]
  );

  const status = useSectionStatus(control, { openId, visited });
  const { draft, saveDraft, restoreDraft, discardDraft } = useDraft({ draftKey, getValues, reset });

  const renderSection = (id) => {
    switch (id) {
      case "info":      return <PropertyInformationSection />;
      case "location":  return (
        <SellProLocationSection
          autocompleteRef={autocompleteRef}
          coordinates={coordinates}
          onPlaceChanged={handlePlaceChanged}
          onMapClick={handleMapClick}
        />
      );
      case "pricing":   return <PricingSection />;
      case "details":   return <PropertyDetailsSection />;
      case "building":  return <BuildingSection />;
      case "rera":      return <ReraSection />;
      case "amenities": return <PropertyAmenitiesSection />;
      default:          return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        className="sell-property-form"
        onSubmit={handleFormSubmit}
        noValidate
      >
        <div className="spf-page">
          <PageHeader
            isEditing={isEditing}
            canPublish={status.canPublish}
            isSubmitting={isSubmitting}
            isAdding={isAdding}
            isUpdating={isUpdating}
            onSaveDraft={saveDraft}
            onCancel={handleCancelEdit}
            onShowListings={onShowListings}
          />

          {draft && (
            <div className="spf-draft" role="status">
              <p>You have a draft saved on {DRAFT_DATE.format(draft.savedAt)}.</p>
              <div className="spf-draft__actions">
                <button type="button" className="spf-btn spf-btn--secondary" onClick={restoreDraft}>
                  Restore draft
                </button>
                <button type="button" className="spf-btn spf-btn--quiet" onClick={discardDraft}>
                  Discard
                </button>
              </div>
            </div>
          )}

          <div className="spf-layout">
            <div className="spf-cards">
              {SECTIONS.map((section, i) => {
                const next = SECTIONS[i + 1];
                return (
                  <SectionCard
                    key={section.id}
                    section={section}
                    number={i + 1}
                    isOpen={section.id === openId}
                    onToggle={toggle}
                    footer={
                      !section.comingSoon && next ? (
                        <button
                          type="button"
                          className="spf-btn spf-btn--primary"
                          onClick={() => handleContinue(section)}
                        >
                          Continue to {next.next}
                        </button>
                      ) : null
                    }
                  >
                    {section.comingSoon ? (
                      <p className="spf-coming-soon">
                        Photo, floor plan and brochure uploads are coming soon. You can
                        publish the listing without them and add them later.
                      </p>
                    ) : (
                      renderSection(section.id)
                    )}
                  </SectionCard>
                );
              })}
            </div>

            <aside className="spf-rail" aria-label="Preview and progress">
              <BuyerPreview />
              <PublishChecklist status={status} onOpen={goTo} />
            </aside>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SellPropertyForm;
