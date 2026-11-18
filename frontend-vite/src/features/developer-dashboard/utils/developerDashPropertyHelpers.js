//pages/DeveloperDashboard/utils/developerDashPropertyHelpers.js
import { floorText } from "../../listings/floor";

export const REQUIRED_FIELDS = [
  "developerName",
  "title",
  "description",
  "state",
  "city",
  "locality", 
  "address",
  "pincode",
  "propertyType",
  // furnishing: required for flats and villas only, checked by propertySchema.js (FORM-08)
  "possessionStatus",
  "price",
  "unitsAvailable",
];
 
// Baseline empty form — must match defaultPropertyValues in propertySchema.js
// area uses nested object shape: { value: "", unit: "sqft" }
// "" value means "not filled in" — Zod treats it as undefined via preprocess
export const initialFormData = {
  developerName:    "",
  title:            "",
  description:      "",
  long_description: "",
  projectName:      "",
  state:            "",
  city:             "",
  locality:         "",
  address:          "",
  pincode:          "",
  // Nested area shape — matches Mongoose schema and propertySchema.js
  area:             { value: "", unit: "sqft", type: "" },
  reraApproved:     false,
  reraNumber:       "",
  reraDate:         null,
  priceNegotiable:  false,
  price:            "",
  emiStarts:        "",
  propertyType:     "",
  furnishing:       "",
  possessionStatus: "",
  bhk:              "",
  bathrooms:        "",
  balconies:        "",
  facing:           "",
  parkings:         [],
  ageOfProperty:    "New",
  totalFloors:      "",
  floor:            "",
  wing:             "",
  phase:            "",
  tower:            "",
  unitsAvailable:   "",
  amenities:        [],
  facilities:       [],
  security:         [],
  // Media — kept for future MediaSection
  coverImage:      "",
  galleryImages:   [],
  floorplanImages: [],
  mediaFiles:      [],
};
 
// Normalises a property document from the API into the shape the form expects.
// Used in Dashboard.handleEdit() to pre-fill the form for editing.
export const normalizePropertyData = (property = {}) => ({
  ...initialFormData,
  ...property,
 
  // Normalise area to nested shape regardless of what the DB returns
  // Handles both: { area: { value: 1200, unit: "sqft" } } (correct)
  //          and: { areaValue: 1200, areaUnit: "sqft" }     (legacy flat)
  area: property.area?.value != null
    ? { value: property.area.value, unit: property.area.unit || "sqft", type: property.area.type || "" }
    : property.areaValue != null
    ? { value: property.areaValue, unit: property.areaUnit || "sqft", type: "" }
    : { value: "", unit: "sqft", type: "" },
 
  // Parkings: Mongoose stores as String, form expects Array
  // "Open Parking, Covered Parking" → ["Open Parking", "Covered Parking"]
  parkings: Array.isArray(property.parkings)
    ? property.parkings
    : property.parkings
    ? property.parkings.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
 
  // Floor as the text input shows it: 0 → "Ground", -1 → "B1"
  floor: property.floor != null ? String(floorText(property.floor)) : "",
 
  // Ensure media arrays exist
  galleryImages:   property.galleryImages   || [],
  floorplanImages: property.floorplanImages || [],
  mediaFiles:      property.mediaFiles      || [],
  amenities:       property.amenities       || [],
  facilities:      property.facilities      || [],
  security:        property.security        || [],
 
  // Ensure booleans
  reraApproved:    !!property.reraApproved,
  priceNegotiable: !!property.priceNegotiable,
 
  // reraDate: keep null if not set, otherwise keep the value
  reraDate: property.reraDate || null,
 
  // emiStarts: 0 from DB → "" in form so input looks empty, not "0"
  emiStarts: property.emiStarts || "",
});
 