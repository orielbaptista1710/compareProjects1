//services/propertyAdminService.js

const Property = require("../models/Property");


/**
 * Fetch paginated properties for Admin Dashboard
 * - Safe pagination
 * - Composable filters (search + image filters work together)
 * - Predictable sorting
 * - Lean projection for performance
 */
exports.fetchProperties = async ({
  page = 1,
  limit = 20,
  status,
  propertyType,
  city,
  locality,
  search,
  sortBy = "latest",
  imageFilter,
}) => {

  /* --------------------------------------------------
   * 1. SANITIZE & PROTECT PAGINATION
   * -------------------------------------------------- */
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Number(limit) || 20); // prevent abuse
  const skip = (page - 1) * limit;

  /* --------------------------------------------------
   * 2. BASE FILTER (simple equality filters)
   * -------------------------------------------------- */
  const filter = {};
  const andConditions = []; // used to safely combine $or conditions

  if (status) filter.status = status;
  if (city) filter.city = city;
  if (locality) filter.locality = locality;
  if (propertyType) filter.propertyType = propertyType;

  /* --------------------------------------------------
   * 3. SEARCH FILTER (case-insensitive, safe length)
   * -------------------------------------------------- */
  if (search && search.length <= 50) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { developerName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { long_description: { $regex: search, $options: "i" } },
      ],
    });
  }


  /* --------------------------------------------------
   * 4. IMAGE FILTERS (robust + null-safe)
   * -------------------------------------------------- */
  if (imageFilter === "withImages") {
    // Has either cover image OR gallery images
    andConditions.push({
      $or: [
        { "coverImage.url": { $exists: true, $ne: "" } },
        { galleryImages: { $exists: true, $not: { $size: 0 } } },
      ],
    });
  }

  if (imageFilter === "withoutImages") {
    // No cover image AND no gallery images
    andConditions.push({
      $and: [
        { "coverImage.url": { $in: [null, "", undefined] } },
        {
          $or: [
            { galleryImages: { $exists: false } },
            { galleryImages: { $size: 0 } },
          ],
        },
      ],
    });
  }

  if (imageFilter === "coverOnly") {
    andConditions.push({
      $and: [
        { "coverImage.url": { $exists: true, $ne: "" } },
        {
          $or: [
            { galleryImages: { $exists: false } },
            { galleryImages: { $size: 0 } },
          ],
        },
      ],
    });
  }

  if (imageFilter === "galleryOnly") {
    andConditions.push({
      $and: [
        { galleryImages: { $exists: true, $not: { $size: 0 } } },
        { "coverImage.url": { $in: [null, "", undefined] } },
      ],
    });
  }

  // Attach AND conditions only if they exist
  if (andConditions.length) {
    filter.$and = andConditions;
  }

  /* --------------------------------------------------
   * 5. SORTING (explicit & predictable)
   * -------------------------------------------------- */
  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceHigh: { price: -1 },
    priceLow: { price: 1 },
    mostViewed: { views: -1 },
  };

  const sort = sortMap[sortBy] || sortMap.latest;

  /* --------------------------------------------------
   * 6. ADMIN LIST PROJECTION (performance-first)
   * -------------------------------------------------- */
  const LIST_PROJECTION = {
    title: 1,
    developerName: 1,
    propertyType: 1,
    price: 1,
    state: 1,
    city: 1,
    locality: 1,
    status: 1,
    submittedAt: 1,
    reviewedAt: 1,
    reviewedBy: 1,
    "coverImage.url": 1,
    "coverImage.thumbnail": 1, //add galleryImages??
    userId: 1,
    views: 1,
    createdAt: 1,
  };

  /* --------------------------------------------------
   * 7. PARALLEL QUERY (count + data)
   * -------------------------------------------------- */
  const [total, properties] = await Promise.all([
    Property.countDocuments(filter),
    Property.find(filter)
      .select(LIST_PROJECTION)
      .populate("userId", "displayName")
      .populate("reviewedBy", "displayName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { data: properties, total };
};

/* --------------------------------------------------
 * Fetch full property details (Admin view)
 * -------------------------------------------------- */
exports.fetchPropertyById = async (id) => {
  const property = await Property.findById(id)
    .populate("userId", "displayName")  ////
    .populate("reviewedBy", "displayName")
    .lean();

  if (!property) {
    throw new Error("Property not found");
  }

  return property;
};

/* --------------------------------------------------
 * Update property status (approve / reject)
 * -------------------------------------------------- */
exports.updatePropertyStatus = async (
  id,
  status,  
  adminId,
  rejectionReason = null
) => {
  const allowedStatuses = ["approved", "rejected", "pending"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const update = {
    status,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  };

  if (status === "rejected") {
    update.rejectionReason = rejectionReason;
  }

  const property = await Property.findByIdAndUpdate(id, update, { new: true });

  if (!property) {
    throw new Error("Property not found");
  }

  return property;
};


  /* --------------------------------------------------
 * Fetch distinct cities (Admin)
 * -------------------------------------------------- */
exports.fetchCities = async () => {
  return await Property.distinct("city", {
    city: { $ne: null, $ne: "" }
  });
};

/* --------------------------------------------------
 * Fetch distinct localities by city (Admin)
 * -------------------------------------------------- */
exports.fetchLocalities = async ({ city, q = "" }) => {
  if (!city) return [];

  return await Property.distinct("locality", {
    city,
    locality: { $regex: q, $options: "i" }
  });
};
