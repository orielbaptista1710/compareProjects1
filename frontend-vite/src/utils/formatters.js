/**
 * Format a number using the Indian numbering system.
 *
 * Examples:
 * 12500000 -> ₹1,25,00,000
 * 750000 -> ₹7,50,000
 *
 * Used when the complete currency value should remain visible.
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
 * Remove unnecessary trailing decimal zeros.
 *
 * Examples:
 * "7.50" -> "7.5"
 * "7.00" -> "7"
 */
const trimTrailingZeros = (value) =>
  value.replace(/\.?0+$/, "");

/**
 * Format currency into a shorter Indian real-estate format.
 *
 * Examples:
 * 12500000 -> ₹1.25 Cr
 * 750000 -> ₹7.5 L
 * 50000 -> ₹50 K
 * 500 -> ₹500
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

  const safeDecimals = Math.max(
    0,
    Math.min(20, Number.isInteger(decimals) ? decimals : 2)
  );

  let formatted;

  if (num >= 10000000) {
    formatted = `${trimTrailingZeros(
      (num / 10000000).toFixed(safeDecimals)
    )} Cr`;
  } else if (num >= 100000) {
    formatted = `${trimTrailingZeros(
      (num / 100000).toFixed(safeDecimals)
    )} L`;
  } else if (num >= 1000) {
    formatted = `${trimTrailingZeros(
      (num / 1000).toFixed(safeDecimals)
    )} K`;
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
 * Returns null when the value is missing or invalid.
 */
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
 * Format property area for text displays.
 *
 * Returns the configured fallback when the area is missing or invalid.
 */
export const formatAreaText = (area, options = {}) => {
  const {
    fallback = null,
    defaultUnit = "sqft",
  } = options;

  if (area?.value == null) {
    return fallback;
  }

  const formattedValue = formatIndianNumber(area.value);

  if (formattedValue == null) {
    return fallback;
  }

  return `${formattedValue} ${area.unit || defaultUnit}`;
};

/**
 * Return a safe display value when a field is empty.
 */
export const safeText = (value) => {
  if (value == null) {
    return "—";
  }

  if (typeof value === "string" && value.trim() === "") {
    return "—";
  }

  return value;
};

/**
 * Format property area for overview/detail sections.
 */
export const fmtArea = (area) =>
  formatAreaText(area, {
    fallback: "—",
    defaultUnit: "sq.ft",
  });

/**
 * Format a date for display using the Indian locale.
 *
 * Returns "—" when the date is missing or invalid.
 */
export const fmtDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};