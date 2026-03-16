// controllers/discoverController.js
import Property from "../models/Property.js";

import {
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
} from "../models/propertyType.js";

const normalize = (str = "") =>
  str.toLowerCase().replace(/[-_/]/g, " ").trim();

const isResidential = (type) =>
  RESIDENTIAL_TYPES.some((t) =>
    normalize(type).includes(normalize(t))
  );

const isCommercial = (type) =>
  COMMERCIAL_TYPES.some((t) =>
    normalize(type).includes(normalize(t))
  );

const mapCategory = (type = "") => {
  const t = normalize(type);

  if (isResidential(t)) {
    if (t.includes("plot")) return "plot";
    return "residential";
  }

  if (t.includes("industrial")) return "industrial";

  if (t.includes("shop") || t.includes("showroom")) return "retail";

  if (isCommercial(t)) return "commercial";

  return "commercial";
};

export const getDiscover = async (req, res) => {
  try {

    const properties = await Property.find(
      {},
      { propertyType: 1, locality: 1 }
    ).lean();

    console.log("Properties fetched:", properties.length);

    const data = {
      residential: [],
      industrial: [],
      commercial: [],
      retail: [],
      plot: [],
      popular: [],
    };

    for (const prop of properties) {
      if (!prop.locality || !prop.propertyType) continue;

      const category = mapCategory(prop.propertyType);

      data[category].push(prop.locality);
    }

    for (const key in data) {
      data[key] = [...new Set(data[key])]
        .filter(Boolean)
        .sort()
        .slice(0, 100);
    }

    console.log("Footer discover data:", data);

    res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("discover error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};