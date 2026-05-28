import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class RoomAmenity extends Model {
  static associate() {}
}

RoomAmenity.init(
  {
    room_id: {
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
    modelName: "RoomAmenity",
    tableName: "room_amenities",
    timestamps: false,
    underscored: true,
  }
);

export default RoomAmenity;
