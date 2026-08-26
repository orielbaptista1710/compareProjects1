// src/utils/formatters.js

/**
 * Format a number using the Indian numbering system.
 *
 * Examples:
 * 12500000 -> ₹1,25,00,000
 * 750000   -> ₹7,50,000
 *
 * Used for full currency/number displays where the complete value
 * should remain visible.
 */
export const formatCurrency = (value, options = {}) => {
  const {
    showSymbol = true,
    fallback = "Price on Request",
  } = options;

  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(num);

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format currency into a shorter, more readable Indian real-estate format.
 *
 * Examples:
 * 12500000 -> ₹1.25 Cr
 * 750000   -> ₹7.5 L
 * 50000    -> ₹50 K
 * 500      -> ₹500
 *
 * `decimals` controls the maximum number of decimal places shown
 * for Cr/L/K values.
 */
export const formatCurrencyShort = (value, options = {}) => {
  const {
    showSymbol = true,
    fallback = "Price on Request",
    decimals = 2,
  } = options;

  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }

  // Prevent invalid decimal settings from causing unexpected output.
  const safeDecimals = Math.max(
    0,
    Math.min(20, Number.isInteger(decimals) ? decimals : 2)
  );

  let formatted;

  if (num >= 10000000) {
    formatted = `${(num / 10000000)
      .toFixed(safeDecimals)
      .replace(/\.00$/, "")} Cr`;
  } else if (num >= 100000) {
    formatted = `${(num / 100000)
      .toFixed(safeDecimals)
      .replace(/\.00$/, "")} L`;
  } else if (num >= 1000) {
    formatted = `${(num / 1000)
      .toFixed(safeDecimals)
      .replace(/\.00$/, "")} K`;
  } else {
    formatted = num.toString();
  }

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format a number using the Indian numbering system.
 *
 * Examples:
 * 12345 -> "12,345"
 * 1234567 -> "12,34,567"
 *
 * Returns null when no value is provided or the value is invalid.
 */
//formateIndianNumber not used anywhere in codebase 
export const formatIndianNumber = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const num = Number(value);

  if (!Number.isFinite(num)) {
    return null;
  }

  return new Intl.NumberFormat("en-IN").format(num);
};

/**
 * Format property area for plain text displays.
 *
 * Examples:
 * { value: 1250, unit: "sqft" } -> "1,250 sqft"
 * { value: 1250 }                -> "1,250 sqft"
 *
 * Used by the Key Details grid and sidebar price/area summary.
 */

//might be able to use in AreaFilter.jsx and etx CHECK THIS
export const formatAreaText = (area) =>
  area?.value != null
    ? `${formatIndianNumber(area.value)} ${area.unit || "sqft"}`
    : null;

/**
 * Return a safe display value when a field is empty.
 *
 * Used by overview/property-detail UI where an em dash should be shown
 * instead of an empty or missing value.
 */
export const safeText = (val) =>
  val != null && val !== "" ? val : "—";

/**
 * Format property area for overview/detail sections.
 *
 * Example:
 * { value: 1250, unit: "sq.ft" } -> "1,250 sq.ft"
 *
 * Returns "—" when the area value is missing.
 */
export const fmtArea = (area) =>
  area?.value != null
    ? `${formatIndianNumber(area.value)} ${area.unit || "sq.ft"}`
    : "—";

/**
 * Format a date for display using the Indian locale.
 *
 * Returns "—" when the date is missing or invalid.
 */
export const fmtDate = (d) => {
  if (!d) {
    return "—";
  }

  const date = new Date(d);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN");
};