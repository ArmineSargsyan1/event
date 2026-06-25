// import { Model, DataTypes } from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
//
// class HotelPhotos extends Model {
//   static associate() {
//     HotelPhotos.belongsTo(Hotels, {
//       foreignKey: "hotel_id",
//       onDelete: "CASCADE",
//     });
//   }
// }
//
// HotelPhotos.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//
//     hotel_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//
//     path: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//
//     public_id: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//
//     is_main: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     uploaded_by: {
//       type: DataTypes.INTEGER,
//       allowNull: true, // admin/user id
//     },
//
//     sort_order: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },
//
//   },
//   {
//     sequelize,
//     modelName: "HotelPhotos",
//     tableName: "hotel_photos",
//     timestamps: true,
//     underscored: true,
//   }
// );
//
// export default HotelPhotos;


import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";
import Room from "./Room.js";
class HotelPhotos extends Model {
  static associate() {
    HotelPhotos.belongsTo(Hotels, {
      foreignKey: "hotel_id",
      as: "hotel",
      onDelete: "CASCADE",
    });

    HotelPhotos.belongsTo(Room, {
      foreignKey: "room_id",
      as: "room",
      onDelete: "CASCADE",
    });
  }
}

HotelPhotos.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "room_id"
    },

    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    category: {
      type: DataTypes.ENUM(
        "Pool",
        "Cafe",
        "Restaurant",
        "Exterior",
        "Bathroom",
        "Bedrooms",
        "Kitchen",
        "Amenities"
      ),
      allowNull: false,
      defaultValue: "Exterior",
      field: "category"
    },

    public_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    is_main: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "HotelPhotos",
    tableName: "hotel_photos",
    timestamps: true,
    underscored: true,
  }
);

export default HotelPhotos;

