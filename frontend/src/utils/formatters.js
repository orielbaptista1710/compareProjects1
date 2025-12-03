// ----------------------
// PRICE FORMATTER
// ----------------------
export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return "—";
  
  try {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  } catch (e) {
    console.error("formatPrice error:", e);
    return "₹" + price;
  }
};

// ----------------------
// AREA FORMATTER
// ----------------------
export const formatArea = (area) => {
  if (!area || !area.value || isNaN(area.value)) return "—";
  
  const unit = area.unit || "sqft";
  return `${area.value} ${unit}`;
};

// ----------------------
// PRICE PER SQFT FORMATTER
// ----------------------
export const formatPricePerSqft = (pps) => {
  if (!pps || isNaN(pps)) return "—";

  try {
    return `₹${Number(pps).toLocaleString("en-IN")}`;
  } catch (e) {
    console.error("formatPricePerSqft error:", e);
    return "₹" + pps;
  }
};

// ----------------------
// DATE FORMATTER
// ----------------------
export const formatDate = (date) => {
  if (!date) return "—";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—"; // invalid date

    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (e) {
    console.error("formatDate error:", e);
    return "—";
  }
};

// ----------------------
// IMAGE FORMATTER
// ----------------------
export const getImage = (property) => {
  if (!property || typeof property !== "object") {
    return "https://placehold.co/600x400/000000/FFFFFF/png";
  }

  return (
    property?.coverImage?.url ||
    property?.coverImage?.thumbnail ||
    property?.galleryImages?.[0]?.url ||
    property?.galleryImages?.[0]?.thumbnail ||
    property?.mediaFiles?.find((m) => m.type === "image")?.src ||
    property?.virtualTours?.[0]?.thumbnail || 
    "https://placehold.co/600x400/000000/FFFFFF/png"
  );
};
