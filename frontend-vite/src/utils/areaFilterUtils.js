const DEFAULT_BOUNDS = {
  sqft: { min: 0, max: 10_000, step: 50 },
  sqmts: { min: 0, max: 1_000, step: 5 },
  guntas: { min: 0, max: 100, step: 1 },
  hectares: { min: 0, max: 50, step: 0.5 },
  acres: { min: 0, max: 50, step: 0.5 },
};

const UNIT_ALIASES = {
  sqyard: "sqmts",
  "sq yard": "sqmts",
  sqmeter: "sqmts",
  sqmetre: "sqmts",
  "sq ft": "sqft",
  sqfeet: "sqft",
  acre: "acres",
  hectare: "hectares",
  gunta: "guntas",
};

export const resolveUnit = (raw) => {
  if (!raw) return "sqft";

  const lower = String(raw).trim().toLowerCase();

  if (DEFAULT_BOUNDS[lower]) {
    return lower;
  }

  return UNIT_ALIASES[lower] || "sqft";
};