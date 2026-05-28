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

    // 🏷 plan name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // 💰 base price per night
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    // 🍽 meal plan
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

    // 💳 cancellation type
    cancellation_type: {
      type: DataTypes.ENUM(
        "free",
        "partial",
        "non_refundable"
      ),
      defaultValue: "free",
    },


    // ⏳ how many days before check-in can cancel free
    free_cancel_days: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    // 🕒 cutoff time (e.g. 23:59)
    cancel_time: {
      type: DataTypes.STRING,
      defaultValue: "23:59",
    },

    // 📅 season pricing
    season_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    season_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // 📈 price modifier (% or fixed adjustment)
    price_modifier: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    // 💳 pay rules
    pay_later: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    prepayment_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // 📦 active/inactive plan
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



// {
//   title: {
//     type: DataTypes.STRING, // "Free cancellation + Breakfast"
//     allowNull: false,
//   },
//
//   // 💰 final price (NOT modifier)
//   price: {
//     type: DataTypes.FLOAT,
//     allowNull: false,
//   },
//
//   // 🍽
//   meal_plan: {
//     type: DataTypes.ENUM(
//       "none",
//       "breakfast",
//       "half_board",
//       "full_board",
//       "all_inclusive"
//     ),
//     defaultValue: "none",
//   },
//
//   // 💳
//   free_cancellation: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//
//   pay_later: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//
//   // 🕒 optional
//   cancellation_deadline: DataTypes.DATE,
//
//   cancellation_type: {
//     type: DataTypes.ENUM("free", "partial", "non_refundable"),
//     defaultValue: "free",
//   },
//
//   free_cancel_days: {
//     type: DataTypes.INTEGER, // օրինակ՝ 1 → 1 օր առաջ
//     defaultValue: 1,
//   },
//
//   cancel_time: {
//     type: DataTypes.STRING, // "23:59"
//     defaultValue: "23:59",
//   },
//
// },


// RoomOption.init(
//   {
//     type: {
//       type: DataTypes.STRING,
//       allowNull: false, // refundable / non-refundable
//     },
//     priceModifier: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//       defaultValue: 0,
//     },
//   },
//   {
//     sequelize,
//     modelName: "RoomOption",
//     tableName: "roomOptions",
//     underscored: true
//   }
// );
