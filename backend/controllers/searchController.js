// controllers/searchController.js
// Once you upgrade to M10, you can replace MongoDB regex + Fuse.js with Atlas Search easily.

//where is seachController used ? -it is 
const asyncHandler = require('express-async-handler');
const Fuse = require('fuse.js');  //can be used only for small databases
const Property = require('../models/Property');

// Utility: escape user input for regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Smart search controller- used in ExpandableSeachBar.js
const searchProperties = asyncHandler(async (req, res) => {
  const { query, limit = 5} = req.query;
  if (!query || query.trim().length < 2) return res.json({ properties: [], fuzzy: false });

  const q = query.toLowerCase();
  const filters = { status: 'approved' };

  // --- Property Type Detection ---
  const propertyTypes = ["Flats/Apartments", "Villa", "Plot", "Shop/Showroom", "Industrial Warehouse", "Retail", "Office Space"];
  const foundType = propertyTypes.find(type => q.includes(type.toLowerCase()));
  if (foundType) filters.propertyType = new RegExp(foundType, 'i');

  // --- Furnishing Detection ---
  const furnishingKeywords = ['Furnished', 'Semi Furnished', 'Unfurnished', 'Fully Furnished'];
  const foundFurnishing = furnishingKeywords.find(f => q.includes(f.toLowerCase()));
  if (foundFurnishing) filters.furnishing = { $in: [new RegExp(foundFurnishing, 'i')] };

  // --- BHK Detection ---
  const bhkMatch = q.match(/(\d+)\s*bhk/);
  if (bhkMatch) filters.bhk = new RegExp(`${bhkMatch[1]}\\s*bhk`, 'i');

  // --- RERA Detection ---
  if (q.includes('rera')) filters.reraApproved = true;

  // --- Price Detection (under / above / between) ---
  const priceUnderMatch = q.match(/under\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  const priceAboveMatch = q.match(/above\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);
  const priceBetweenMatch = q.match(/between\s*(\d+)\s*(lakh|lakhs|cr|crore)?\s*and\s*(\d+)\s*(lakh|lakhs|cr|crore)?/);

  function parsePrice(num, unit) {
    let price = parseInt(num, 10);
    if (unit) {
      if (unit.includes('lakh')) price *= 100000;
      if (unit.includes('cr') || unit.includes('crore')) price *= 10000000;
    }
    return price;
  }

  if (priceUnderMatch) filters.price = { $lte: parsePrice(priceUnderMatch[1], priceUnderMatch[2]) };
  if (priceAboveMatch) filters.price = { $gte: parsePrice(priceAboveMatch[1], priceAboveMatch[2]) };
  if (priceBetweenMatch) filters.price = {
    $gte: parsePrice(priceBetweenMatch[1], priceBetweenMatch[2]),
    $lte: parsePrice(priceBetweenMatch[3], priceBetweenMatch[4])
  };

  // --- Location Detection ---
  let locationSet = false;
  const locationMatch = q.match(/in ([a-zA-Z\s]+)/); // "in Andheri"
  if (locationMatch) {
    const loc = escapeRegex(locationMatch[1].trim());
    filters.$or = [
      { city: new RegExp(loc, 'i') },
      { locality: new RegExp(loc, 'i') },
      { state: new RegExp(loc, 'i') }
    ];
    locationSet = true;
  }

  // fallback: if no "in" keyword, take first word(s) as location
  if (!locationSet) {
    const words = q.split(' ');
    const loc = escapeRegex(words[0]);
    filters.$or = [
      { city: new RegExp(loc, 'i') },
      { locality: new RegExp(loc, 'i') },
      { state: new RegExp(loc, 'i') }
    ];
  }

  // --- Primary MongoDB Regex Search ---
  let properties = await Property.find(filters)
    .select('title locality city state price images propertyType bhk furnishing reraApproved')
    .limit(Number(limit))
    .lean();

  let fuzzy = false;

  // --- Fallback 1: MongoDB Text Search ---
  if (properties.length === 0) {
    properties = await Property.find(
      { $text: { $search: query }, status: 'approved' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .select('title locality city state price images propertyType bhk furnishing reraApproved')
      .limit(Number(limit))
      .lean();
    if (properties.length > 0) fuzzy = true;
  }

  // --- Fallback 2: Fuse.js (Typo-tolerant) ---
  if (properties.length === 0) {
    const allApproved = await Property.find({ status: 'approved' })
      .select('title locality city state price images propertyType bhk furnishing reraApproved')
      .lean();

    const fuse = new Fuse(allApproved, {
      keys: ['title', 'city', 'locality', 'description', 'long_description'],
      threshold: 0.35, // stricter matching
    });

    const fuzzyResults = fuse.search(query);
    properties = fuzzyResults.slice(0, Number(limit)).map(r => r.item);
    if (properties.length > 0) fuzzy = true;
  }

  // --- Send Response ---
  res.json({ properties, fuzzy });
});

module.exports = { searchProperties };



