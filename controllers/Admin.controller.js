import Amenity from "../models/Amenity.js";
import {Hotels} from "../models/index.js";
import {Op} from "sequelize";



///hotels


const AMENITIES = [
  // Bedroom
  { key: "air_conditioning", name: "Air-conditioning", category: "Bedroom", scope: "room" },
  { key: "heating", name: "Heating", category: "Bedroom", scope: "room" },
  { key: "blackout_curtains", name: "Blackout curtains", category: "Bedroom", scope: "room" },
  { key: "ceiling_fan", name: "Ceiling fan", category: "Bedroom", scope: "room" },
  { key: "premium_bedding", name: "Premium bedding", category: "Bedroom", scope: "room" },
  { key: "soundproofing", name: "Soundproofing", category: "Bedroom", scope: "room" },
  { key: "separate_bedroom", name: "Separate bedroom", category: "Bedroom", scope: "room" },
  { key: "alarm_clock", name: "Alarm clock", category: "Bedroom", scope: "room" },

  // Bathroom
  { key: "private_bathroom", name: "Private bathroom", category: "Bathroom", scope: "room" },
  { key: "bathtub", name: "Bathtub", category: "Bathroom", scope: "room" },
  { key: "shower", name: "Shower", category: "Bathroom", scope: "room" },
  { key: "rainfall_shower", name: "Rainfall shower", category: "Bathroom", scope: "room" },
  { key: "hair_dryer", name: "Hair dryer", category: "Bathroom", scope: "room" },
  { key: "free_toiletries", name: "Free toiletries", category: "Bathroom", scope: "room" },
  { key: "towels", name: "Towels", category: "Bathroom", scope: "room" },
  { key: "bathrobes", name: "Bathrobes", category: "Bathroom", scope: "room" },
  { key: "slippers", name: "Slippers", category: "Bathroom", scope: "room" },

  // Entertainment
  { key: "tv", name: "TV", category: "Entertainment", scope: "room" },
  { key: "smart_tv", name: "Smart TV", category: "Entertainment", scope: "room" },
  { key: "streaming_services", name: "Streaming services", category: "Entertainment", scope: "room" },

  // Food (ROOM)
  { key: "mini_fridge", name: "Mini-fridge", category: "Food", scope: "room" },
  { key: "minibar", name: "Minibar", category: "Food", scope: "room" },
  { key: "coffee_maker", name: "Coffee maker", category: "Food", scope: "room" },
  { key: "electric_kettle", name: "Electric kettle", category: "Food", scope: "room" },
  { key: "microwave", name: "Microwave", category: "Food", scope: "room" },
  { key: "room_service", name: "Room service", category: "Food", scope: "hotel" },

  // Internet
  { key: "free_wifi", name: "Free WiFi", category: "Internet", scope: "both" },
  { key: "high_speed_wifi", name: "High-speed WiFi", category: "Internet", scope: "both" },
  { key: "wired_internet", name: "Wired internet", category: "Internet", scope: "both" },

  // Comfort
  { key: "desk", name: "Desk", category: "Comfort", scope: "room" },
  { key: "safe", name: "Safe", category: "Comfort", scope: "room" },
  { key: "daily_housekeeping", name: "Daily housekeeping", category: "Comfort", scope: "hotel" },

  // Accessibility
  { key: "wheelchair_accessible", name: "Wheelchair accessible", category: "Accessibility", scope: "hotel" },
  { key: "elevator_access", name: "Elevator access", category: "Accessibility", scope: "hotel" },

  // Safety
  { key: "smoke_detector", name: "Smoke detector", category: "Safety", scope: "both" },
  { key: "fire_extinguisher", name: "Fire extinguisher", category: "Safety", scope: "both" },
  { key: "security_system", name: "Security system", category: "Safety", scope: "both" },

  // General
  { key: "free_parking", name: "Free parking", category: "General", scope: "hotel" },
  { key: "balcony", name: "Balcony", category: "General", scope: "room" },
  { key: "city_view", name: "City view", category: "General", scope: "room" },

  // Services
  { key: "laundry_service", name: "Laundry service", category: "Services", scope: "hotel" },
  { key: "front_desk_24h", name: "24-hour front desk", category: "Services", scope: "hotel" },
  { key: "concierge_service", name: "Concierge service", category: "Services", scope: "hotel" },

  // Recreation
  { key: "pool", name: "Swimming pool", category: "Recreation", scope: "hotel" },
  { key: "restaurant", name: "Restaurant", category: "Food", scope: "hotel" },

  // 🆕 NEW
  { key: "spa", name: "Spa", category: "Wellness", scope: "hotel" },
  { key: "gym", name: "Gym", category: "Wellness", scope: "hotel" },
];


export const seedAmenities = async (req, res) => {
  try {
    const formatted = AMENITIES.map((a) => ({
      ...a,
      key: a.key.trim().toLowerCase(),
      scope: a.scope || "room",
    }));

    await Amenity.bulkCreate(formatted, {
      ignoreDuplicates: true,
      validate: true,
    });

    res.json({
      success: true,
      message: "Amenities seeded",
    });
  } catch (e) {
    res.status(500).json({
      message: "Seed failed",
      error: e.message,
    });
  }
};


export const getAllAmenitiesAdmin = async (req, res) => {
  try {
    const view = req.query.view || "grouped";
    const scope = req.query.scope; // room | hotel | all

    let where = {};

    // scope logic
    if (scope && scope !== "all") {
      const map = {
        room: ["room", "both"],
        hotel: ["hotel", "both"],
        both: ["room", "hotel", "both"],
      };

      where.scope = {
        [Op.in]: map[scope] || ["room", "hotel", "both"],
      };
    }

    const amenities = await Amenity.findAll({
      where,
      attributes: ["id", "key", "name", "category", "scope"],
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    // FLAT
    if (view === "flat") {
      return res.json({
        success: true,
        data: amenities,
      });
    }

    // GROUPED (simple & clean)
    const grouped = amenities.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: grouped,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Admin fetch failed",
      error: e.message,
    });
  }
};


// export const getAllAmenitiesAdmin = async (req, res) => {
//   try {
//     const view = req.query.view || "grouped";
//     const scope = req.query.scope; // room | hotel | both
//
//     const where = {};
//
//     // scope filter logic
//     if (scope) {
//       if (scope === "both") {
//         where.scope = {
//           [Op.in]: ["room", "hotel", "both"],
//         };
//       } else {
//         where.scope = {
//           [Op.in]: [scope, "both"], // shared amenities included
//         };
//       }
//     }
//
//     const amenities = await Amenity.findAll({
//       where,
//       attributes: ["id", "key", "name", "category", "scope"],
//       order: [
//         ["category", "ASC"],
//         ["name", "ASC"],
//       ],
//     });
//
//     // FLAT
//     if (view === "flat") {
//       return res.json({
//         success: true,
//         data: amenities,
//       });
//     }
//
//     // GROUPED
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) {
//         acc[item.category] = {
//           room: [],
//           hotel: [],
//           both: [],
//         };
//       }
//
//       acc[item.category][item.scope].push(item);
//
//       return acc;
//     }, {});
//
//     return res.json({
//       success: true,
//       data: grouped,
//     });
//
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Admin fetch failed",
//       error: e.message,
//     });
//   }
// };


// export const getAllAmenitiesAdmin = async (req, res) => {
//   console.log(req,666)
//   try {
//     const view = req.query.view || "grouped";
//
//     const amenities = await Amenity.findAll({
//       attributes: ["id", "key", "name", "category"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     if (view === "flat") {
//       return res.json({
//         success: true,
//         data: amenities,
//       });
//     }
//
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) acc[item.category] = [];
//       acc[item.category].push(item);
//       return acc;
//     }, {});
//
//     res.json({
//       success: true,
//       data: grouped,
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Admin fetch failed",
//     });
//   }
// };


// export const getAllAmenitiesAdmin = async (req, res) => {
//   try {
//     const view = req.query.view || "grouped";
//     const scope = req.query.scope;
//
//     const where = {};
//
//     if (scope) {
//       where.scope = {
//         [Op.in]: scope === "both"
//           ? ["room", "hotel", "both"]
//           : [scope, "both"],
//       };
//     }
//
//     const amenities = await Amenity.findAll({
//       where,
//       attributes: ["id", "key", "name", "category", "scope"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     if (view === "flat") {
//       return res.json({ success: true, data: amenities });
//     }
//
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) {
//         acc[item.category] = {
//           room: [],
//           hotel: [],
//           both: [],
//         };
//       }
//
//       acc[item.category][item.scope].push(item);
//
//       return acc;
//     }, {});
//
//     res.json({
//       success: true,
//       data: grouped,
//     });
//
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Admin fetch failed",
//     });
//   }
// };



// export const getAllAmenitiesAdmin = async (req, res) => {
//   try {
//     const view = req.query.view || "grouped";
//     const scope = req.query.scope;
//
//     const where = {};
//
//     if (scope) {
//       where.scope = scope;
//     }
//
//     const amenities = await Amenity.findAll({
//       where,
//       attributes: ["id", "key", "name", "category", "scope"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     if (view === "flat") {
//       return res.json({
//         success: true,
//         data: amenities,
//       });
//     }
//
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) acc[item.category] = [];
//       acc[item.category].push(item);
//       return acc;
//     }, {});
//
//     res.json({
//       success: true,
//       data: grouped,
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Admin fetch failed",
//     });
//   }
// };




// POST /admin/amenities
// export const createAmenity = async (req, res) => {
//   try {
//     const { key, name, category } = req.body;
//
//     if (!key || !name) {
//       return res.status(400).json({
//         success: false,
//         message: "key and name required",
//       });
//     }
//
//     const exists = await Amenity.findOne({ where: { key } });
//
//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Amenity already exists",
//       });
//     }
//
//     const amenity = await Amenity.create({ key, name, category });
//
//     res.json({
//       success: true,
//       data: amenity,
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Create failed",
//     });
//   }
// };

export const createAmenity = async (req, res) => {
  try {
    const { key, name, category, scope = "room" } = req.body;

    // validation
    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: "key and name required",
      });
    }

    // normalize key (optional but PRO)
    const normalizedKey = key.trim().toLowerCase();

    const exists = await Amenity.findOne({
      where: { key: normalizedKey },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Amenity already exists",
      });
    }

    const amenity = await Amenity.create({
      key: normalizedKey,
      name,
      category,
      scope,
    });

    res.json({
      success: true,
      data: amenity,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Create failed",
    });
  }
};


// PUT /admin/amenities/:id
// export const updateAmenity = async (req, res) => {
//   try {
//     const { id } = req.params;
//
//     const amenity = await Amenity.findByPk(id);
//
//     if (!amenity) {
//       return res.status(404).json({
//         success: false,
//         message: "Not found",
//       });
//     }
//
//     await amenity.update(req.body);
//
//     res.json({
//       success: true,
//       data: amenity,
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Update failed",
//     });
//   }
// };

export const updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, name, category, scope } = req.body;

    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // 🔥 check duplicate key (if updating key)
    if (key && key !== amenity.key) {
      const exists = await Amenity.findOne({
        where: { key: key.trim().toLowerCase() },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Key already exists",
        });
      }
    }

    // normalize key
    const updateData = {
      ...(key && { key: key.trim().toLowerCase() }),
      ...(name && { name }),
      ...(category && { category }),
      ...(scope && { scope }),
    };

    await amenity.update(updateData);

    res.json({
      success: true,
      data: amenity,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


// DELETE /admin/amenities/:id
export const deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;

    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // 🔥 check if used in hotels
    const hotelUsage = await amenity.countHotels();
    const roomUsage = await amenity.countRooms();

    if (hotelUsage > 0 || roomUsage > 0) {
      return res.status(400).json({
        success: false,
        message: "Amenity is in use and cannot be deleted",
      });
    }

    await amenity.destroy();

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};


// export const deleteAmenity = async (req, res) => {
//   try {
//     const { id } = req.params;
//
//     const amenity = await Amenity.findByPk(id);
//
//     if (!amenity) {
//       return res.status(404).json({
//         success: false,
//         message: "Not found",
//       });
//     }
//
//     await amenity.destroy();
//
//     res.json({
//       success: true,
//       message: "Deleted successfully",
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Delete failed",
//     });
//   }
// };
