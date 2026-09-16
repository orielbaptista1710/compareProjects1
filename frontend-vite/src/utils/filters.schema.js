// src/utils/filters.schema
import { FILTER_LABELS } from "../assests/constants/propertyTypeConfig";
// Reuse the shared ₹ formatter (already used elsewhere for price display) instead of
// duplicating lakh/crore formatting logic here
import { formatCurrencyShort } from "./formatters";
 
/* ================================
   Default filter state
   — single source of truth shared by
     parseFiltersFromURL and FilterPanel
================================ */
export const DEFAULT_FILTERS = {
  city:             "", 
  locality:         [],
  search:           "",
  area:             null,
  budget:           null, // { min, max } in rupees — mirrors `area`'s shape, see below
  bhk:              [],
  propertyType:     [],
  furnishing:       [], 
  facing:           [],
  parkings:         [],
  amenities:        [],   
  floorLabel:       [],
  possessionStatus: [],   
};

export const parseFiltersFromURL = (search) => {
  const p = new URLSearchParams(search);

  const areaMin  = p.get('areaMin');
  const areaMax  = p.get('areaMax');
  const areaUnit = p.get('areaUnit') ?? 'sqft';

  const area =
    areaMin != null || areaMax != null
      ? {
          min:  areaMin  != null ? Number(areaMin)  : 0,
          max:  areaMax  != null ? Number(areaMax)  : 10_000,
          unit: areaUnit,
        }
      : null;

  // Budget: same {min,max} shape as area, but reads priceMin/priceMax (the param names the
  // backend's GET /api/properties already expects) and keeps null bounds as null — BudgetFilter
  // treats a null min/max as "no minimum"/"no maximum", so there's no ceiling to default to.
  const priceMin = p.get('priceMin');
  const priceMax = p.get('priceMax');
  const budget =
    priceMin != null || priceMax != null
      ? {
          min: priceMin != null ? Number(priceMin) : null,
          max: priceMax != null ? Number(priceMax) : null,
        }
      : null;

  return {
    city:             p.get('city')              ?? '',
    locality:         p.getAll('locality'),
    search:           p.get('search')            ?? '',
    propertyType:     p.getAll('propertyType'),
    area,
    budget,
    bhk:              p.getAll('bhk'),
    furnishing:       p.getAll('furnishing'),
    facing:           p.getAll('facing'),
    parkings:         p.getAll('parkings'),
    possessionStatus: p.getAll('possessionStatus'),
    floorLabel:       p.getAll('floorLabel'),
    amenities:        p.getAll('amenities'),
  };
};

/* ================================
   formatFilterValue
   — used by active-filter chips
================================ */

const AREA_UNIT_SHORT = {
  sqft:     "sqft",
  sqmts:    "sqm",
  guntas:   "guntas",
  hectares: "ha",
  acres:    "acres",
};

export const formatFilterValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "";

  // Area is an object { min, max, unit } — handled specially
  if (key === "area" && typeof value === "object") {
    const { min, max, unit } = value;
    const u = AREA_UNIT_SHORT[unit] ?? unit ?? "sqft";
    const fmtNum = (n) =>
      n >= 1000 && unit === "sqft"
        ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
        : String(n);

    // "Any" when max hits the ceiling (10 000 for sqft etc.)
    const isMaxed = max >= 10_000 && unit === "sqft";
    if (isMaxed) return `${fmtNum(min)}+ ${u}`;
    return `${fmtNum(min)}–${fmtNum(max)} ${u}`;
  }

  // Budget is an object { min, max } — handled specially, same as area above.
  // min/max are null when that bound is unset (BudgetFilter's "Min"/"Max" ladder ends).
  if (key === "budget" && typeof value === "object") {
    const { min, max } = value;
    if (min == null && max == null) return "";
    if (min == null) return `Up to ${formatCurrencyShort(max)}`;
    if (max == null) return `${formatCurrencyShort(min)}+`;
    return `${formatCurrencyShort(min)} – ${formatCurrencyShort(max)}`;
  }

  const stringValue = String(value).trim();

  switch (key) {
    case "bhk":
      return `${stringValue} BHK`;

    case "propertyType":
      return FILTER_LABELS.propertyType?.[stringValue] ?? stringValue;

    case "facing":
      return (
        stringValue.charAt(0).toUpperCase() +
        stringValue.slice(1) +
        " Facing"
      );

    default:
      return stringValue;
  }
};