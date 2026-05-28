import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";

class HotelPhotos extends Model {
  static associate() {
    HotelPhotos.belongsTo(Hotels, {
      foreignKey: "hotel_id",
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

    path: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: true, // admin/user id
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
