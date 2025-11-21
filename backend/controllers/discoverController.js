// controllers/discoverController.js
const Property = require("../models/Property");

const normalize = (str="") =>
  str.toLowerCase().replace(/[-_/]/g, " ");

const mapCategory = (type = "") => {
  const t = normalize(type);

  if (t.includes("flat") || t.includes("apartment") || t.includes("villa"))
    return "residential";

  if (t.includes("warehouse") || t.includes("industrial"))
    return "industrial";

  if (t.includes("shop") || t.includes("showroom") || t.includes("retail"))
    return "retail";

  if (t.includes("plot"))
    return "plot";

  if (t.includes("office"))
    return "commercial";

  return "commercial";
};


exports.getDiscover = async (req, res) => {
  try {
    // Fetch propertyType + locality
    const pipeline = [
      {
        $group: {
          _id: "$propertyType",
          localities: { $addToSet: "$locality" },
        },
      },
    ];

    const groups = await Property.aggregate(pipeline);

    const data = {
      residential: [],
      industrial: [],
      commercial: [],
      retail: [],
      plot: [],
      popular: [], // static for now
    };

    groups.forEach((g) => {
      const key = mapCategory(g._id);
      if (!data[key]) data[key] = [];

      const cleaned = g.localities.filter(Boolean);

      data[key].push(...cleaned);
    });

    // Deduplicate + Sort + Limit
    for (const key in data) {
      if (Array.isArray(data[key])) {
        data[key] = [...new Set(data[key])].sort().slice(0, 200);
      }
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("discover error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
