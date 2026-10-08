// controllers/discoverController.js
import Property from "../models/Property.js";
import { withCache } from "../utils/withCache.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";
import {
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
} from "../models/propertyType.js";

const DISCOVER_CACHE_KEY = "discover:localities";

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

const buildDiscoverData = async () => {
  // Atlas returns one row per unique locality + type pair instead of every listing.
  const pairs = await Property.aggregate([
    {
      $match: {
        status: "approved",
        locality: { $nin: [null, ""] },
        propertyType: { $nin: [null, ""] },
      },
    },
    { $group: { _id: { locality: "$locality", propertyType: "$propertyType" } } },
  ]);

  const data = {
    residential: [],
    industrial: [],
    commercial: [],
    retail: [],
    plot: [],
  };

  for (const { _id } of pairs) {
    data[mapCategory(_id.propertyType)].push(_id.locality);
  }

  for (const key in data) {
    data[key] = [...new Set(data[key])]
      .filter(Boolean)
      .sort()
      .slice(0, 100);
  }

  return data;
};

export const getDiscover = async (req, res) => {
  try {
    const data = await withCache(DISCOVER_CACHE_KEY, buildDiscoverData, { ttl: 300 });

    res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    logger.error("discover error", safeErrorMeta(err));

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};