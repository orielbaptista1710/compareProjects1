// backend/utils/propertyCache.js
import { clearCache } from "./withCache.js";
import { searchCache } from "../services/searchService.js";

// Call after any change to which properties are public (approve, reject, edit,
// delete) so search, location autocomplete and footer localities don't serve
// stale results until their TTLs expire.
export const invalidatePropertyCaches = () => {
  clearCache();
  searchCache.flushAll();
};
