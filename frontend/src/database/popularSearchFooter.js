// POPULAR_SEARCHES — all params match Property.js schema fields and propertyType.js enums exactly
//
// Schema fields used:
//   city          → String  (e.g. "Mumbai", "Thane", "Navi Mumbai")
//   locality      → String  (e.g. "Andheri", "Panvel", "Kharghar")
//   propertyType  → enum from RESIDENTIAL_TYPES + COMMERCIAL_TYPES
//   bhk           → Number  (1, 2, 3 ...)
//   possessionStatus → String (derived from reraDate — "Immediate" | "Under Construction")
//   price         → Number  (used as maxPrice on the frontend filter)
//   tierType      → enum: "tier1" | "tier2"
//
// NOTE: propertyType values with "/" must be encoded → %2F
//       "Flats/Apartments"              → Flats%2FApartments
//       "Shop/Showroom"                 → Shop%2FShowroom
//       "Industrial Warehouse/Godown"   → Industrial+Warehouse%2FGodown

export const POPULAR_SEARCHES = [
  // ── Mumbai — Residential ─────────────────────────────────────────────────
  {
    label: "2 BHK Flats in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&bhk=2&city=Mumbai",
  },
  {
    label: "3 BHK Flats in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&bhk=3&city=Mumbai",
  },
  {
    label: "Premium Apartments in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&tierType=tier1&city=Mumbai",
  },
  {
    label: "Ready to Move Flats in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&possessionStatus=Immediate&city=Mumbai",
  },
  {
    label: "Under Construction Flats in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&possessionStatus=Under+Construction&city=Mumbai",
  },

  // ── Thane — Residential ───────────────────────────────────────────────────
  {
    label: "2 BHK Flats in Thane",
    href:  "/properties?propertyType=Flats%2FApartments&bhk=2&city=Thane",
  },
  {
    label: "3 BHK Flats in Thane",
    href:  "/properties?propertyType=Flats%2FApartments&bhk=3&city=Thane",
  },
  {
    label: "Under Construction in Thane",
    href:  "/properties?possessionStatus=Under+Construction&city=Thane",
  },

  // ── Navi Mumbai — Residential ─────────────────────────────────────────────
  {
    label: "2 BHK Flats in Navi Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&bhk=2&city=Navi+Mumbai",
  },
  {
    label: "Premium Apartments in Navi Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&tierType=tier1&city=Navi+Mumbai",
  },
  {
    label: "Plots in Navi Mumbai",
    href:  "/properties?propertyType=Plot&city=Navi+Mumbai",
  },

  // ── Localities ────────────────────────────────────────────────────────────
  {
    label: "Office Spaces in Andheri",
    href:  "/properties?propertyType=Office+Space&locality=Andheri",
  },
  {
    label: "Flats in Mira Road",
    href:  "/properties?propertyType=Flats%2FApartments&locality=Mira+Road",
  },
  {
    label: "Flats in Panvel",
    href:  "/properties?propertyType=Flats%2FApartments&locality=Panvel",
  },
  {
    label: "Plots in Panvel",
    href:  "/properties?propertyType=Plot&locality=Panvel",
  },
  {
    label: "Properties in Kharghar",
    href:  "/properties?locality=Kharghar",
  },
  {
    label: "Properties in Ulwe",
    href:  "/properties?locality=Ulwe",
  },
  {
    label: "Properties in Dombivli",
    href:  "/properties?locality=Dombivli",
  },
  {
    label: "Properties in Kalyan",
    href:  "/properties?locality=Kalyan",
  },
  {
    label: "Properties in Badlapur",
    href:  "/properties?locality=Badlapur",
  },

  // ── Commercial ────────────────────────────────────────────────────────────
  {
    label: "Shops & Showrooms in Mumbai",
    href:  "/properties?propertyType=Shop%2FShowroom&city=Mumbai",
  },
  {
    label: "Shops & Showrooms in Thane",
    href:  "/properties?propertyType=Shop%2FShowroom&city=Thane",
  },
  {
    label: "Office Spaces in Mumbai",
    href:  "/properties?propertyType=Office+Space&city=Mumbai",
  },
  {
    label: "Warehouses in Bhiwandi",
    href:  "/properties?propertyType=Industrial+Warehouse%2FGodown&locality=Bhiwandi",
  },
  {
    label: "Industrial Buildings in Taloja",
    href:  "/properties?propertyType=Industrial+Building&locality=Taloja",
  },
  {
    label: "Commercial Land in Mumbai",
    href:  "/properties?propertyType=Commercial+Land&city=Mumbai",
  },

  // ── Villas ────────────────────────────────────────────────────────────────
  {
    label: "Villas in Mumbai",
    href:  "/properties?propertyType=Villa&city=Mumbai",
  },
  {
    label: "Villas in Navi Mumbai",
    href:  "/properties?propertyType=Villa&city=Navi+Mumbai",
  },

  // ── Budget / price filters ────────────────────────────────────────────────
  {
    label: "Flats Under ₹50L in Thane",
    href:  "/properties?propertyType=Flats%2FApartments&maxPrice=5000000&city=Thane",
  },
  {
    label: "Flats Under ₹1Cr in Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&maxPrice=10000000&city=Mumbai",
  },
  {
    label: "Budget Homes in Navi Mumbai",
    href:  "/properties?propertyType=Flats%2FApartments&tierType=tier2&city=Navi+Mumbai",
  },
];