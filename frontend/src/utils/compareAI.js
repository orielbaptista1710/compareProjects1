const clamp = (val, min = 0, max = 1) =>
  Math.max(min, Math.min(max, val));

const safeNormalize = (value, min, max) => {
  if (
    value == null ||
    min == null ||
    max == null ||
    min === max
  ) {
    return 0;
  }
  return clamp((value - min) / (max - min));
};

const getAreaInSqft = (area) => {
  if (!area?.value || area.value <= 0) return null;

  const unitMap = {
    sqft: 1,
    sqmts: 10.764,
    guntas: 1089,
    acres: 43560,
    hectares: 107639,
  };

  return area.value * (unitMap[area.unit] || 1);
};

// Centralized weights (future: backend-driven)
const WEIGHTS = {
  price: 0.25,
  area: 0.2,
  amenities: 0.15,
  possession: 0.15,
  rera: 0.15,
  popularity: 0.1,
};

export const scorePropertiesAI = (properties = []) => {
  if (!Array.isArray(properties) || properties.length < 2) {
    return [];
  }

  const prices = properties.map(p => p.price).filter(Number);
  const areas = properties.map(p => getAreaInSqft(p.area)).filter(Number);
  const popularity = properties
    .map(p => p?.metadata?.analytics?.popularityScore)
    .filter(Number);

  const stats = {
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    minArea: areas.length ? Math.min(...areas) : null,
    maxArea: areas.length ? Math.max(...areas) : null,
    minPop: popularity.length ? Math.min(...popularity) : null,
    maxPop: popularity.length ? Math.max(...popularity) : null,
  };

  return properties.map((p) => {
    let score = 0;
    const reasons = [];

    // 💰 Price
    if (typeof p.price === "number") {
      const s = 1 - safeNormalize(p.price, stats.minPrice, stats.maxPrice);
      score += s * WEIGHTS.price;
      if (s > 0.7) reasons.push("competitively priced");
    }

    // 📐 Area
    const areaSqft = getAreaInSqft(p.area);
    if (areaSqft) {
      const s = safeNormalize(areaSqft, stats.minArea, stats.maxArea);
      score += s * WEIGHTS.area;
      if (s > 0.7) reasons.push("larger usable area");
    }

    // 🏊 Amenities
    const amenityCount =
      (p.amenities?.length || 0) +
      (p.facilities?.length || 0) +
      (p.security?.length || 0);

    if (amenityCount > 0) {
      const s = clamp(amenityCount / 15);
      score += s * WEIGHTS.amenities;
      if (s > 0.6) reasons.push("strong amenities & facilities");
    }

    // 🕒 Possession
    if (p.possessionStatus === "Immediate") {
      score += WEIGHTS.possession;
      reasons.push("ready to move");
    } else if (p.reraDate) {
      score += WEIGHTS.possession * 0.3;
    }

    // 🧾 Trust
    if (p.reraApproved && p.reraNumber) {
      score += WEIGHTS.rera;
      reasons.push("RERA approved");
    }

    // 🔥 Popularity
    const pop = p?.metadata?.analytics?.popularityScore;
    if (typeof pop === "number") {
      const s = safeNormalize(pop, stats.minPop, stats.maxPop);
      score += s * WEIGHTS.popularity;
      if (s > 0.6) reasons.push("higher buyer interest");
    }

    return {
      ...p,
      aiScore: Number(score.toFixed(4)),
      aiReasons: reasons.slice(0, 3),
      _aiDebug: process.env.NODE_ENV === "development"
        ? { rawScore: score }
        : undefined,
    };
  });
};
