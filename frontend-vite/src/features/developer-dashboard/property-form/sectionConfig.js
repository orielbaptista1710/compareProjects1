// features/developer-dashboard/property-form/sectionConfig.js
// One list drives the section cards, the "Continue to …" buttons and the
// "Before you publish" checklist, so names and order can't drift apart.
//
// fields: top-level form keys in the section. Status and Continue only look at
//   these ("area" covers area.value + area.unit).
// needsVisit: nothing in the section is required, so it only counts as done
//   once the lister has opened it (or it already has values, in edit mode).
// comingSoon: shown, but not counted in the progress total.

export const SECTIONS = [
  {
    id: "info",
    title: "Basic information",
    next: "basic information",
    description: "What you're listing and the words buyers read first.",
    fields: ["propertyType", "developerName", "projectName", "title", "description", "long_description"],
  },
  {
    id: "location",
    title: "Location",
    next: "location",
    description: "Address, locality and map pin.",
    fields: ["state", "city", "locality", "address", "pincode", "mapLink", "lat", "lng"],
  },
  {
    id: "pricing",
    title: "Price and area",
    next: "price and area",
    description: "Expected price, EMI and area.",
    fields: ["price", "emiStarts", "priceNegotiable", "area"],
  },
  {
    id: "details",
    title: "Property details",
    next: "property details",
    description: "Bedrooms, bathrooms, furnishing and facing.",
    fields: ["bhk", "bathrooms", "balconies", "facing", "parkings", "furnishing", "ageOfProperty"],
  },
  {
    id: "building",
    title: "Building",
    next: "building",
    description: "Floors, tower and units available.",
    fields: ["totalFloors", "floor", "wing", "phase", "tower", "unitsAvailable"],
  },
  {
    id: "rera",
    title: "RERA and possession",
    next: "RERA and possession",
    description: "Possession status, RERA number and completion date.",
    fields: ["possessionStatus", "reraApproved", "reraNumber", "reraDate"],
  },
  {
    id: "amenities",
    title: "Amenities",
    next: "amenities",
    description: "Amenities, facilities and security.",
    fields: ["amenities", "facilities", "security"],
    needsVisit: true,
  },
  {
    id: "media",
    title: "Photos and documents",
    next: "photos and documents",
    description: "Photos, floor plans and brochure.",
    fields: [],
    comingSoon: true,
  },
];

export const COUNTED_SECTIONS = SECTIONS.filter((s) => !s.comingSoon);

// Property.js possessionStatus enum
export const POSSESSION_OPTIONS = [
  "Ready to Move",
  "Under Construction",
  "Immediate",
  "New Launch",
  "Pre Launch",
  "Upcoming",
];

// "area.value" → "area"
export const topKey = (name) => String(name).split(".")[0];

const SECTION_BY_FIELD = new Map(
  SECTIONS.flatMap((s) => s.fields.map((f) => [f, s.id]))
);
export const sectionOfField = (name) => SECTION_BY_FIELD.get(topKey(name));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Focus the first invalid field inside `root`, in page order. Pill inputs are
// visually hidden, so scroll their group into view.
export const focusFirstError = (root, errorKeys) => {
  if (!root || !errorKeys.size) return false;
  const el = [...root.querySelectorAll("[name]")].find((n) => errorKeys.has(topKey(n.name)));
  if (!el) return false;
  const group = el.closest(".form-col, .fieldset") || el;
  const target = el.type === "hidden" ? group.querySelector("button, input:not([type=hidden])") : el;
  group.scrollIntoView?.({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  target?.focus({ preventScroll: true });
  return true;
};
