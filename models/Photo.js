// import { DataTypes, Model } from 'sequelize';
//
// import Room from './Room.js';
// import sequelize from "../clients/db.sequelize.mysql.js";
//
// import Hotel from "./Hotels.js";
// import User from "./User.js";
//
//
// class Photo extends Model {}
//
// Photo.init(
//   {
//     id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     path: {
//       type: DataTypes.STRING,
//       allowNull: false, // URL կամ base64
//     },
//
//     userId: {
//       type: DataTypes.INTEGER, // ✅ MATCH users.id
//       allowNull: true,
//     },
//     roomId: {
//       type: DataTypes.UUID,
//       allowNull: true,
//     },
//     hotelId: {
//       type: DataTypes.UUID,
//       allowNull: true,
//     },
//
//   },
//   {
//     sequelize,
//     modelName: 'photo',
//     tableName: 'photo',
//     timestamps: true,
//   }
// );
//
// User.hasMany(Photo, {
//   foreignKey: 'userId',
//   as: 'avatar',
//   onDelete: 'cascade',
// });
// Photo.belongsTo(User, { foreignKey: 'userId', onDelete: 'cascade' });
//
// Room.hasMany(Photo, {
//   foreignKey: 'roomId',
//   as: 'roomImages',
//   onDelete: 'cascade',
// });
// Photo.belongsTo(Room, { foreignKey: 'roomId', onDelete: 'cascade' });
//
// Hotel.hasMany(Photo, {
//   foreignKey: 'hotelId',
//   as: 'hotelImages',
//   onDelete: 'cascade',
// });
// Photo.belongsTo(Hotel, { foreignKey: 'hotelId', onDelete: 'cascade' });
//
// export default Photo;


// models/Photo.js
// import { DataTypes, Model } from 'sequelize';
// import sequelize from "../clients/db.sequelize.mysql.js";
// import User from "./User.js";
// import Room from "./Room.js";
// import Hotel from "./Hotels.js";
//
// class Photo extends Model {}
//
// Photo.init(
//   {
//     id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     path: {
//       type: DataTypes.STRING,
//       allowNull: false, // URL կամ base64
//     },
//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//     },
//     roomId: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//     },
//     hotelId: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     modelName: 'Photo',
//     tableName: 'photo',
//     timestamps: true,
//     validate: {
//       onlyOneAssociation() {
//         const count = [this.userId, this.roomId, this.hotelId].filter(Boolean).length;
//         if (count > 1) {
//           throw new Error("Photo can belong to only one entity");
//         }
//       }
//     }
//   }
// );
//
// // Associations
// // User.hasMany(Photo, { foreignKey: 'userId', as: 'photos', onDelete: 'CASCADE' });
// // Photo.belongsTo(User, { foreignKey: 'userId' });
// //
// // Room.hasMany(Photo, { foreignKey: 'roomId', as: 'images', onDelete: 'CASCADE' });
// // Photo.belongsTo(Room, { foreignKey: 'roomId' });
// //
// // Hotel.hasMany(Photo, { foreignKey: 'hotelId', as: 'images', onDelete: 'CASCADE' });
// // Photo.belongsTo(Hotel, { foreignKey: 'hotelId' });
//
// export default Photo;


// import {Model, DataTypes} from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Room from "./Room.js";
// import Hotels from "./Hotels.js";
//
// class Photo extends Model {
//   static associate() {
//     Photo.belongsTo(Room, {foreignKey: "room_id"});
//   }
// }
//
// Photo.init(
//   {
//     path: {type: DataTypes.STRING, allowNull: false},
//     roomId: {type: DataTypes.INTEGER, allowNull: true},
//     hotelId: {type: DataTypes.INTEGER, allowNull: true},
//     user_id: {type: DataTypes.INTEGER, allowNull: true,}
//
//   },
//   {
//     sequelize,
//     modelName: "Photo",
//     tableName: "photos",
//     underscored: true,
//     validate: {
//       onlyOneAssociation() {
//         const count = [this.room_id, this.hotel_id].filter(Boolean).length;
//         if (count > 1) throw new Error("Photo can belong to only one entity");
//       }
//     }
//   }
// );
//
// export default Photo;



import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";

class Photo extends Model {
  static associate() {
    Photo.belongsTo(Room, {
      foreignKey: "room_id",
      as: "room",
    });
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
