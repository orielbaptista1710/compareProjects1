// src/utils/sortOptions.js
// Single list of sort choices for the properties page. `value` must match a key
// of GROUP_SORT_MAP in backend/controllers/propertyController.js; an unknown
// value silently falls back to "relevance" on the server.
export const SORT_OPTIONS = [
  { value: "relevance",      label: "Relevance" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "newest",         label: "Newest" },
  { value: "oldest",         label: "Oldest" },
];
