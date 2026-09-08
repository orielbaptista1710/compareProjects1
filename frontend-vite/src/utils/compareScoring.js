// frontend/src/utils/compareScoring.js

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const isValidNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const normalize = (value, min, max, fallback = 0.5) => {
  if (
    !isValidNumber(value) ||
    !isValidNumber(min) ||
    !isValidNumber(max)
  ) {
    return null;
  }

  // All compared values are equal.
  // This factor should be neutral rather than unfairly giving 0.
  if (min === max) {
    return fallback;
  }

  return clamp((value - min) / (max - min));
};

const getAreaInSqft = (area) => {
  if (!area || !isValidNumber(area.value) || area.value <= 0) {
    return null;
  }

  const unitMap = {
    sqft: 1,
    sqmts: 10.7639,
    guntas: 1089,
    acres: 43560,
    hectares: 107639,
  };

  const multiplier = unitMap[area.unit];

  if (!multiplier) {
    return null;
  }

  return area.value * multiplier;
};

const getAmenityCount = (property) => {
  const items = [
    ...(Array.isArray(property.amenities)
      ? property.amenities
      : []),

    ...(Array.isArray(property.facilities)
      ? property.facilities
      : []),

    ...(Array.isArray(property.security)
      ? property.security
      : []),
  ];

  return new Set(
    items
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase())
  ).size;
};

const getPossessionScore = (property) => {
  if (property.possessionStatus === "Ready to Move") {
    return 1;
  }

  if (property.possessionStatus === "Under Construction") {
    return 0.5;
  }

  return null;
};

const getReraScore = (property) => {
  if (property.reraApproved === true && property.reraNumber) {
    return 1;
  }

  if (property.reraApproved === true) {
    return 0.7;
  }

  return null;
};

export const COMPARE_WEIGHTS = {
  price: 0.25,
  area: 0.2,
  amenities: 0.15,
  possession: 0.15,
  rera: 0.15,
  popularity: 0.1,
};

const getScoreStats = (properties) => {
  const prices = properties
    .map((property) => property.price)
    .filter(isValidNumber);

  const areas = properties
    .map((property) => getAreaInSqft(property.area))
    .filter(isValidNumber);

  const popularity = properties
    .map((property) => property?.metadata?.analytics?.popularityScore)
    .filter(isValidNumber);

  return {
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,

    minArea: areas.length ? Math.min(...areas) : null,
    maxArea: areas.length ? Math.max(...areas) : null,

    minPopularity: popularity.length
      ? Math.min(...popularity)
      : null,

    maxPopularity: popularity.length
      ? Math.max(...popularity)
      : null,
  };
};

/**
 * Scores properties relative to the other properties
 * currently being compared.
 *
 * This is a deterministic comparison scoring system,
 * not an AI or machine-learning model.
 */
export const scoreProperties = (
  properties = [],
  weights = COMPARE_WEIGHTS
) => {
  if (!Array.isArray(properties) || properties.length < 2) {
    return [];
  }

  const stats = getScoreStats(properties);

  return properties.map((property) => {
    let weightedScore = 0;
    let appliedWeight = 0;

    const reasons = [];

    const addSignal = (score, weight, reason) => {
      if (!isValidNumber(score)) return;

      weightedScore += score * weight;
      appliedWeight += weight;

      if (reason) {
        reasons.push(reason);
      }
    };

    // Price
    const priceScore = normalize(
      property.price,
      stats.minPrice,
      stats.maxPrice
    );

    if (priceScore !== null) {
      addSignal(
        1 - priceScore,
        weights.price,
        priceScore <= 0.3 ? "more competitively priced" : null
      );
    }

    // Area
    const areaSqft = getAreaInSqft(property.area);

    const areaScore = normalize(
      areaSqft,
      stats.minArea,
      stats.maxArea
    );

    if (areaScore !== null) {
      addSignal(
        areaScore,
        weights.area,
        areaScore >= 0.7 ? "larger property area" : null
      );
    }

    // Amenities
    const amenityCount = getAmenityCount(property);

    if (amenityCount > 0) {
      const amenityScore = clamp(amenityCount / 15);

      addSignal(
        amenityScore,
        weights.amenities,
        amenityScore >= 0.6
          ? "strong amenities and facilities"
          : null
      );
    }

    // Possession
    const possessionScore = getPossessionScore(property);

    if (possessionScore !== null) {
      addSignal(
        possessionScore,
        weights.possession,
        possessionScore === 1
          ? "ready to move"
          : null
      );
    }

    // RERA / trust
    const reraScore = getReraScore(property);

    if (reraScore !== null) {
      addSignal(
        reraScore,
        weights.rera,
        reraScore === 1
          ? "RERA approval available"
          : null
      );
    }

    // Popularity
    const popularityScore = normalize(
      property?.metadata?.analytics?.popularityScore,
      stats.minPopularity,
      stats.maxPopularity
    );

    if (popularityScore !== null) {
      addSignal(
        popularityScore,
        weights.popularity,
        popularityScore >= 0.7
          ? "higher buyer interest"
          : null
      );
    }

    // Don't punish a property simply because some fields are missing.
    const finalScore =
      appliedWeight > 0
        ? weightedScore / appliedWeight
        : 0;

    return {
      ...property,

      comparisonScore: Number(finalScore.toFixed(4)),

      comparisonReasons: reasons
        .filter(Boolean)
        .slice(0, 3),

      comparisonData: {
        signalsUsed: appliedWeight,
      },

      ...(import.meta.env.DEV
        ? {
            _comparisonDebug: {
              rawScore: weightedScore,
              appliedWeight,
              normalizedScore: finalScore,
            },
          }
        : {}),
    };
  });
};