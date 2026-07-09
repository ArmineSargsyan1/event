import { Model, DataTypes } from "sequelize";
import sequelize from '../clients/db.sequelize.mysql.js';
import Hotels from "./Hotels.js";

class LocationPoint extends Model {
  static associate() {
    LocationPoint.belongsTo(Hotels, {
      foreignKey: "hotelId",
      as: "hotel",
      onDelete: "CASCADE"
    });
  }
}

LocationPoint.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    distance: {
      type: DataTypes.STRING,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: "LocationPoint",
    tableName: "locationPoints",
    timestamps: false,
    underscored: true,
  }
);

export default LocationPoint;
