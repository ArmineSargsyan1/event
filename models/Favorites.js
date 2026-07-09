import {DataTypes, Model} from "sequelize";

import sequelize from "../clients/db.sequelize.mysql.js";

import User from "./User.js";
import Hotels from "./Hotels.js";

class Favorite extends Model {

  static associate() {

    Favorite.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
    });

    Favorite.belongsTo(Hotels, {
      foreignKey: "hotel_id",
      as: "hotel",
    });

  }

}

Favorite.init(
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

    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

  },
  {
    sequelize,
    modelName: "Favorite",
    tableName: "favorites",
    timestamps: true,
  }
);

export default Favorite;
