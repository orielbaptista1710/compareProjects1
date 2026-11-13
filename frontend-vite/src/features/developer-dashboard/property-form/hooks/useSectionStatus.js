// features/developer-dashboard/property-form/hooks/useSectionStatus.js
// Derives each section's status from the live form values and errors —
// nothing is stored, so it can't go stale after a reset or edit switch.
//
//   "done"     — the schema has no issues for this section's fields
//   "error"    — the lister has been shown errors here (RHF errors)
//   "progress" — open, or partly filled in
//   "todo"     — untouched
//   "soon"     — coming soon, not counted
//
// Uses the same propertySchema as submit, so "done" and canPublish mean
// exactly what submit will accept.
import { useFormState, useWatch } from "react-hook-form";
import { propertySchema } from "../../../../components/DevDashboardPageComponents/SellPropertyFormComponents/propertySchema";
import { SECTIONS, COUNTED_SECTIONS, sectionOfField } from "../sectionConfig";

const hasValue = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "" && v !== false;

// RHF errors are nested ({ area: { value: {...} } }); count one per message
const countMessages = (err) => {
  if (!err || typeof err !== "object") return 0;
  if (err.message) return 1;
  return Object.values(err).reduce((n, child) => n + countMessages(child), 0);
};

// Defaults that don't mean the lister started the section
const isDefault = (field, v) =>
  (field === "ageOfProperty" && v === "New") ||
  (field === "area" && !hasValue(v?.value));

export const useSectionStatus = (control, { openId, visited }) => {
  const values = useWatch({ control });
  const { errors } = useFormState({ control });

  // Not memoised on purpose: RHF mutates its errors object in place, so a
  // cache keyed on it can go stale. One parse of ~40 fields is cheap.
  const result = propertySchema.safeParse(values);
  const issueSections = new Set();
  if (!result.success) {
    for (const issue of result.error.issues) {
      const id = sectionOfField(issue.path[0]);
      if (id) issueSections.add(id);
    }
  }
  // The RERA refine may not run while other fields are invalid
  if (values?.reraApproved && !String(values.reraNumber || "").trim()) issueSections.add("rera");

  const byId = {};
  for (const s of SECTIONS) {
    if (s.comingSoon) {
      byId[s.id] = { state: "soon", errorCount: 0 };
      continue;
    }
    const errorCount = s.fields.reduce((n, f) => n + countMessages(errors?.[f]), 0);
    const started = s.fields.some((f) => hasValue(values?.[f]) && !isDefault(f, values?.[f]));
    const reached = !s.needsVisit || visited.has(s.id) || started;
    let state = "todo";
    if (errorCount > 0) state = "error";
    else if (!issueSections.has(s.id) && reached) state = "done";
    else if (s.id === openId || started) state = "progress";
    byId[s.id] = { state, errorCount };
  }

  const done = COUNTED_SECTIONS.filter((s) => byId[s.id].state === "done").length;
  return {
    byId,
    done,
    total: COUNTED_SECTIONS.length,
    canPublish: result.success && !issueSections.has("rera"),
  };
};
