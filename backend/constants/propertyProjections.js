// backend/constants/propertyProjections.js
//
// Allowlists of Property fields that public (anonymous) endpoints may return.
// Anything not listed here stays on the server: owner/broker contact details,
// userId, sourceUrl, dataSource, moderation/marketing metadata, review fields.
// A new field added to models/Property.js is private until it's added here.

// GET /api/properties — listing cards. Also feeds the guest compare tray, which
// stores these list objects, so it must cover what the /compare tabs and
// frontend compareScoring.js read.
export const PUBLIC_LIST_FIELDS = [
  'title slug developerName featured description createdAt',
  'coverImage galleryImages',
  'price emiStarts priceNegotiable propertyType propertyGroup bhk area',
  'possessionStatus reraApproved reraNumber reraDate',
  'amenities facilities security',
  'bathrooms balconies parkings floor totalFloors floorLabel wing tower phase',
  'furnishing facing ageOfProperty unitsAvailable',
  'state city locality pincode address landmarks mapLink coordinates',
  'metadata.analytics.popularityScore',
].join(' ');

// GET /api/properties/:id — the property page.
export const PUBLIC_DETAIL_FIELDS = [
  PUBLIC_LIST_FIELDS,
  'long_description sub_locality projectName listingType listedBy subType',
  'developerAvatar floorPlans mediaFiles virtualTours brochure reraQR',
].join(' ');

