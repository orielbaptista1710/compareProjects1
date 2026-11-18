// features/listings/listingTitle.js
// The listing title is written for the poster, not by them, so every card
// reads the same way: "3 BHK Flat in Palava City, Dombivli". It follows the
// card heading ("2, 3 BHK Flats in <project>").

const TITLE_MAX = 150; // same limit the form used for a typed title

// Singular nouns for the stored property types
const TYPE_NOUNS = {
  "Flats/Apartments": "Flat",
  Villa: "Villa",
  Plot: "Plot",
  "Shop/Showroom": "Shop",
  "Office Space": "Office Space",
  "Industrial Warehouse/Godown": "Warehouse",
  "Industrial Building": "Industrial Building",
  "Commercial Land": "Commercial Land",
};

// Only homes are described by bedroom count
const BHK_TYPES = new Set(["Flats/Apartments", "Villa"]);

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * "<n> BHK <type> in <project or locality>, <locality or city>".
 * Returns "" until a property type is chosen.
 * @param {object} values form values or a saved listing
 */
export const buildListingTitle = (values = {}) => {
  const type = clean(values.propertyType);
  if (!type) return "";

  const bhk = BHK_TYPES.has(type) ? parseInt(values.bhk, 10) : NaN; // "5+" → 5
  const what = [bhk > 0 ? `${bhk} BHK` : "", TYPE_NOUNS[type] || type].filter(Boolean).join(" ");

  const project = clean(values.projectName);
  const locality = clean(values.locality);
  const city = clean(values.city);
  // Project first when there is one; never repeat a name ("Dombivli, Dombivli")
  const where = [project, locality, city]
    .filter((part, i, all) => part && all.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === i)
    .slice(0, 2)
    .join(", ");

  return (where ? `${what} in ${where}` : what).slice(0, TITLE_MAX).trim();
};

/**
 * The title to save. A listing whose saved title was written by hand (older
 * listings, imported ones) keeps it; a generated title follows the details.
 * @param {object} values current form values
 * @param {object} [saved] the listing as last saved (empty for a new one)
 */
export const listingTitleFor = (values, saved = {}) => {
  const savedTitle = clean(saved.title);
  if (savedTitle && savedTitle !== buildListingTitle(saved)) return savedTitle;
  return buildListingTitle(values) || savedTitle;
};
