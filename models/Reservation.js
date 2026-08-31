import sequelize from "../clients/db.sequelize.mysql.js";
import { Model, DataTypes } from "sequelize";
import Restaurant from "./Restaurant.js";
import User from "./User.js";
import Booking from "./Booking.js";

class Reservation extends Model {
  static associate() {
    Reservation.belongsTo(Restaurant, {
      foreignKey: "restaurant_id",
      as: "restaurant",
      onDelete: "CASCADE",
    });

    Reservation.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });

    Reservation.belongsTo(Booking, {
      foreignKey: "booking_id",
      as: "booking",
      onDelete: "SET NULL",
    });
  }
}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reservation_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    guests_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      defaultValue: "pending",
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Reservation",
    tableName: "reservations",
    timestamps: true,
    underscored: true,
  }
);

export default Reservation;
