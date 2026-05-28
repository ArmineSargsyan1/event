import {Model, DataTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Regions from "./Regions.js";

class Neighborhoods extends Model {
}

Neighborhoods.init({
    gaia_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: DataTypes.STRING,
    fullName: DataTypes.STRING,
    lat: DataTypes.FLOAT,
    long: DataTypes.FLOAT,
    region_id: {
      type: DataTypes.STRING,
      references: {
        model: Regions,
        key: "gaia_id"
      }
    },

    distance_km: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "Neighborhoods",
    tableName: "neighborhoods",
    timestamps: false,
    underscored: true,
  });

// Associations
Regions.hasMany(Neighborhoods, {foreignKey: "region_id"});
Neighborhoods.belongsTo(Regions, {foreignKey: "region_id"});

export default Neighborhoods;
