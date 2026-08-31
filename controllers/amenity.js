import Amenity from "../models/Amenity.js";
import { Op } from "sequelize";


export const getAmenities = async (req, res) => {
  try {
    const { view, keys, scope } = req.query;

    const where = {};

    if (keys) {
      const cleanKeys = keys.split(",").map(k => k.trim()).filter(Boolean);

      where.key = {
        [Op.in]: cleanKeys,
      };
    }

    if (scope) {
      const scopes = scope.split(",").map(s => s.trim()).filter(Boolean);

      where.scope = {
        [Op.in]: scopes.includes("room") || scopes.includes("hotel")
          ? [...scopes, "both"]
          : scopes,
      };
    }

    const amenities = await Amenity.findAll({
      where,
      attributes: ["id", "key", "name", "category", "scope"],
      order: [["category", "ASC"], ["name", "ASC"]],
    });

    if (view === "flat") {
      return res.json({ success: true, data: amenities });
    }

    const grouped = amenities.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch amenities",
    });
  }
};

