// features/admin/listings/listingFilters.js
// The admin listings filters: their options and starting values. One copy,
// used by the filter bar (AdminFilters) and by AdminListings, which also
// checks filters read from the URL against these lists so a stale or edited
// link can't make every request fail.
import { LISTED_BY, LISTING_STATUS } from "../../../constants/roles";
import { LISTING_STATUS_LABELS, isListingStatus } from "../listingStatus";

// The review queue (pending) is worked oldest-waiting-first; every other view
// is newest-first, since "waiting" means nothing for a listing already decided.
export const defaultSortFor = (status) => (status === LISTING_STATUS.PENDING ? "waiting" : "latest");

export const DEFAULT_LISTING_FILTERS = Object.freeze({
  search:       "",
  propertyType: "",
  status:       LISTING_STATUS.PENDING,
  listedBy:     "",
  city:         "",
  locality:     null,
  imageFilter:  "",
  sortBy:       defaultSortFor(LISTING_STATUS.PENDING),
});

// The same eight types as backend/models/propertyType.js (which is what the
// backend's admin filter accepts); a test checks it against the listing form's list.
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
  { value: "waiting",   label: "Oldest waiting first" },
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
  const status = rawStatus === "all" ? "" : (isListingStatus(rawStatus) ? rawStatus : D.status);
  return {
    search:       params.get("search") || D.search,
    propertyType: oneOf(params.get("propertyType"), PROPERTY_TYPES, D.propertyType),
    status,
    listedBy:     oneOf(params.get("listedBy"), POSTED_BY_OPTIONS, D.listedBy),
    city:         params.get("city") || D.city,
    locality:     params.get("locality") || D.locality,
    imageFilter:  oneOf(params.get("imageFilter"), IMAGE_OPTIONS, D.imageFilter),
    // Not in the URL means the default order for this status
    sortBy:       oneOf(params.get("sortBy"), SORT_OPTIONS, defaultSortFor(status)),
  };
}
