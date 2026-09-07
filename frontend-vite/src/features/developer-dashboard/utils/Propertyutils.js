const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Formats a raw number into Indian currency notation.
 * 10000000 → ₹1.00 Cr   |   500000 → ₹5.00 L   |   9999 → ₹9,999
 */
export const defaultFormatPrice = (price) => {
  if (!price && price !== 0) return "Price on Request";
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
};

/**
 * Resolves cover image URL from either the new { url, thumbnail } object shape
 * or the legacy plain string shape. Prepends API base if not an absolute URL.
 */
export const resolveImageUrl = (coverImage) => {
  if (!coverImage) return null;
  const src =
    coverImage?.thumbnail ||
    coverImage?.url ||
    (typeof coverImage === "string" ? coverImage : null);
  if (!src) return null;
  return src.startsWith("http") ? src : `${API_BASE_URL}${src}`;
};

/**
 * Status chip config — maps DB status string to display label + CSS class.
 */
export const STATUS_CONFIG = {
  approved: { label: "Approved", cls: "status--approved" },
  rejected: { label: "Rejected", cls: "status--rejected" },
  pending:  { label: "Pending",  cls: "status--pending"  },
};