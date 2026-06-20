import { DataTypes, Model } from "sequelize";
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
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    customer_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    option_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    check_in: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    check_out: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    guests: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    refund_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "confirmed",
        "cancelled",
        "expired",
        "refunded"
      ),
      defaultValue: "pending",
    },

    payment_status: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "failed",
        "refunded"
      ),
      defaultValue: "pending",
    },

    stripe_session_id: {
      type: DataTypes.STRING,
    },

    paid_at: {
      type: DataTypes.DATE,
    },

    expires_at: {
      type: DataTypes.DATE,
    },

    lock_token: {
      type: DataTypes.STRING,
    },

    cancelled_at: {
      type: DataTypes.DATE,
    },

    // 🔐 SUCCESS PAGE SECURITY
    success_token: {
      type: DataTypes.STRING,
    },

    success_token_expires: {
      type: DataTypes.DATE,
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
