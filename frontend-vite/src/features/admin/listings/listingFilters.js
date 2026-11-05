// features/admin/listings/listingFilters.js
// The admin listings filters' starting values — one copy, used by the
// listings page (URL sync, reset) and the filter bar.
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
