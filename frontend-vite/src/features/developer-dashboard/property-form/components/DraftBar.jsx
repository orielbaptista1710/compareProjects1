// features/developer-dashboard/property-form/components/DraftBar.jsx
// The one place the form talks about drafts. Either a question about a saved
// draft ("continue?"), or a quiet line saying work is saved automatically.
//
// Render it with key={draftKey}: a new slot (another listing, or the account
// loading) is a fresh open. It holds all the autosave state, so a save never
// re-renders the form around it.
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDraft } from "../hooks/useDraft";

const SAVED_AT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const STATUS_TEXT = {
  idle: "Your work is saved automatically on this device.",
  saved: "Saved on this device.",
  failed: "Couldn't save on this device. Browser storage is full or blocked.",
};

const DraftBar = ({ draftKey, baseline, baseVersion, isEditing, onRestore, submittedRef }) => {
  const { getValues, reset, watch } = useFormContext();
  const { pending, stale, status, restore, discard } = useDraft({
    draftKey,
    baseline,
    baseVersion,
    getValues,
    reset,
    watch,
    onRestore,
    submittedRef,
  });

  // A fresh open: the last save (if any) isn't the one that just went through
  useEffect(() => {
    if (submittedRef) submittedRef.current = false;
  }, [submittedRef]);

  if (!draftKey) return null; // account still loading: no draft slot yet

  if (pending) {
    const savedAt = SAVED_AT.format(pending.savedAt);
    const question = stale
      ? "This listing changed after you saved these edits. Which version do you want?"
      : isEditing
        ? `You have unsaved changes to this listing, saved on ${savedAt}.`
        : `You have an unfinished listing, saved on ${savedAt}.`;
    const [keepLabel, dropLabel] = stale
      ? ["Use my draft", "Use the latest version"]
      : isEditing
        ? ["Continue", "Discard changes"]
        : ["Continue", "Start over"];

    return (
      <div className="spf-draft" role="status">
        <div>
          <p>{question}</p>
          <p className="spf-draft__note">What you type now isn&apos;t saved until you choose.</p>
        </div>
        <div className="spf-draft__actions">
          <button type="button" className="spf-btn spf-btn--primary" onClick={restore}>
            {keepLabel}
          </button>
          <button type="button" className="spf-btn spf-btn--quiet" onClick={discard}>
            {dropLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <p className={`spf-autosave${status === "failed" ? " is-error" : ""}`} role="status">
      {STATUS_TEXT[status]}
    </p>
  );
};

export default DraftBar;
