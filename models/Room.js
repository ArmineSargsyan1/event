// // // import { DataTypes, Model } from "sequelize";
// // // import sequelize from "../clients/db.sequelize.mysql.js";
// // // import Hotel from "./Hotels.js";
// // //
// // // class Room extends Model {}
// // //
// // //
// // // Room.init({
// // //   id: {
// // //     type: DataTypes.UUID,
// // //     defaultValue: DataTypes.UUIDV4,
// // //     primaryKey: true
// // //   },
// // //   hotelId: {
// // //     type: DataTypes.UUID,
// // //     allowNull: false
// // //   },
// // //   number: DataTypes.STRING,
// // //   price: DataTypes.FLOAT
// // // }, {
// // //   sequelize,
// // //   modelName: 'Room',
// // //   tableName: 'rooms',
// // //   timestamps: true,
// // //   underscored: true,
// // // });
// // //
// // //
// // // Room.belongsTo(Hotel, { foreignKey: 'hotelId' });
// // // export default Room;
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// // //
// //
// // import { DataTypes, Model } from "sequelize";
// // import sequelize from "../clients/db.sequelize.mysql.js";
// // import Hotel from "./Hotels.js";
// //
// // class Room extends Model {}
// //
// // Room.init({
// //   id: {
// //     type: DataTypes.UUID,
// //     defaultValue: DataTypes.UUIDV4,
// //     primaryKey: true
// //   },
// //   hotelId: {
// //     type: DataTypes.UUID,
// //     allowNull: false,
// //     references: {
// //       model: Hotel,
// //       key: "id"
// //     }
// //   },
// //   type: {
// //     type: DataTypes.STRING, // Single, Double, Suite
// //     allowNull: false
// //   },
// //   price: {
// //     type: DataTypes.FLOAT,
// //     allowNull: false,
// //     defaultValue: 0
// //   },
// //   beds: {
// //     type: DataTypes.INTEGER,
// //     defaultValue: 1
// //   },
// //   description: DataTypes.TEXT,
// //   amenities: {
// //     type: DataTypes.JSON, // Array of strings
// //     allowNull: true,
// //     defaultValue: []
// //   }
// // }, {
// //   sequelize,
// //   modelName: "Room",
// //   tableName: "rooms",
// //   timestamps: true,
// //   underscored: true
// // });
// //
// // // Կապ Hotel-ի հետ
// // // Hotel.hasMany(Room, { foreignKey: "hotelId", as: "rooms" });
// // Room.belongsTo(Hotel, { foreignKey: "hotelId", as: "hotel" });
// //
// //
// // export default Room;
//
//
// import { DataTypes, Model } from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
// import RoomOption from "./RoomOption.js";
// import Amenity from "./Amenity.js";
// import RoomExtra from "./RoomExtra.js";
// import Photo from "./Photo.js";
// class Room extends Model {
//   static associate() {
//     Room.belongsTo(Hotels, { foreignKey: "hotel_id", onDelete: "CASCADE" });
//     Room.hasMany(Photo, { foreignKey: "room_id", as: "images", onDelete: "CASCADE" });
//     Room.belongsToMany(Amenity, { through: "RoomAmenities", foreignKey: "room_id", otherKey: "amenity_id" });
//     Room.hasMany(RoomOption, { foreignKey: "room_id", onDelete: "CASCADE" });
//     Room.hasMany(RoomExtra, { foreignKey: "room_id", onDelete: "CASCADE" });
//
//   }
// }
//
//
// Room.init(
//   {
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     size: DataTypes.INTEGER,
//     bedType: DataTypes.STRING,
//     maxGuests: DataTypes.INTEGER,
//
//     available_rooms: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },
//
//     free_cancellation: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     pay_later: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     meal_plan: {
//       type: DataTypes.ENUM(
//         "none",
//         "breakfast",
//         "half_board",
//         "full_board",
//         "all_inclusive"
//       ),
//       defaultValue: "none"
//     }
//   },
//   {
//     sequelize,
//     modelName: "Room",
//     tableName: "rooms",
//     underscored: true
//   }
// );
//
//
//
// export default Room;
//

//
// import { DataTypes, Model } from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
// import RoomOption from "./RoomOption.js";
// import Amenity from "./Amenity.js";
// import RoomExtra from "./RoomExtra.js";
// import Photo from "./Photo.js";
//
//
// class Room extends Model {
//   static associate() {
//     Room.belongsTo(Hotels, {
//       foreignKey: "hotel_id",
//       onDelete: "CASCADE",
//     });
//
//     Room.hasMany(Photo, {
//       foreignKey: "room_id",
//       as: "images",
//       onDelete: "CASCADE",
//     });
//
//     Room.belongsToMany(Amenity, {
//       through: "RoomAmenities",
//       foreignKey: "room_id",
//       otherKey: "amenity_id",
//     });
//
//     Room.hasMany(RoomOption, {
//       foreignKey: "room_id",
//       onDelete: "CASCADE",
//     });
//
//     Room.hasMany(RoomExtra, {
//       foreignKey: "room_id",
//       onDelete: "CASCADE",
//     });
//   }
// }
//
// Room.init(
//   {
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//
//     size: {
//       type: DataTypes.INTEGER,
//     },
//
//     bed_type: {
//       type: DataTypes.STRING,
//     },
//
//     max_guests: {
//       type: DataTypes.INTEGER,
//     },
//
//     // 💰 base price (optional fallback)
//     price: {
//       type: DataTypes.FLOAT,
//     },
//
//     // 🍽 meal plan
//     meal_plan: {
//       type: DataTypes.ENUM(
//         "none",
//         "breakfast",
//         "half_board",
//         "full_board",
//         "all_inclusive"
//       ),
//       defaultValue: "none",
//     },
//
//     // 💳 booking rules
//     free_cancellation: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     pay_later: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     // 🛏 inventory
//     available_rooms: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },
//
//     // 🧠 status (IMPORTANT for real systems)
//     status: {
//       type: DataTypes.ENUM("active", "inactive", "archived"),
//       defaultValue: "active",
//     },
//
//     // 🗑 soft delete field (optional if not using paranoid)
//     deleted_at: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     modelName: "Room",
//     tableName: "rooms",
//     underscored: true,
//
//     // 🔥 ENABLE SOFT DELETE (BEST OPTION)
//     paranoid: true,
//     deletedAt: "deleted_at",
//   }
// );
//
// export default Room;



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
