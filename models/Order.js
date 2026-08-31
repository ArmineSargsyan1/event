import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class Order extends Model {
  static associate(models) {
    Order.belongsTo(models.Booking, { foreignKey: "booking_id", onDelete: "SET NULL" });
    Order.belongsTo(models.User, { foreignKey: "user_id", as: "user", onDelete: "SET NULL" });
    Order.belongsTo(models.Restaurant, { foreignKey: "restaurant_id", as: "restaurant", onDelete: "CASCADE" });
  }
}

Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'restaurant_id'
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },

    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'booking_id'
    },

    deliveryAddress: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      field: 'delivery_address'
    },

    status: { type: DataTypes.ENUM("pending", "paid", "cancelled"), defaultValue: "pending" },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stripe_session_id: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "Order", tableName: "orders", timestamps: true, underscored: true }
);

export default Order;
