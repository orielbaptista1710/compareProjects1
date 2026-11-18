// Listing field rules shared by the listing form and the API (FORM-04).
//
// This file is kept IDENTICAL in backend/constants/listingRules.js and
// frontend-vite/src/constants/listingRules.js. The frontend's form schema
// (propertySchema.js) and the backend's validator (propertyInputValidator.js)
// both read it, and backend/fakeTests/listingRules.test.js fails if the two
// copies drift. Change both together.
import { LISTED_BY } from "./roles.js";

// Longest allowed text, in characters.
export const TEXT_LIMITS = Object.freeze({
  developerName: 100,
  title: 200,
  description: 500,
  long_description: 5000,
  projectName: 150,
  state: 100,
  city: 100,
  locality: 100,
  sub_locality: 100,
  address: 300,
  wing: 10,
  tower: 10,
  phase: 20,
  reraNumber: 100,
});

// Shortest allowed text, in characters. Only checked when the field is
// required for the poster (REQUIRED_FIELDS), so an owner never sees a
// developer-name rule.
export const TEXT_MINIMUMS = Object.freeze({
  developerName: 2,
  description: 20,
  address: 5,
});

export const PINCODE_PATTERN = /^\d{6}$/;

// A unit's floor is stored as a whole number: 0 is the ground floor, -1 the
// first basement (B1), down to B5 (FORM-18). It can't be above totalFloors.
export const FLOOR_RANGE = Object.freeze({ lowest: -5, highest: 200 });

// A map pin must fall inside this box around India (FORM-10). Both the form
// and the API check it; a pin in the sea off the coast still passes, which is
// fine for catching pins dropped on the wrong country.
export const INDIA_BOUNDS = Object.freeze({ south: 6.5, north: 37.6, west: 68, east: 97.5 });

// Price and EMI are whole rupees (FORM-06). ₹1 lakh to ₹1,000 crore catches a
// missing or extra zero without refusing large land deals.
export const PRICE_RANGE = Object.freeze({ lowest: 100000, highest: 10000000000 });
export const EMI_RANGE = Object.freeze({ lowest: 1, highest: 10000000 });

// Square feet in one of each area unit (FORM-07). Whatever the unit, an area
// must come to between 10 sq ft and 1 crore sq ft.
export const SQFT_PER_UNIT = Object.freeze({ sqft: 1, sqmts: 10.764, guntas: 1089, acres: 43560, hectares: 107639 });
export const AREA_SQFT_RANGE = Object.freeze({ lowest: 10, highest: 10000000 });
// What the area measures. Optional: imported listings don't say.
export const AREA_TYPES = Object.freeze(["carpet", "built_up", "super_built_up", "plot"]);

// Most bedrooms, bathrooms or balconies a listing can have.
export const ROOM_COUNT_MAX = 20;

// Fields that don't apply to a property type (FORM-08): the form hides them
// and the API ignores them. A plot has no bedrooms or floors; a villa is the
// whole building, so it has no unit floor, tower or wing.
const LAND_SKIPS = Object.freeze([
  "bhk", "bathrooms", "balconies", "furnishing", "ageOfProperty", "totalFloors", "floor", "tower", "wing",
]);
const INDUSTRIAL_SKIPS = Object.freeze(["bhk", "balconies", "furnishing"]);
const WORKSPACE_SKIPS = Object.freeze(["bhk", "balconies"]);
export const FIELDS_NOT_FOR_TYPE = Object.freeze({
  "Flats/Apartments": Object.freeze([]),
  Villa: Object.freeze(["floor", "tower", "wing"]),
  Plot: LAND_SKIPS,
  "Commercial Land": LAND_SKIPS,
  "Shop/Showroom": WORKSPACE_SKIPS,
  "Office Space": WORKSPACE_SKIPS,
  "Industrial Warehouse/Godown": INDUSTRIAL_SKIPS,
  "Industrial Building": INDUSTRIAL_SKIPS,
});

// Homes must say how they're furnished; for shops and offices it's optional.
export const FURNISHING_REQUIRED_TYPES = Object.freeze(["Flats/Apartments", "Villa"]);

// Fields every listing must have, whoever posts it. Furnishing depends on the
// type (FURNISHING_REQUIRED_TYPES).
const COMMON_REQUIRED = Object.freeze([
  "propertyType",
  "description",
  "state",
  "city",
  "locality",
  "address",
  "pincode",
  "price",
]);

// What each poster must fill in. Owners have no possession/RERA or building
// section; agents have possession but no developer or units fields.
export const REQUIRED_FIELDS = Object.freeze({
  [LISTED_BY.DEVELOPER]: Object.freeze([...COMMON_REQUIRED, "developerName", "possessionStatus", "unitsAvailable"]),
  [LISTED_BY.AGENT]: Object.freeze([...COMMON_REQUIRED, "possessionStatus"]),
  [LISTED_BY.OWNER]: COMMON_REQUIRED,
});
