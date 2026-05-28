import {Model, DataTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Regions from "./Regions.js";

class Airports extends Model {
}

Airports.init({
  airport_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  code: DataTypes.STRING,
  name: DataTypes.STRING,
  lat: DataTypes.FLOAT,
  long: DataTypes.FLOAT,
  region_id: {
    type: DataTypes.STRING,
    references: {
      model: Regions, // or "regions" as table name
      key: "gaia_id"
    }
  }
}, {
  sequelize,
  modelName: "Airport",
  tableName: "airports",
  timestamps: false,
  underscored: true,
});

// Associations
Regions.hasMany(Airports, {foreignKey: "region_id"});
Airports.belongsTo(Regions, {foreignKey: "region_id"});

export default Airports;
