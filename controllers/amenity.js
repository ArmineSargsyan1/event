// import Amenity from "../models/Amenity.js";
//
//
// const AMENITIES = [
//   // Bedroom
//   { key: "air_conditioning", name: "Air-conditioning", category: "Bedroom" },
//   { key: "heating", name: "Heating", category: "Bedroom" },
//   { key: "blackout_curtains", name: "Blackout curtains", category: "Bedroom" },
//   { key: "ceiling_fan", name: "Ceiling fan", category: "Bedroom" },
//   { key: "premium_bedding", name: "Premium bedding", category: "Bedroom" },
//   { key: "soundproofing", name: "Soundproofing", category: "Bedroom" },
//   { key: "separate_bedroom", name: "Separate bedroom", category: "Bedroom" },
//   { key: "alarm_clock", name: "Alarm clock", category: "Bedroom" },
//
//   // Bathroom
//   { key: "private_bathroom", name: "Private bathroom", category: "Bathroom" },
//   { key: "bathtub", name: "Bathtub", category: "Bathroom" },
//   { key: "shower", name: "Shower", category: "Bathroom" },
//   { key: "rainfall_shower", name: "Rainfall shower", category: "Bathroom" },
//   { key: "hair_dryer", name: "Hair dryer", category: "Bathroom" },
//   { key: "free_toiletries", name: "Free toiletries", category: "Bathroom" },
//   { key: "towels", name: "Towels", category: "Bathroom" },
//   { key: "bathrobes", name: "Bathrobes", category: "Bathroom" },
//   { key: "slippers", name: "Slippers", category: "Bathroom" },
//
//   // Entertainment
//   { key: "tv", name: "TV", category: "Entertainment" },
//   { key: "lcd_tv", name: "LCD TV", category: "Entertainment" },
//   { key: "smart_tv", name: "Smart TV", category: "Entertainment" },
//   { key: "satellite_channels", name: "Satellite channels", category: "Entertainment" },
//   { key: "cable_channels", name: "Cable channels", category: "Entertainment" },
//   { key: "streaming_services", name: "Streaming services", category: "Entertainment" },
//   { key: "pay_movies", name: "Pay movies", category: "Entertainment" },
//
//   // Food & Drink
//   { key: "mini_fridge", name: "Mini-fridge", category: "Food" },
//   { key: "minibar", name: "Minibar", category: "Food" },
//   { key: "coffee_maker", name: "Coffee maker", category: "Food" },
//   { key: "espresso_machine", name: "Espresso machine", category: "Food" },
//   { key: "electric_kettle", name: "Electric kettle", category: "Food" },
//   { key: "microwave", name: "Microwave", category: "Food" },
//   { key: "free_bottled_water", name: "Free bottled water", category: "Food" },
//   { key: "room_service", name: "Room service", category: "Food" },
//   { key: "dining_area", name: "Dining area", category: "Food" },
//
//   // Internet
//   { key: "free_wifi", name: "Free WiFi", category: "Internet" },
//   { key: "high_speed_wifi", name: "High-speed WiFi", category: "Internet" },
//   { key: "wifi_surcharge", name: "WiFi (surcharge)", category: "Internet" },
//   { key: "wired_internet", name: "Wired internet", category: "Internet" },
//
//   // Comfort
//   { key: "desk", name: "Desk", category: "Comfort" },
//   { key: "iron", name: "Iron", category: "Comfort" },
//   { key: "ironing_board", name: "Ironing board", category: "Comfort" },
//   { key: "safe", name: "Safe", category: "Comfort" },
//   { key: "laptop_safe", name: "Laptop safe", category: "Comfort" },
//   { key: "phone", name: "Phone", category: "Comfort" },
//   { key: "daily_housekeeping", name: "Daily housekeeping", category: "Comfort" },
//   { key: "energy_saving_switches", name: "Energy-saving switches", category: "Comfort" },
//
//   // Accessibility
//   { key: "wheelchair_accessible", name: "Wheelchair accessible", category: "Accessibility" },
//   { key: "accessible_bathroom", name: "Accessible bathroom", category: "Accessibility" },
//   { key: "grab_bars", name: "Grab bars", category: "Accessibility" },
//   { key: "low_height_counter", name: "Low-height counter", category: "Accessibility" },
//   { key: "elevator_access", name: "Elevator access", category: "Accessibility" },
//
//   // Safety
//   { key: "smoke_detector", name: "Smoke detector", category: "Safety" },
//   { key: "fire_extinguisher", name: "Fire extinguisher", category: "Safety" },
//   { key: "security_system", name: "Security system", category: "Safety" },
//   { key: "carbon_monoxide_detector", name: "Carbon monoxide detector", category: "Safety" },
//   { key: "safe_deposit_box", name: "Safe deposit box", category: "Safety" },
//
//   // General
//   { key: "connecting_rooms", name: "Connecting rooms", category: "General" },
//   { key: "free_parking", name: "Free parking", category: "General" },
//   { key: "free_cot", name: "Free cot", category: "General" },
//   { key: "balcony", name: "Balcony", category: "General" },
//   { key: "terrace", name: "Terrace", category: "General" },
//   { key: "garden_view", name: "Garden view", category: "General" },
//   { key: "city_view", name: "City view", category: "General" },
//   { key: "mountain_view", name: "Mountain view", category: "General" },
//   { key: "sea_view", name: "Sea view", category: "General" },
//
//   // Services
//   { key: "laundry_service", name: "Laundry service", category: "Services" },
//   { key: "dry_cleaning", name: "Dry cleaning", category: "Services" },
//   { key: "airport_shuttle", name: "Airport shuttle", category: "Services" },
//   { key: "front_desk_24h", name: "24-hour front desk", category: "Services" },
//   { key: "concierge_service", name: "Concierge service", category: "Services" },
// ];


// export const seedAmenities = async (req, res) => {
//   try {
//     await Amenity.bulkCreate(AMENITIES, {
//       ignoreDuplicates: true, // ⚡ important
//     });
//
//     res.json({
//       success: true,
//       message: "Amenities seeded",
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "Seed failed",
//       error: e.message,
//     });
//   }
// };


//
//
// export const getAmenitiesForUser = async (req, res) => {
//   try {
//     const amenities = await Amenity.findAll({
//       attributes: ["id", "key", "name", "category"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) acc[item.category] = [];
//       acc[item.category].push({
//         id: item.id,
//         key: item.key,
//         name: item.name,
//       });
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
//       message: "Failed to fetch amenities",
//     });
//   }
// };
//
//
//
// ///admin
// export const getAllAmenitiesAdmin = async (req, res) => {
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
//
//
// export const createAmenity = async (req, res) => {
//   try {
//     const { key, name, category } = req.body;
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
//     const amenity = await Amenity.create({
//       key,
//       name,
//       category,
//     });
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
//
//
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
//
//
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
//
//
//
//

// export const seedAmenities = async (req, res) => {
//   try {
//     await Amenity.bulkCreate(AMENITIES, {
//       ignoreDuplicates: true, // ⚡ important
//     });
//
//     res.json({
//       success: true,
//       message: "Amenities seeded",
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "Seed failed",
//       error: e.message,
//     });
//   }
// };


// export const createAmenity = async (req, res) => {
//   try {
//     const { key, name, category } = req.body;
//
//     if (!key || !name) {
//       return res.status(400).json({
//         message: "key and name are required",
//       });
//     }
//
//     const exists = await Amenity.findOne({
//       where: { key },
//     });
//
//     if (exists) {
//       return res.status(400).json({
//         message: "Amenity already exists",
//       });
//     }
//
//     const amenity = await Amenity.create({
//       key,
//       name,
//       category,
//     });
//
//     res.json({
//       success: true,
//       amenity,
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "Create failed",
//       error: e.message,
//     });
//   }
// };
//
//
//
//
//
//
// export const getAmenities = async (req, res) => {
//   try {
//     const amenities = await Amenity.findAll({
//       attributes: ["id", "key", "name", "category"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     const grouped = amenities.reduce((acc, item) => {
//       if (!acc[item.category]) acc[item.category] = [];
//       acc[item.category].push(item);
//       return acc;
//     }, {});
//
//     res.json({
//       success: true,
//       amenities: grouped,
//     });
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       message: "Fetch failed",
//       error: e.message,
//     });
//   }
// };
//
//
//
// export const getGroupedAmenities = async (req, res) => {
//   try {
//     const amenities = await Amenity.findAll();
//
//     const grouped = {};
//
//     amenities.forEach((a) => {
//       if (!grouped[a.category]) {
//         grouped[a.category] = [];
//       }
//
//       grouped[a.category].push(a);
//     });
//
//     res.json(grouped);
//   } catch (e) {
//     res.status(500).json({
//       message: "Grouped fetch failed",
//       error: e.message,
//     });
//   }
// };
//
//
// export const getAmenitiesByKeys = async (req, res) => {
//   try {
//     const { keys } = req.query;
//
//     const list = await Amenity.findAll({
//       where: {
//         key: {
//           [Op.in]: keys.split(","),
//         },
//       },
//     });
//
//     res.json(list);
//   } catch (e) {
//     res.status(500).json({
//       message: "Fetch by keys failed",
//       error: e.message,
//     });
//   }
// };



import Amenity from "../models/Amenity.js";
import { Op } from "sequelize";

// GET /amenities

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


// export const getAmenities = async (req, res) => {
//   try {
//     const { view, keys, scope } = req.query;
//
//     const where = {};
//
//     if (keys) {
//       where.key = {
//         [Op.in]: keys.split(",").filter(Boolean),
//       };
//     }
//
//     if (scope) {
//       where.scope = {
//         [Op.in]: scope.split(","),
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
//       message: "Failed to fetch amenities",
//     });
//   }
// };


// export const getAmenities = async (req, res) => {
//   try {
//     const { view, keys } = req.query;
//
//     const where = {};
//
//     if (keys) {
//       where.key = {
//         [Op.in]: keys.split(",").filter(Boolean),
//       };
//     }
//
//     const amenities = await Amenity.findAll({
//       where,
//       attributes: ["id", "key", "name", "category"],
//       order: [["category", "ASC"], ["name", "ASC"]],
//     });
//
//     // FLAT VIEW
//     if (view === "flat") {
//       return res.json({
//         success: true,
//         data: amenities,
//       });
//     }
//
//     // GROUPED (default)
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
//       message: "Failed to fetch amenities",
//     });
//   }
// };
