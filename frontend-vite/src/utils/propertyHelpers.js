// src/utils/propertyHelpers.js

// IMAGE HELPERS
export const fallbackImg =
  "https://placehold.co/600x400/1f2937/FFFFFF?text=No+Image";

/**
 * Returns the best available image for a property.
 */
export const getPropertyImage = (property) => {
  if (!property) return fallbackImg;

  return (
    property.coverImage?.thumbnail ||
    property.galleryImages?.[0]?.thumbnail ||
    property.coverImage?.url ||
    property.galleryImages?.[0]?.url ||
    fallbackImg
  );
};


/**
 * Adds Cloudinary image transformations.
 *
 * Example:
 * getOptimizedImageUrl(url, {
 *   width: 600,
 *   height: 400,
 *   crop: "fill"
 * })
 */
export const getOptimizedImageUrl = (
  url,
  {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = {}
) => {
  if (!url) return fallbackImg;

  // Only transform Cloudinary image URLs
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  // Don't apply image transformations to raw files
  if (!url.includes("/image/upload/")) {
    return url;
  }

  const transformations = [
    format && `f_${format}`,
    quality && `q_${quality}`,
    width && `w_${width}`,
    height && `h_${height}`,
    crop && width && height && `c_${crop}`,
  ]
    .filter(Boolean)
    .join(",");

  if (!transformations) return url;

  return url.replace(
    "/image/upload/",
    `/image/upload/${transformations}/`
  );
};


/**
 * Gets a property image and applies Cloudinary optimization.
 */
export const getOptimizedPropertyImage = (
  property,
  options = {}
) => {
  const imageUrl = getPropertyImage(property);

  if (imageUrl === fallbackImg) {
    return fallbackImg;
  }

  return getOptimizedImageUrl(imageUrl, options);
};


// LOCATION HELPER
export const getPropertyLocation = (property) => {
  if (!property) return "";

  const parts = [
    property.locality,
    property.city,
    property.state,
  ].filter(Boolean);

  return parts.join(", ");
};


/**
 * Cloudinary raw-upload URLs need fl_attachment
 * to force a cross-origin download.
 */
export const getDownloadUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  return url.replace(
    "/raw/upload/",
    "/raw/upload/fl_attachment/"
  );
};