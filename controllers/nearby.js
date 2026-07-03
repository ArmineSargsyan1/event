import { QueryTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";


export const getNearbyLandmarksBySqlWithTime = async (req, res) => {
  try {
    const { lat, lng, city } = req.query;

    if (!lat || !lng || !city) {
      return res.status(400).json({ error: "Parameters lat, lng, and city are required." });
    }

    const nearbyLandmarks = await sequelize.query(
      `
      SELECT 
        id, 
        name, 
        type, 
        city, 
        latitude, 
        longitude,
        
        ROUND(
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(:hotelLat)) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians(:hotelLng)) + 
              sin(radians(:hotelLat)) * sin(radians(latitude))
            ))
          ), 1
        ) AS distance_km,
        
        CASE 
          WHEN type = 'airport' THEN 'drive'
          ELSE 'walk'
        END AS transport_type,

        ROUND(
          CASE 
            WHEN type = 'airport' THEN 
              (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                  cos(radians(:hotelLat)) * cos(radians(latitude)) * 
                  cos(radians(longitude) - radians(:hotelLng)) + 
                  sin(radians(:hotelLat)) * sin(radians(latitude))
                ))
              )) * 1.5
            ELSE 
              (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                  cos(radians(:hotelLat)) * cos(radians(latitude)) * 
                  cos(radians(longitude) - radians(:hotelLng)) + 
                  sin(radians(:hotelLat)) * sin(radians(latitude))
                ))
              )) * 12
          END, 0
        ) AS duration_min

      FROM landmarks
      WHERE city = :hotelCity
      ORDER BY distance_km ASC;
      `,
      {
        replacements: {
          hotelLat: parseFloat(lat),
          hotelLng: parseFloat(lng),
          hotelCity: city
        },
        type: QueryTypes.SELECT
      }
    );

    return res.status(200).json({
      success: true,
      data: nearbyLandmarks
    });

  } catch (error) {
    console.error("Error with SQL Haversine & Time estimation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
