import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class BookingExtra extends Model {
  static associate() {
    BookingExtra.belongsTo(sequelize.models.Booking, {
      foreignKey: "booking_id",
      as: "booking",
      onDelete: "CASCADE",
    });
  }
}

BookingExtra.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    extra_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "BookingExtra",
    tableName: "booking_extras",
    underscored: true,
  }
);

export default BookingExtra;
