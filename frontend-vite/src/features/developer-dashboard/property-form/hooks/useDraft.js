// features/developer-dashboard/property-form/hooks/useDraft.js
// Autosave for the listing form. What you type is saved in this browser a moment
// after you stop (see ../../../listings/draftStorage.js for where and for how
// long), and offered back the next time the form opens.
//
// When a saved draft exists the form first asks what to do with it (continue,
// or start over / use the latest version). Autosave is paused until you answer,
// so a stray keystroke can't overwrite the draft you haven't looked at yet.
import { useCallback, useEffect, useState } from "react";
import { readDraft, writeDraft, removeDraft, removeStaleDrafts } from "../../../listings/draftStorage";
import { pickFormFields, serializeValues } from "../draftValues";

const SAVE_DELAY_MS = 800;

// The listing changed on the server after this draft was saved (another device
// or tab), so the draft may overwrite newer work.
export const isStaleDraft = (draft, baseVersion) =>
  Boolean(draft?.baseVersion && baseVersion && draft.baseVersion !== baseVersion);

/**
 * @param {object}   args
 * @param {string|null} args.draftKey   storage slot (null while the account loads: no drafts)
 * @param {string}   args.baseline      serializeValues() of what the form starts from;
 *                                      a form still equal to it has nothing to save
 * @param {string|null} args.baseVersion  the listing's last-changed time (edit), else null
 * @param {Function} args.getValues     react-hook-form
 * @param {Function} args.reset         react-hook-form
 * @param {Function} args.watch         react-hook-form (callback form)
 * @param {Function} [args.onRestore]   state outside the form (the map pin) follows a restore
 * @param {object}   [args.submittedRef] ref set to true once the server has saved the listing,
 *                                      so a pending autosave can't bring the draft back
 * @returns {{ pending, stale, status, restore, discard }}
 *   pending: the draft waiting for an answer, or null
 *   status:  "idle" (nothing saved yet) | "saved" | "failed" (storage full or blocked)
 */
export const useDraft = ({
  draftKey,
  baseline,
  baseVersion,
  getValues,
  reset,
  watch,
  onRestore,
  submittedRef,
}) => {
  useEffect(() => {
    removeStaleDrafts();
  }, []);

  // The form is remounted per slot (key={draftKey}), so this is read once per
  // open: whatever was saved when this form (or listing) opened.
  const [pending, setPending] = useState(() => readDraft(draftKey));
  const [status, setStatus] = useState("idle");

  // ── Autosave ──
  useEffect(() => {
    if (!draftKey || pending) return undefined;

    let timer = null;

    const save = () => {
      timer = null;
      if (submittedRef?.current) return;
      const values = pickFormFields(getValues());
      if (serializeValues(values) === baseline) {
        // Back to where it started (or never changed): nothing worth keeping
        removeDraft(draftKey);
        setStatus("idle");
        return;
      }
      setStatus(writeDraft(draftKey, { values, baseVersion }) ? "saved" : "failed");
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY_MS);
    };

    // Save right away if the form is about to go (tab switch, closing the page)
    const flush = () => {
      if (!timer) return;
      clearTimeout(timer);
      save();
    };

    const subscription = watch(schedule);
    window.addEventListener("pagehide", flush);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [draftKey, pending, baseline, baseVersion, getValues, watch, submittedRef]);

  const restore = useCallback(() => {
    if (!pending) return;
    const values = pickFormFields(pending.values);
    // keepDefaultValues: the saved listing stays the "clean" baseline
    reset(values, { keepDefaultValues: true });
    // State outside the form (the map pin) has to follow the restored values too
    onRestore?.(values);
    setPending(null);
    setStatus("saved");
  }, [pending, reset, onRestore]);

  const discard = useCallback(() => {
    removeDraft(draftKey);
    setPending(null);
    setStatus("idle");
  }, [draftKey]);

  return {
    pending,
    stale: isStaleDraft(pending, baseVersion),
    status,
    restore,
    discard,
  };
};
