import {Model, DataTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";

class RoomExtra extends Model {
  static associate() {
    RoomExtra.belongsTo(Room, {
      foreignKey: "room_id",
      onDelete: "CASCADE",
    });
  }
}


RoomExtra.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    type: {
      type: DataTypes.ENUM(
        "service",     // airport, spa
        "food",        // dinner add-on
        "comfort"      // extra bed
      ),
      defaultValue: "service",
    },
  },
  {
    sequelize,
    modelName: "RoomExtra",
    tableName: "room_extras",
    underscored: true,
  }
);


export default RoomExtra;

const EXTRAS = [
  "Extra bed",
  "Late checkout",
  "Airport transfer"
];
