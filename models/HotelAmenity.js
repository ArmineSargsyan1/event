import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class HotelAmenities extends Model {}

HotelAmenities.init(
  {
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amenity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "hotel_amenities",
    timestamps: false,
  }
);

export default HotelAmenities;
