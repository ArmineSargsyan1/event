// import {Model, DataTypes} from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
// import Room from "./Room.js";
//
// class Amenity extends Model {
//   static associate() {
//     Amenity.belongsToMany(Room, { through: "RoomAmenities" });
//     Amenity.belongsToMany(Hotels, { through: "HotelAmenities" });
//   }
// }
//
// Amenity.init(
//   {
//     name: { type: DataTypes.STRING, allowNull: false }, // օրինակ "Air-conditioning"
//     category: DataTypes.STRING, // "Bedroom", "Bathroom"
//   },
//   {
//     sequelize,
//     modelName: "Amenity",
//     tableName: "amenities",
//     timestamps: true,
//     underscored: true
//   }
// );
//
// export default Amenity;


import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";
import RoomAmenity from "./RoomAmenities.js";
import HotelAmenities from "./HotelAmenity.js";
import Hotels from "./Hotels.js";

class Amenity extends Model {
  static associate() {
    Amenity.belongsToMany(Hotels, {
      through: HotelAmenities,
      foreignKey: "amenity_id",
      otherKey: "hotel_id",
    });

    Amenity.belongsToMany(Room, {
      through: RoomAmenity,
      foreignKey: "amenity_id",
      otherKey: "room_id",
      as: "rooms",
    });
  }
}

Amenity.init(
  {
    key: {
      type: DataTypes.STRING,
      // unique: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },

    category: {
      type: DataTypes.STRING,
    },

    scope: {
      type: DataTypes.ENUM("hotel", "room", "both"),
      allowNull: false,
      defaultValue: "room",
    },

  },
  {
    sequelize,
    modelName: "Amenity",
    tableName: "amenities",
    underscored: true,
  }
);

export default Amenity;
