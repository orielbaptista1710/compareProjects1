export const getFilterSummary = (filters) => {
  const parts = [];

  if (filters.bhk?.length) {
    parts.push(
      filters.bhk.length === 1
        ? `${filters.bhk[0]} BHK`
        : `${filters.bhk.join(" & ")} BHK`
    );
  }

  if (filters.propertyType?.length) {
    parts.push(
      filters.propertyType.length === 1
        ? filters.propertyType[0]
        : `${filters.propertyType.length} Property Types`
    );
  }

  if (filters.furnishing?.length) {
    parts.push(
      filters.furnishing.length === 1
        ? filters.furnishing[0]
        : "Multiple Furnishings"
    );
  }

  return parts.slice(0, 2).join(" • "); // limit noise
};
