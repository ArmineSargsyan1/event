import sequelize from "../clients/db.sequelize.mysql.js";
import { Model, DataTypes } from "sequelize";
import User from "./User.js";
import Hotels from "./Hotels.js";
import Restaurant from "./Restaurant.js";

class SupportMessage extends Model {
  static associate() {
    SupportMessage.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

    SupportMessage.belongsTo(Hotels, { foreignKey: "hotel_id", as: "hotel" });

    SupportMessage.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });
  }
}

SupportMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "SupportMessage",
    tableName: "support_messages",
    timestamps: true,
    underscored: true,
  }
);

export default SupportMessage;
