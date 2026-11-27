// features/developer-dashboard/property-form/SellPropertyForm.jsx
// New-listing page: header with actions, numbered accordion sections (one
// open at a time) and a right rail with a live buyer preview and the publish
// checklist. Data, validation and the submit payload all still come from
// usePropertyForm + propertySchema.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { usePropertyForm, toFormValues } from "../../../components/DevDashboardPageComponents/SellPropertyFormComponents/hooks/usePropertyForm";

import PropertyInformationSection from "./sections/PropertyInformationSection";
import SellProLocationSection from "./sections/SellProLocationSection";
import PricingSection from "./sections/PricingSection";
import PropertyDetailsSection from "./sections/PropertyDetailsSection";
import BuildingSection from "./sections/BuildingSection";
import ReraSection from "./sections/ReraSection";
import PropertyAmenitiesSection from "./sections/PropertyAmenitiesSection";
// Shown only when uploads are switched on (sectionConfig.js); "coming soon" until then.
import ListingMediaSection from "./sections/ListingMediaSection";
import { resetMapsBudget } from "./sections/mapsBudget";
import { lockedFieldsOf } from "./lockedFields";

import PageHeader from "./components/PageHeader";
import SectionCard from "./components/SectionCard";
import BuyerPreview from "./components/BuyerPreview";
import PublishChecklist from "./components/PublishChecklist";
import ListingConsentBlock from "./components/ListingConsentBlock";
import SectionStatusProvider from "./components/SectionStatusProvider";
import DraftBar from "./components/DraftBar";
import { draftKeyFor, removeDraft } from "../../listings/draftStorage";
import { serializeValues } from "./draftValues";
import { focusFirstError, prefersReducedMotion, topKey } from "./sectionConfig";
import { formRoleConfig } from "./roleConfig";
import { propertySchemas } from "../../../components/DevDashboardPageComponents/SellPropertyFormComponents/propertySchema";
import { LISTED_BY } from "../../../constants/roles";
import { LISTING_STATUS } from "../../admin/listingStatus";

import "./SellPropertyForm.css";

const NO_VISITS = new Set();

// crypto.randomUUID needs a secure context (https or localhost). Without it,
// no id is sent and the listing is created as before.
const newSubmissionId = () => globalThis.crypto?.randomUUID?.() ?? null;

const SellPropertyForm = ({
  formData = {},
  onSubmit,
  handleCancelEdit,
  onShowListings,
  editingId,
  editingStatus, // status of the listing being edited; "approved" shows a warning
  editingLocked = false, // approved before: type, BHK and location can't change
  isAdding,
  isUpdating,
  draftOwner,
  role = LISTED_BY.DEVELOPER, // LISTED_BY value: which sections and rules apply (roleConfig.js)
}) => {
  // The map allowance is per form opened, not per tab: a lister posting several
  // listings in one visit must not lose the map (runs once, before the sections render).
  useState(resetMapsBudget);
  const { sections, showDeveloperFields, requiredFields } = formRoleConfig(role);
  const unitsRequired = requiredFields.includes("unitsAvailable");
  const schema = propertySchemas[role] ?? propertySchemas[LISTED_BY.DEVELOPER];
  const firstId = sections[0].id;
  const isEditing = Boolean(editingId);
  const isSubmitting = isAdding || isUpdating;
  // Only a field that already has a value is locked after approval (the API's
  // rule), so a legacy listing can still fill in one it never had.
  const lockedFields = useMemo(
    () => (isEditing && editingLocked ? lockedFieldsOf(formData) : []),
    [isEditing, editingLocked, formData]
  );
  const draftKey = draftKeyFor(draftOwner, editingId);

  // The draft is only cleared once the server has saved the listing. A failed
  // save (network, 4xx/5xx) keeps it. removeDraft only touches localStorage,
  // so it's safe even though a successful save closes this form. The flag
  // stops a still-pending autosave from writing the draft back as the form closes.
  const submittedRef = useRef(false);
  // Set below once the form exists: marks the fields a failed save was refused for
  const showServerErrorsRef = useRef(null);
  // One id per new listing, reused if it has to be sent again (double click,
  // a retry after a timeout), so the API creates it once (FORM-11). Kept for
  // this form only, not with the draft: a draft reused later for another
  // property must not be matched to a listing an earlier attempt created.
  const submissionIdRef = useRef(null);
  useEffect(() => {
    submissionIdRef.current = null; // another listing opened (or Cancel Edit)
  }, [editingId]);
  const handleValidSubmit = useCallback(
    (payload) => {
      if (!editingId) submissionIdRef.current ??= newSubmissionId();
      const body = !editingId && submissionIdRef.current
        ? { ...payload, submissionId: submissionIdRef.current }
        : payload;
      return onSubmit(body, {
        onSuccess: () => {
          submittedRef.current = true;
          submissionIdRef.current = null; // the next listing is a new one
          removeDraft(draftKey);
        },
        onError: (err) => showServerErrorsRef.current?.(err?.response?.data?.errors),
      });
    },
    [draftKey, onSubmit, editingId]
  );

  // What the form starts from. A form still equal to it has nothing to save, and
  // a draft saved against another version of the listing is out of date.
  const baseline = useMemo(() => serializeValues(toFormValues(formData)), [formData]);
  const baseVersion = formData.updatedAt ?? null;

  const {
    methods,
    formRef,
    handleSubmit,
    autocompleteRef,
    coordinates,
    syncCoordinates,
    handlePlaceChanged,
    handleMapClick,
    removePin,
  } = usePropertyForm({ formData, onSubmit: handleValidSubmit, editingId, role });
  const { control, trigger, getFieldState } = methods;

  // Editing a saved listing: show anything it already fails (e.g. an older
  // listing with a too-short description). Otherwise Publish is disabled with
  // no field saying why, because errors only appear once a field is touched.
  // Runs after usePropertyForm's reset for the same editingId.
  useEffect(() => {
    if (editingId) trigger();
  }, [editingId, trigger]);

  // ── Which section is open, and which ones the lister has been through ──
  // Reset when switching between add and edit (adjusted during render so
  // there's no flash of the old state).
  const [view, setView] = useState({ key: editingId, openId: firstId, visited: NO_VISITS });
  let { openId, visited } = view;
  if (view.key !== editingId) {
    openId = firstId;
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
      const idx = sections.findIndex((s) => s.id === section.id);
      goTo(sections[idx + 1]?.id ?? null);
    },
    [trigger, formRef, invalidKeys, goTo, sections]
  );

  // ── Submit: the hook validates, toasts and sends. If it was blocked (e.g.
  // a value changed after Publish enabled), open the first section with an
  // error; closed sections have no fields in the DOM for the hook to focus.
  // Open `section` (if it isn't) and focus the first of `keys` in it
  const revealErrors = useCallback(
    (section, keys) => {
      if (section.id === openId) {
        focusFirstError(formRef.current?.querySelector(`[data-section="${section.id}"]`), keys);
      } else {
        pendingFocus.current = keys;
        goTo(section.id, { scroll: false });
      }
    },
    [openId, formRef, goTo]
  );

  const handleFormSubmit = useCallback(
    async (e) => {
      await handleSubmit(e);
      const bad = sections.find((s) => s.fields.some((f) => getFieldState(f).invalid));
      if (bad) revealErrors(bad, invalidKeys(bad));
    },
    [handleSubmit, getFieldState, invalidKeys, revealErrors, sections]
  );

  // ── A save the server refused: { "field.path": "reason" } (FORM-15) ──
  // Each field this form shows gets the server's reason under it, and the first
  // section with one opens. Fields the form doesn't show (e.g. the generated
  // title) are only named in the toast (useMyListings).
  const { setError } = methods;
  const showServerErrors = useCallback(
    (errors) => {
      if (!errors || typeof errors !== "object") return;
      const shown = new Set(sections.flatMap((s) => s.fields));
      const marked = new Set();
      for (const [path, reason] of Object.entries(errors)) {
        // The pin is sent as coordinates.lat/lng but edited as lat/lng
        const field = path.startsWith("coordinates.") ? path.slice("coordinates.".length) : path;
        if (!shown.has(topKey(field))) continue;
        setError(field, { type: "server", message: String(reason) });
        marked.add(topKey(field));
      }
      const bad = sections.find((s) => s.fields.some((f) => marked.has(f)));
      if (bad) revealErrors(bad, new Set(bad.fields.filter((f) => marked.has(f))));
    },
    [sections, setError, revealErrors]
  );
  useEffect(() => {
    showServerErrorsRef.current = showServerErrors;
  }, [showServerErrors]);

  // Neither the progress (SectionStatusProvider) nor autosave (DraftBar) is
  // computed here: both watch every field, which would re-render this whole page
  // on each keystroke. They hold that state in their own small components.

  const renderSection = (id) => {
    switch (id) {
      case "info":      return <PropertyInformationSection showDeveloperFields={showDeveloperFields} />;
      case "location":  return (
        <SellProLocationSection
          autocompleteRef={autocompleteRef}
          coordinates={coordinates}
          onPlaceChanged={handlePlaceChanged}
          onMapClick={handleMapClick}
          onRemovePin={removePin}
          lockedFields={lockedFields}
          mapOnClick={isEditing}
        />
      );
      case "pricing":   return <PricingSection />;
      case "details":   return <PropertyDetailsSection />;
      case "building":  return <BuildingSection unitsRequired={unitsRequired} />;
      case "rera":      return <ReraSection />;
      case "amenities": return <PropertyAmenitiesSection />;
      case "media":     return <ListingMediaSection role={role} />;
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
        <SectionStatusProvider
          control={control}
          openId={openId}
          visited={visited}
          sections={sections}
          schema={schema}
        >
        <div className="spf-page">
          <PageHeader
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            isAdding={isAdding}
            isUpdating={isUpdating}
            onCancel={handleCancelEdit}
            onShowListings={onShowListings}
          />

          {isEditing && editingStatus === LISTING_STATUS.APPROVED && (
            <p className="spf-notice" role="note">
              This listing is live. Saving your changes sends it back for review, and buyers
              won&apos;t see it until our team approves it again.
            </p>
          )}

          {isEditing && editingLocked && (
            <p className="spf-notice" role="note">
              Property type, BHK and location (state, city, locality, pincode, address and
              map pin) can&apos;t be changed on an approved listing once they are filled in. For a different property, post a
              new listing.
            </p>
          )}

          {/* key: another listing (or the account loading) is a fresh open */}
          <DraftBar
            key={draftKey ?? "no-draft"}
            draftKey={draftKey}
            baseline={baseline}
            baseVersion={baseVersion}
            isEditing={isEditing}
            onRestore={syncCoordinates}
            submittedRef={submittedRef}
          />

          <div className="spf-layout">
            <div className="spf-cards">
              {sections.map((section, i) => {
                const next = sections[i + 1];
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

              <ListingConsentBlock
                isEditing={isEditing}
                isSubmitting={isSubmitting}
                isAdding={isAdding}
                isUpdating={isUpdating}
              />
            </div>

            <aside className="spf-rail" aria-label="Preview and progress">
              <BuyerPreview saved={formData} />
              <PublishChecklist sections={sections} onOpen={goTo} />
            </aside>
          </div>
        </div>
        </SectionStatusProvider>
      </form>
    </FormProvider>
  );
};

export default SellPropertyForm;
