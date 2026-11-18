// features/listings/price.js
// A price is typed as an amount and a unit ("75" + Lakh) and stored as whole
// rupees (7500000), FORM-06. Only the form knows about units; the API and the
// database only ever see rupees.

export const PRICE_UNITS = Object.freeze([
  { value: "lakh", label: "Lakh", rupees: 100000 },
  { value: "crore", label: "Crore", rupees: 10000000 },
  { value: "rupees", label: "Rupees", rupees: 1 },
]);

const RUPEES_PER = Object.fromEntries(PRICE_UNITS.map((u) => [u.value, u.rupees]));
const AMOUNT = /^\d*\.?\d*$/;

// 1.2500 → "1.25"; enough places to keep every rupee of a crore amount
const plain = (n) => String(Number(n.toFixed(7)));

/**
 * Typed amount + unit → whole rupees. "" while blank, NaN if it isn't a number.
 * @param {string} amount e.g. "75", "1.25" (commas are ignored)
 * @param {string} unit   a PRICE_UNITS value
 */
export const toRupees = (amount, unit) => {
  const text = String(amount ?? "").replace(/,/g, "").trim();
  if (!text) return "";
  if (!AMOUNT.test(text) || text === ".") return NaN;
  return Math.round(Number(text) * (RUPEES_PER[unit] ?? 1));
};

/**
 * Rupees → the amount and unit to show: 7500000 → { "75", lakh },
 * 12500000 → { "1.25", crore }. A blank price starts in Lakh.
 */
export const splitPrice = (rupees) => {
  const n = Number(rupees);
  if (rupees === "" || rupees == null || !Number.isFinite(n) || n <= 0) {
    return { amount: rupees == null || Number.isNaN(n) ? "" : String(rupees), unit: "lakh" };
  }
  const unit = n >= RUPEES_PER.crore ? "crore" : n >= RUPEES_PER.lakh ? "lakh" : "rupees";
  return { amount: plain(n / RUPEES_PER[unit]), unit };
};

/** 7500000 → "₹75,00,000" (Indian digit grouping) */
export const formatRupees = (rupees) => `₹${Number(rupees).toLocaleString("en-IN")}`;

/** 7500000 → "75 Lakh", 12500000 → "1.25 Crore"; "" under a lakh */
export const priceInWords = (rupees) => {
  const n = Number(rupees);
  if (n >= RUPEES_PER.crore) return `${Number((n / RUPEES_PER.crore).toFixed(2))} Crore`;
  if (n >= RUPEES_PER.lakh) return `${Number((n / RUPEES_PER.lakh).toFixed(2))} Lakh`;
  return "";
};
