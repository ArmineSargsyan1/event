import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";
import Hotels from "./Hotels.js";

class Photo extends Model {
  static associate() {
    // Photo.belongsTo(Room, {
    //   foreignKey: "room_id",
    //   as: "room",
    // });

    // Photo.belongsTo(Hotels, {
    //   foreignKey: "hotel_id",
    //   as: "hotel",
    // });
  }
}

Photo.init(
  {
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Photo",
    tableName: "photos",
    underscored: true,
  }
);

export default Photo;

