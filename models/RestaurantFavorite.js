import sequelize from "../clients/db.sequelize.mysql.js";
import { Model, DataTypes } from "sequelize";
import Restaurant from "./Restaurant.js";
import User from "./User.js";

class RestaurantFavorite extends Model {
  static associate() {
    RestaurantFavorite.belongsTo(Restaurant, {
      foreignKey: "restaurant_id",
      as: "restaurant",
      onDelete: "CASCADE",
    });

    RestaurantFavorite.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  }
}

RestaurantFavorite.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RestaurantFavorite",
    tableName: "restaurant_favorites",
    timestamps: true,
    underscored: true,
  }
);

export default RestaurantFavorite;
