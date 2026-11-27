// sections/mapsBudget.js
// Courtesy limits on the billable Google Maps calls one browser tab can make
// from the listing form. Every map shown and every address search picked is
// billed, and the form's accordion re-creates the map each time the Location
// card is reopened.
//
// This is NOT the security boundary: a script can ignore it. The real ceiling
// is the key's referrer/API restrictions and the daily quota set in Google
// Cloud Console (see docs). This only stops an honest user (or a stuck
// loop in our own code) from running up the bill, without getting in the way
// of normal use. Each form opened starts a fresh allowance (SellPropertyForm
// calls resetMapsBudget), so posting several listings in one visit is fine.
// When the allowance is used up the State/City/Locality fields still work.

export const MAX_MAP_LOADS = 6; // times the map is shown per form opened
export const MAX_PLACE_PICKS = 10; // address searches completed per form opened

let mapLoads = 0;
let placePicks = 0;

/** Counts one map being shown. @returns {boolean} false once the limit is used up */
export const takeMapLoad = () => {
  if (mapLoads >= MAX_MAP_LOADS) return false;
  mapLoads += 1;
  return true;
};

/** Counts one completed address search. @returns {number} searches left */
export const spendPlacePick = () => {
  placePicks = Math.min(MAX_PLACE_PICKS, placePicks + 1);
  return MAX_PLACE_PICKS - placePicks;
};

export const placePicksLeft = () => MAX_PLACE_PICKS - placePicks;

/** Start a fresh allowance (a new form was opened). */
export const resetMapsBudget = () => {
  mapLoads = 0;
  placePicks = 0;
};
