// Row definitions for the compare table. Each getter returns a display
// value, or null/"" when the property doesn't have it (rendered as "—").
// Rows where every property is empty are dropped by buildCompareModel.
import { formatCurrencyShort, formatIndianNumber, fmtArea, fmtDate } from "../../../utils/formatters";
import { getAreaInSqft } from "../../../utils/compareScoring";

export const getPricePerSqft = (p) => {
  const value = p.pricePerSqft ?? (p.price > 0 ? p.price / getAreaInSqft(p.area) : null);
  return Number.isFinite(value) && value > 0 ? `₹${formatIndianNumber(Math.round(value))}/sq ft` : null;
};

const emptyDash = (v) => (v === "—" ? null : v);

export const COMPARE_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    rows: [
      { id: "type", label: "Property Type", get: (p) => p.propertyType },
      { id: "group", label: "Category", get: (p) => p.propertyGroup },
      { id: "bhk", label: "BHK", get: (p) => (p.bhk ? `${p.bhk} BHK` : null) },
      { id: "possession", label: "Possession", get: (p) => p.possessionStatus },
      { id: "rera", label: "RERA Approved", get: (p) => (p.reraApproved ? "Yes" : "No") },
      { id: "reraNo", label: "RERA No.", get: (p) => (p.reraApproved ? p.reraNumber : null) },
    ],
  },
  {
    id: "price",
    title: "Price & Size",
    rows: [
      { id: "price", label: "Price", get: (p) => formatCurrencyShort(p.price) },
      { id: "ppsf", label: "Price / Sq.ft", get: getPricePerSqft },
      { id: "emi", label: "EMI Starts", get: (p) => (p.emiStarts > 0 ? `₹${formatIndianNumber(p.emiStarts)}` : null) },
      { id: "area", label: "Area", get: (p) => emptyDash(fmtArea(p.area)) },
    ],
  },
  {
    id: "location",
    title: "Location",
    rows: [
      { id: "locality", label: "Locality", get: (p) => p.locality },
      { id: "city", label: "City", get: (p) => p.city },
      { id: "state", label: "State", get: (p) => p.state },
      { id: "pincode", label: "Pincode", get: (p) => p.pincode },
      { id: "address", label: "Address", get: (p) => p.address },
      {
        id: "landmarks",
        label: "Landmarks",
        get: (p) => (p.landmarks ?? []).map((lm) => lm?.name).filter(Boolean).join(", "),
      },
      { id: "map", label: "Map", kind: "link", get: (p) => p.mapLink },
    ],
  },
  {
    id: "details",
    title: "Property Details",
    rows: [
      { id: "bathrooms", label: "Bathrooms", get: (p) => p.bathrooms },
      { id: "balconies", label: "Balconies", get: (p) => p.balconies },
      { id: "parkings", label: "Parkings", get: (p) => p.parkings },
      {
        id: "floor",
        label: "Floor",
        get: (p) => (p.floor != null ? (p.totalFloors ? `${p.floor} of ${p.totalFloors}` : p.floor) : null),
      },
      { id: "wing", label: "Wing / Tower", get: (p) => [p.wing, p.tower].filter(Boolean).join(" / ") },
      { id: "phase", label: "Phase", get: (p) => p.phase },
      { id: "furnishing", label: "Furnishing", get: (p) => p.furnishing },
      { id: "facing", label: "Facing", get: (p) => p.facing },
      { id: "age", label: "Age of Property", get: (p) => p.ageOfProperty },
      { id: "units", label: "Units Available", get: (p) => p.unitsAvailable },
      { id: "availableFrom", label: "Available From", get: (p) => emptyDash(fmtDate(p.reraDate)) },
    ],
  },
];
