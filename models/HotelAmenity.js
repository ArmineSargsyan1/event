import sequelize from "../clients/db.sequelize.mysql.js";
import { DataTypes } from "sequelize";

const HotelAmenities = sequelize.define(
  "HotelAmenities",
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
    tableName: "hotel_amenities",
    timestamps: false,
  }
);

export default HotelAmenities;
