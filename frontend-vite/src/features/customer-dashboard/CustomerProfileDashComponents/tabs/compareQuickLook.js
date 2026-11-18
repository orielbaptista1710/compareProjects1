// Builds the Compare tab's "Quick look" table: a few headline rows, with the
// best value in each row flagged. Pure (no React) so it's easy to test.
import { formatCurrencyShort, formatIndianNumber, fmtArea } from "../../../../utils/formatters";
import { getAreaInSqft } from "../../../../utils/compareScoring";

const EMPTY = "—";
const READY = new Set(["ready to move", "immediate"]);

const positive = (n) => (Number.isFinite(n) && n > 0 ? n : null);

const pricePerSqft = (p) => {
  const area = getAreaInSqft(p.area);
  return positive(Number(p.pricePerSqft)) ?? (positive(Number(p.price)) && area ? p.price / area : null);
};

// Flags the cells holding the best score. No winner when fewer than two
// properties have a value, or when every value is the same.
const markBest = (scores, pick) => {
  const present = scores.filter((s) => s != null);
  if (present.length < 2) return scores.map(() => false);
  const best = pick(...present);
  if (present.every((s) => s === best)) return scores.map(() => false);
  return scores.map((s) => s === best);
};

const ROWS = [
  {
    id: "price",
    label: "Price",
    text: (p) => (positive(Number(p.price)) ? formatCurrencyShort(p.price) : EMPTY),
    score: (p) => positive(Number(p.price)),
    pick: Math.min,
  },
  {
    id: "ppsf",
    label: "Per sq ft",
    text: (p) => {
      const v = pricePerSqft(p);
      return v ? `₹${formatIndianNumber(Math.round(v))}` : EMPTY;
    },
    score: (p) => {
      const v = pricePerSqft(p);
      return v ? Math.round(v) : null;
    },
    pick: Math.min,
  },
  {
    id: "area",
    label: "Area",
    text: (p) => (getAreaInSqft(p.area) ? fmtArea(p.area) : EMPTY),
    score: (p) => getAreaInSqft(p.area),
    pick: Math.max,
  },
  {
    id: "possession",
    label: "Possession",
    text: (p) => p.possessionStatus || EMPTY,
    // Ready scores 1, anything else known scores 0, so "ready" wins.
    score: (p) => (p.possessionStatus ? (READY.has(p.possessionStatus.toLowerCase()) ? 1 : 0) : null),
    pick: Math.max,
  },
  {
    // Shown for context only — which location is "better" is personal.
    id: "location",
    label: "Location",
    text: (p) => [p.locality, p.city].filter(Boolean).join(", ") || EMPTY,
  },
];

export const buildQuickLook = (properties = []) =>
  ROWS.map((row) => {
    const best = row.score ? markBest(properties.map(row.score), row.pick) : properties.map(() => false);
    return {
      id: row.id,
      label: row.label,
      cells: properties.map((p, i) => ({ text: row.text(p), best: best[i] })),
    };
  });
