// features/admin/listings/listingFilters.js
// The admin listings filters: their options and starting values. One copy,
// used by the filter bar (AdminFilters) and by AdminListings, which also
// checks filters read from the URL against these lists so a stale or edited
// link can't make every request fail.
import { LISTED_BY } from "../../../constants/roles";
import { LISTING_STATUS_LABELS, isListingStatus } from "../listingStatus";

export const DEFAULT_LISTING_FILTERS = Object.freeze({
  search:       "",
  propertyType: "",
  status:       "pending",
  listedBy:     "",
  city:         "",
  locality:     null,
  imageFilter:  "",
  sortBy:       "latest",
});

// Keep in sync with the types the backend accepts (adminController VALID_TYPES).
export const PROPERTY_TYPES = [
  "Flats/Apartments",
  "Villa",
  "Plot",
  "Shop/Showroom",
  "Industrial Warehouse/Godown",
  "Industrial Building",
  "Office Space",
  "Commercial Land",
];

export const STATUS_OPTIONS = Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export const POSTED_BY_OPTIONS = [
  { value: LISTED_BY.OWNER,     label: "Owner" },
  { value: LISTED_BY.AGENT,     label: "Agent" },
  { value: LISTED_BY.DEVELOPER, label: "Developer" },
];

export const IMAGE_OPTIONS = [
  { value: "withImages",    label: "Has images" },
  { value: "withoutImages", label: "No images" },
  { value: "coverOnly",     label: "Cover only" },
  { value: "galleryOnly",   label: "Gallery only" },
];

export const SORT_OPTIONS = [
  { value: "latest",    label: "Latest first" },
  { value: "oldest",    label: "Oldest first" },
  { value: "priceHigh", label: "Price: high → low" },
  { value: "priceLow",  label: "Price: low → high" },
  { value: "mostViewed", label: "Most viewed" },
];

const oneOf = (value, options, fallback) =>
  options.some((o) => (o.value ?? o) === value) ? value : fallback;

// Filters from the URL. "status" uses "all" for "any status", since an empty
// value can't round-trip (missing means the default, "pending").
export function readFiltersFromParams(params) {
  const D = DEFAULT_LISTING_FILTERS;
  const rawStatus = params.get("status");
  return {
    search:       params.get("search") || D.search,
    propertyType: oneOf(params.get("propertyType"), PROPERTY_TYPES, D.propertyType),
    status:       rawStatus === "all" ? "" : (isListingStatus(rawStatus) ? rawStatus : D.status),
    listedBy:     oneOf(params.get("listedBy"), POSTED_BY_OPTIONS, D.listedBy),
    city:         params.get("city") || D.city,
    locality:     params.get("locality") || D.locality,
    imageFilter:  oneOf(params.get("imageFilter"), IMAGE_OPTIONS, D.imageFilter),
    sortBy:       oneOf(params.get("sortBy"), SORT_OPTIONS, D.sortBy),
  };
}
