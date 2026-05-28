import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class Regions extends Model {}

// Initialize the model
Regions.init({
  gaia_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: DataTypes.STRING,
  fullName: DataTypes.STRING,
  type: DataTypes.STRING,
  country: DataTypes.STRING,        // ISO2 (CZ)
  country_iso3: DataTypes.STRING,   // ISO3 (CZE)
  country_name: DataTypes.STRING,   // Chequia
  lat: DataTypes.FLOAT,
  long: DataTypes.FLOAT,
}, {
  sequelize,
  modelName: "Regions",
  tableName: "regions",
  timestamps: false,
  underscored: true,
});

export default Regions;
