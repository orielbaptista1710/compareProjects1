// A unit's floor: typed as text in the listing form, stored as a number by the
// API (0 = ground, -1 = B1, -2 = B2 …), shown as text again (FORM-18).
import { FLOOR_RANGE } from "../../constants/listingRules";

const GROUND = /^(g|gf|ground|ground floor|upper ground|upper ground floor|ug|ugf)$/;
const LOWER_GROUND = /^(lg|lgf|lower ground|lower ground floor)$/;
// "B1", "B 2", "Basement", "Basement 2"
const BASEMENT = /^(?:b|basement)\s*(\d)?$/;
// "12", "12th", "12th floor", "1st"; "-1" as the API stores a basement
const NUMBERED = /^(-?\d{1,3})(?:st|nd|rd|th)?(?:\s*floor)?$/;

/**
 * "12th" → 12, "Ground" / "Upper ground" → 0, "B2" → -2, "" → undefined.
 * Text it doesn't understand, or a floor outside FLOOR_RANGE, gives NaN, so the
 * form can say so instead of silently dropping it.
 */
export const parseFloor = (value) => {
  if (typeof value === "number") return Number.isInteger(value) ? inRange(value) : NaN;
  const text = String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return undefined;
  if (GROUND.test(text)) return 0;
  if (LOWER_GROUND.test(text)) return -1;
  const basement = text.match(BASEMENT);
  if (basement) return inRange(-Number(basement[1] ?? 1));
  const numbered = text.match(NUMBERED);
  if (numbered) return inRange(Number(numbered[1]));
  return NaN;
};

const inRange = (n) => (n >= FLOOR_RANGE.lowest && n <= FLOOR_RANGE.highest ? n : NaN);

/** 0 → "Ground", -2 → "B2", 7 → "7". Text and blanks pass through. */
export const floorText = (floor) => {
  if (typeof floor !== "number") return floor ?? "";
  if (floor === 0) return "Ground";
  return floor < 0 ? `B${-floor}` : String(floor);
};

export const FLOOR_HINT = `Enter a floor number, Ground, or B1–B${-FLOOR_RANGE.lowest}`;
