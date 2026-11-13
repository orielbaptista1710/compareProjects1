// features/developer-dashboard/property-form/hooks/useDraft.js
// "Save draft" keeps the form in this browser only (localStorage), one slot
// per developer for a new listing and one per listing being edited. Nothing
// is sent to the server. Storage can be blocked (private mode, full quota),
// so every access is wrapped and the form works the same without it.
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const PREFIX = "spf-draft:";

// Scoped to the signed-in developer so a shared browser never offers one
// account's draft to another. No owner yet (still loading) → no draft slot.
export const draftKeyFor = (owner, editingId) =>
  owner ? `${PREFIX}${owner}:${editingId ?? "new"}` : null;

// Drafts saved before they were scoped per developer ("spf-draft:new").
const isLegacyKey = (key) => key?.startsWith(PREFIX) && !key.slice(PREFIX.length).includes(":");

const isDraft = (d) =>
  d !== null &&
  typeof d === "object" &&
  d.values !== null &&
  typeof d.values === "object" &&
  Number.isFinite(d.savedAt);

const readDraft = (key) => {
  if (!key) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const removeDraft = (key) => {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing to remove */
  }
};

const removeLegacyDrafts = () => {
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i));
    keys.filter(isLegacyKey).forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
};

export const useDraft = ({ draftKey, getValues, reset, onRestore }) => {
  useEffect(removeLegacyDrafts, []);

  // The banner offers whatever was saved when this form (or listing) opened
  const [slot, setSlot] = useState(() => ({ key: draftKey, draft: readDraft(draftKey) }));
  let draft = slot.draft;
  if (slot.key !== draftKey) {
    // Switched between add and edit (or the owner loaded): show that slot's draft
    draft = readDraft(draftKey);
    setSlot({ key: draftKey, draft });
  }

  const saveDraft = useCallback(() => {
    try {
      if (!draftKey) throw new Error("No draft owner");
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ savedAt: Date.now(), values: getValues() })
      );
      toast.success("Draft saved in this browser");
    } catch {
      toast.error("Couldn't save the draft. Browser storage is full or blocked.");
    }
  }, [draftKey, getValues]);

  const restoreDraft = useCallback(() => {
    if (!draft) return;
    // keepDefaultValues: the saved listing stays the "clean" baseline
    reset(draft.values, { keepDefaultValues: true });
    // State outside RHF (the map pin) has to follow the restored values too
    onRestore?.(draft.values);
    setSlot({ key: draftKey, draft: null });
    toast.success("Draft restored");
  }, [draft, draftKey, reset, onRestore]);

  const discardDraft = useCallback(() => {
    removeDraft(draftKey);
    setSlot({ key: draftKey, draft: null });
  }, [draftKey]);

  return { draft, saveDraft, restoreDraft, discardDraft };
};
