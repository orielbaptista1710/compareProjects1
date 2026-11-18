// features/admin/waiting.js
// How long a pending listing has been waiting for a decision, in the words a
// reviewer scans for ("Waiting 3 days"). Days are enough for a review queue.

const DAY_MS = 24 * 60 * 60 * 1000;

/** @returns {string|null} null when the date is missing, invalid or in the future */
export const waitingLabel = (since, now = Date.now()) => {
  if (!since) return null;
  const elapsed = now - new Date(since).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;

  const days = Math.floor(elapsed / DAY_MS);
  if (days < 1) return "Waiting since today";
  return `Waiting ${days} ${days === 1 ? "day" : "days"}`;
};
