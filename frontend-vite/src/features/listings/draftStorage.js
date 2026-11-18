// src/features/listings/draftStorage.js
//
// Where unfinished listing forms are kept: this browser's localStorage only,
// nothing goes to the server. One slot per account for a new listing and one per
// listing being edited, keyed `spf-draft:<owner>:<id|new>` so a shared browser
// never offers one account's draft to another.
//
// Rules: a draft expires after 30 days, is removed when the listing is saved,
// and every draft is wiped on logout (a shared or cyber-cafe computer). Storage
// can be blocked or full (private mode, quota), so every access is wrapped and
// the form simply works without it.

const PREFIX = "spf-draft:";
export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// No owner yet (account still loading) → no draft slot.
export const draftKeyFor = (owner, editingId) =>
  owner ? `${PREFIX}${owner}:${editingId ?? "new"}` : null;

// Drafts saved before they were scoped per account ("spf-draft:new").
const isLegacyKey = (key) => key?.startsWith(PREFIX) && !key.slice(PREFIX.length).includes(":");

const isDraft = (d) =>
  d !== null &&
  typeof d === "object" &&
  d.values !== null &&
  typeof d.values === "object" &&
  Number.isFinite(d.savedAt);

const isExpired = (draft) => Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS;

const parse = (raw) => {
  try {
    const parsed = JSON.parse(raw || "null");
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const draftKeys = () => {
  try {
    return Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i)).filter(
      (key) => key?.startsWith(PREFIX)
    );
  } catch {
    return [];
  }
};

/** The saved draft for this slot, or null (none, corrupt, or older than 30 days). */
export const readDraft = (key) => {
  if (!key) return null;
  try {
    const draft = parse(window.localStorage.getItem(key));
    if (draft && isExpired(draft)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
};

/**
 * Save a draft. `baseVersion` is the listing's last-changed time when editing,
 * so a later visit can tell the listing changed after the draft was saved.
 * @returns {boolean} false when storage is full or blocked
 */
export const writeDraft = (key, { values, baseVersion = null }) => {
  if (!key) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), baseVersion, values }));
    return true;
  } catch {
    return false;
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

/** Wipes every listing draft in this browser (called on logout). */
export const clearListingDrafts = () => {
  try {
    draftKeys().forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* storage unavailable */
  }
};

/** Housekeeping when a form opens: drops unscoped legacy drafts and expired ones. */
export const removeStaleDrafts = () => {
  try {
    draftKeys().forEach((key) => {
      if (isLegacyKey(key)) {
        window.localStorage.removeItem(key);
        return;
      }
      const draft = parse(window.localStorage.getItem(key));
      if (draft && isExpired(draft)) window.localStorage.removeItem(key);
    });
  } catch {
    /* storage unavailable */
  }
};
