// features/admin/changedFields.js
// Wording for "what did the poster change?" on an edited listing. The backend
// stores only the NAMES of the fields that changed (updateProperty), taken from
// its input allowlist; they're turned into labels here. Anything it doesn't
// know falls back to the raw name, which React renders as plain text.

const LABELS = {
  title: "Title",
  description: "Short description",
  long_description: "Detailed description",
  developerName: "Developer name",
  projectName: "Project name",
  listingType: "Sale or resale",
  state: "State",
  city: "City",
  locality: "Locality",
  sub_locality: "Sub-locality",
  address: "Address",
  pincode: "Pincode",
  mapLink: "Map link",
  coordinates: "Map pin",
  price: "Price",
  emiStarts: "EMI",
  priceNegotiable: "Price negotiable",
  area: "Area",
  propertyType: "Property type",
  furnishing: "Furnishing",
  possessionStatus: "Possession status",
  facing: "Facing",
  ageOfProperty: "Age of property",
  floorLabel: "Floor label",
  bhk: "Bedrooms",
  bathrooms: "Bathrooms",
  balconies: "Balconies",
  parkings: "Parking",
  totalFloors: "Total floors",
  floor: "Floor",
  wing: "Wing",
  phase: "Phase",
  tower: "Tower",
  unitsAvailable: "Units available",
  amenities: "Amenities",
  facilities: "Facilities",
  security: "Security",
  reraNumber: "RERA number",
  reraDate: "Completion date",
  coverImage: "Cover photo",
  galleryImages: "Photos",
  floorPlans: "Floor plans",
  mediaFiles: "Media",
  virtualTours: "Virtual tours",
  brochure: "Brochure",
};

/** "galleryImages.0.url" → "Photos"; unknown names come back as they are. */
export const fieldLabel = (path) => {
  const key = String(path).split(".")[0];
  return LABELS[key] ?? key;
};

// Fields that change what buyers are told about the property's identity or
// price, so a reviewer should look at them first.
const PRIORITY = new Set(["title", "price", "address", "locality", "city", "state", "pincode", "propertyType"]);

/** [{ key, label, priority }] — priority fields first, then in the order sent. */
export const describeChangedFields = (fields) => {
  const unique = [...new Set(Array.isArray(fields) ? fields.filter((f) => typeof f === "string") : [])];
  return unique
    .map((key) => ({ key, label: LABELS[key] ?? key, priority: PRIORITY.has(key) }))
    .sort((a, b) => Number(b.priority) - Number(a.priority));
};
