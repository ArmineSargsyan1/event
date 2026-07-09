import {Model, DataTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "./Room.js";


class RoomOption extends Model {
  static associate() {
    RoomOption.belongsTo(Room, {
      foreignKey: "room_id",
      onDelete: "CASCADE",
    });
  }
}


RoomOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // plan name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },


    meal_plan: {
      type: DataTypes.ENUM(
        "none",
        "breakfast",
        "half_board",
        "full_board",
        "all_inclusive"
      ),
      defaultValue: "none",
    },

    cancellation_type: {
      type: DataTypes.ENUM(
        "free",
        "partial",
        "non_refundable"
      ),
      defaultValue: "free",
    },


    free_cancel_days: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    cancel_time: {
      type: DataTypes.STRING,
      defaultValue: "23:59",
    },

    season_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    season_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    price_modifier: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    discount_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    discount_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    pay_later: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    prepayment_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },


  {
    sequelize,
    modelName: "RoomOption",
    tableName: "room_options",
    underscored: true,
  }
);


export default RoomOption;


