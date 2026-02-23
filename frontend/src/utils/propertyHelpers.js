//utils/propertyHelpers.js

//image HELPER 
export const fallbackImg =
  "https://placehold.co/600x400/000000/FFFFFF/png";

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

// Location HELPER
export const getPropertyLocation = (property) => {
  if (!property) return "";

  const parts = [
    property.locality,
    property.city,
    property.state,
  ].filter(Boolean);

  return parts.join(", ");
};

