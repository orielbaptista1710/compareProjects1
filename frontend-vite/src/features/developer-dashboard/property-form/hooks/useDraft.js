// features/developer-dashboard/property-form/hooks/useDraft.js
// "Save draft" keeps the form in this browser only (localStorage), one slot
// for a new listing and one per listing being edited. Nothing is sent to the
// server. Storage can be blocked (private mode, full quota), so every access
// is wrapped and the form works the same without it.
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

const PREFIX = "spf-draft:";
export const draftKeyFor = (editingId) => `${PREFIX}${editingId ?? "new"}`;

const readDraft = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" && parsed.values ? parsed : null;
  } catch {
    return null;
  }
};

export const removeDraft = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing to remove */
  }
};

export const useDraft = ({ draftKey, getValues, reset }) => {
  // The banner offers whatever was saved when this form (or listing) opened
  const [slot, setSlot] = useState(() => ({ key: draftKey, draft: readDraft(draftKey) }));
  let draft = slot.draft;
  if (slot.key !== draftKey) {
    // Switched between add and edit: show the other listing's draft, if any
    draft = readDraft(draftKey);
    setSlot({ key: draftKey, draft });
  }

  const saveDraft = useCallback(() => {
    try {
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
    setSlot({ key: draftKey, draft: null });
    toast.success("Draft restored");
  }, [draft, draftKey, reset]);

  const discardDraft = useCallback(() => {
    removeDraft(draftKey);
    setSlot({ key: draftKey, draft: null });
  }, [draftKey]);

  return { draft, saveDraft, restoreDraft, discardDraft };
};
