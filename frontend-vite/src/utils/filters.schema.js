// src/utils/filters.schema 
import { FILTER_LABELS } from "../assests/constants/propertyTypeConfig";

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

  return {
    city:             p.get('city')              ?? '',
    locality:         p.getAll('locality'),
    search:           p.get('search')            ?? '',
    propertyType:     p.getAll('propertyType'),
    area,
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