// features/developer-dashboard/property-form/components/publishText.js
// The words on the two publish buttons (top of the page and end of the form),
// so they can't drift apart.

export const submitLabelFor = ({ isEditing, isAdding, isUpdating }) => {
  if (isEditing) return isUpdating ? "Updating…" : "Update listing";
  return isAdding ? "Publishing…" : "Publish listing";
};

// Why the button is disabled, or "" when it isn't. Takes the value of
// useSectionStatusContext().
export const publishHintFor = ({ canPublish, byId, onlyConsentMissing }) => {
  if (canPublish) return "";
  if (Object.values(byId).some((s) => s.state === "error")) {
    return "Fix the fields marked in the checklist to publish";
  }
  if (onlyConsentMissing) return "Tick both boxes at the end of the form to publish";
  return "Complete every section to publish";
};
