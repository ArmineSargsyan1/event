import {literal, Op, QueryTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Attraction from "../models/Attraction.js";
import Hotels from "../models/Hotels.js";
import HotelPhotos from "../models/HotelPhotos.js";
import {Restaurant} from "../models/index.js";
import Landmark from "../models/Landmarks.js";

export const getNearbyLandmarksBySqlWithTime = async (req, res) => {
  try {
    const { lat, lng, city, type } = req.query;

    const hotelLat = lat ? parseFloat(lat) : null;
    const hotelLng = lng ? parseFloat(lng) : null;

    if (lat && lng && (isNaN(hotelLat) || isNaN(hotelLng))) {
      return res.status(400).json({ error: "Invalid coordinates format." });
    }

    const hasCoords = hotelLat !== null && hotelLng !== null;

    const landmarkDistanceLiteral = hasCoords
      ? literal(`ROUND(6371 * acos(LEAST(1.0, GREATEST(-1.0, 
          cos(radians(${hotelLat})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${hotelLng})) + 
          sin(radians(${hotelLat})) * sin(radians(latitude))
        ))), 1)`)
      : literal("0");

    const attractionDistanceLiteral = hasCoords
      ? literal(`ROUND(6371 * acos(LEAST(1.0, GREATEST(-1.0, 
          cos(radians(${hotelLat})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${hotelLng})) + 
          sin(radians(${hotelLat})) * sin(radians(latitude))
        ))), 1)`)
      : literal("0");

    const landmarkWhere = {};
    const attractionWhere = {};

    if (type && type !== "all") {
      landmarkWhere.type = type;
      attractionWhere.category = type;
    }

    const [landmarks, attractions] = await Promise.all([

      hasCoords
        ? Landmark.findAll({
          attributes: [
            "id", "name", "type", "city", "latitude", "longitude",
            [literal("NULL"), "image"],
            [literal("NULL"), "slug"],
            [landmarkDistanceLiteral, "distance_km"],
            [literal("CASE WHEN type = 'airport' THEN 'drive' ELSE 'walk' END"), "transport_type"]
          ],
          where: {
            ...landmarkWhere,
            ...(hasCoords && {
              [Op.and]: [
                literal(`6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                    cos(radians(${hotelLat})) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(${hotelLng})) + 
                    sin(radians(${hotelLat})) * sin(radians(latitude))
                  ))) <= 30.0`)
              ]
            })
          }
        })
        : Promise.resolve([]),

      Attraction.findAll({
        attributes: [
          [literal("id + 10000"), "id"],
          "name", "image", "slug",
          ["category", "type"],
          ["region", "city"],
          "latitude", "longitude",
          [attractionDistanceLiteral, "distance_km"],
          [literal("'walk'"), "transport_type"]
        ],
        where: {
          ...attractionWhere,
          ...(hasCoords && {
            [Op.and]: [
              literal(`6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                cos(radians(${hotelLat})) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(${hotelLng})) + 
                sin(radians(${hotelLat})) * sin(radians(latitude))
              ))) <= 30.0`)
            ]
          })
        }
      })
    ]);

    const combinedPlaces = [
      ...landmarks.map(l => l.toJSON()),
      ...attractions.map(a => a.toJSON())
    ];

    const processedPlaces = combinedPlaces.map(place => {
      const distance = parseFloat(place.distance_km);

      if (distance === 0) {
        return {
          ...place,
          distance_km: null,
          duration_min: null
        };
      }

      const duration = place.transport_type === 'drive'
        ? Math.round(distance * 1.5)
        : Math.round(distance * 12);

      return {
        ...place,
        duration_min: duration === 0 ? 1 : duration
      };
    });

    processedPlaces.sort((a, b) => {
      if (a.distance_km && b.distance_km) {
        return a.distance_km - b.distance_km;
      }
      return a.id - b.id;
    });

    return res.status(200).json({
      success: true,
      data: processedPlaces
    });

  } catch (error) {
    console.error("Error with Sequelize Universal Places-Only System:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};




export const getFeaturedAttractions = async (req, res) => {
  try {
    const featuredPlaces = await Attraction.findAll({
      where: { featured: true },
      limit: 6,
      order: [["rating", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: featuredPlaces
    });
  } catch (error) {
    console.error("Error fetching featured attractions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getAttractionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const attraction = await Attraction.findOne({
      where: { slug }
    });

    if (!attraction) {
      return res.status(404).json({ error: "Attraction not found" });
    }

    const attractionLat = parseFloat(attraction.latitude);
    const attractionLng = parseFloat(attraction.longitude);

    // Հեռավորության (Haversine) ֆորմուլան Hotels-ի համար (lat/lon)
    const hotelDistanceLiteral = literal(`
      ROUND(6371 * acos(LEAST(1.0, GREATEST(-1.0, 
        cos(radians(${attractionLat})) * cos(radians(lat)) * 
        cos(radians(lon) - radians(${attractionLng})) + 
        sin(radians(${attractionLat})) * sin(radians(lat))
      ))), 1)
    `);

    const restaurantDistanceLiteral = literal(`
      ROUND(6371 * acos(LEAST(1.0, GREATEST(-1.0, 
        cos(radians(${attractionLat})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(${attractionLng})) + 
        sin(radians(${attractionLat})) * sin(radians(latitude))
      ))), 1)
    `);

    const [hotels, restaurants] = await Promise.all([

      Hotels.findAll({
        attributes: [
          "id", "name", "city",
          ["lat", "latitude"], ["lon", "longitude"],
          ["hotel_category", "category"],
          [hotelDistanceLiteral, "distance_km"],
          [literal("'hotel'"), "type"],
          [literal("'drive'"), "transport_type"]
        ],
        include: [{
          model: HotelPhotos,
          as: "images",
          attributes: ["path"],
          where: { is_main: true },
          required: false
        }],
        where: {
          [Op.and]: [
            literal(`
              6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                cos(radians(${attractionLat})) * cos(radians(lat)) * 
                cos(radians(lon) - radians(${attractionLng})) + 
                sin(radians(${attractionLat})) * sin(radians(lat))
              ))) <= 30.0
            `)
          ]
        }
      }),

      Restaurant.findAll({
        attributes: [
          "id", "name", "city", "latitude", "longitude", "image",
          ["restaurant_category", "category"],
          [restaurantDistanceLiteral, "distance_km"],
          [literal("'restaurant'"), "type"],
          [literal("'walk'"), "transport_type"]
        ],
        where: {
          [Op.and]: [
            literal(`
              6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                cos(radians(${attractionLat})) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(${attractionLng})) + 
                sin(radians(${attractionLat})) * sin(radians(latitude))
              ))) <= 30.0
            `)
          ]
        }
      })
    ]);

    const combinedPlaces = [
      ...hotels.map(h => {
        const hotelJson = h.toJSON();
        const mainImg = hotelJson.images && hotelJson.images[0] ? hotelJson.images[0].path : null;
        delete hotelJson.images;
        return { ...hotelJson, image: mainImg };
      }),
      ...restaurants.map(r => r.toJSON())
    ];

    const processedPlaces = combinedPlaces.map(place => {
      const distance = parseFloat(place.distance_km);
      const duration = place.transport_type === 'drive'
        ? Math.round(distance * 1.5)
        : Math.round(distance * 12);

      return {
        ...place,
        duration_min: duration === 0 ? 1 : duration
      };
    });

    processedPlaces.sort((a, b) => a.distance_km - b.distance_km);

    return res.status(200).json({
      success: true,
      data: {
        ...attraction.toJSON(),
        nearbyPlaces: processedPlaces
      }
    });

  } catch (error) {
    console.error("Error fetching attraction detail with Sequelize ORM:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

