import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";
import Photo from "./Photo.js";
import RoomAmenity from "./RoomAmenities.js";
import Amenity from "./Amenity.js";
import RoomOption from "./RoomOption.js";
import RoomExtra from "./RoomExtra.js";

class Room extends Model {
  static associate() {

    Room.belongsTo(Hotels, {
      foreignKey: "hotel_id",
      as: "hotel",
      onDelete: "RESTRICT"
    });

    Room.hasMany(Photo, {
      foreignKey: "room_id",
      as: "images",
      onDelete: "RESTRICT"
    });

    Room.belongsToMany(Amenity, {
      through: RoomAmenity,
      foreignKey: "room_id",
      otherKey: "amenity_id",
      as: "amenities",
    });

    Room.hasMany(RoomOption, {
      foreignKey: "room_id",
      as: "options",
    });

    Room.hasMany(RoomExtra, {
      foreignKey: "room_id",
      as: "extras",
    });

  }
}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    roomType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Standard Room",
      field: "room_type"
    },

    size: DataTypes.INTEGER,
    bed_type: DataTypes.STRING,
    max_guests: DataTypes.INTEGER,

    // price: {
    //   type: DataTypes.FLOAT,
    //   allowNull: true,
    // },

    status: {
      type: DataTypes.ENUM("active", "inactive", "archived"),
      defaultValue: "active",
    },

    deleted_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Room",
    tableName: "rooms",
    underscored: true,
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

export default Room;
