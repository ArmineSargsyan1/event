import {DataTypes, Model} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";
import RoomOption from "./RoomOption.js";
import User from "./User.js";

class Booking extends Model {
  static associate() {

    Booking.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
    });

    Booking.belongsTo(Room, {
      foreignKey: "room_id",
      as: "room",
    });

    Booking.belongsTo(RoomOption, {
      foreignKey: "option_id",
      as: "option",
    });
  }
}


Booking.init(
  {
    // =========================
    // ID
    // =========================
    id: {

      type:
      DataTypes.INTEGER,

      autoIncrement: true,

      primaryKey: true,
    },

    // =========================
    // RELATIONS
    // =========================
    user_id: {

      type:
      DataTypes.INTEGER,

      allowNull: false,
    },

    customer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    customer_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    room_id: {

      type:
      DataTypes.INTEGER,

      allowNull: false,
    },

    option_id: {

      type:
      DataTypes.INTEGER,

      allowNull: false,
    },

    // =========================
    // BOOKING DATES
    // =========================
    check_in: {

      type:
      DataTypes.DATEONLY,

      allowNull: false,
    },

    check_out: {
      type: DataTypes.DATEONLY,

      allowNull: false,
    },

    // =========================
    // GUESTS
    // =========================
    guests: {

      type: DataTypes.INTEGER,

      defaultValue: 1,
    },

    // =========================
    // PRICE
    // =========================
    total_price: {

      type: DataTypes.FLOAT,
      allowNull: false,
    },

    refund_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    // =========================
    // BOOKING STATUS
    // =========================
    status: {

      type:
        DataTypes.ENUM("draft", "pending", "confirmed", "cancelled", "expired", "refunded"),

      defaultValue: "pending",
    },

    // =========================
    // PAYMENT STATUS
    // =========================
    payment_status: {

      type:
        DataTypes.ENUM(
          "pending", "paid", "failed", "refunded"
        ),
      defaultValue: "pending",
    },

    // =========================
    // STRIPE
    // =========================
    stripe_session_id: {

      type:
      DataTypes.STRING,

      allowNull: true,
    },

    paid_at: {

      type:
      DataTypes.DATE,

      allowNull: true,
    },

    // =========================
    // BOOKING EXPIRATION
    // =========================
    expires_at: {

      type:
      DataTypes.DATE,

      allowNull: true,
    },

    // =========================
    // LOCK TOKEN
    // =========================
    lock_token: {

      type:
      DataTypes.STRING,

      allowNull: true,
    },

    // =========================
    // CANCELLATION
    // =========================
    cancelled_at: {

      type:
      DataTypes.DATE,

      allowNull: true,
    },
  },

  {
    sequelize,

    modelName: "Booking",

    tableName: "bookings",

    underscored: true,
  }
);


export default Booking;
