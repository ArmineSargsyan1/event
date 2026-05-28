import { Model, DataTypes } from "sequelize";
import sequelize from '../clients/db.sequelize.mysql.js';
class POI extends Model {}

POI.init({
  gaia_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: DataTypes.STRING,
  full_name: DataTypes.STRING,
  lat: DataTypes.FLOAT,
  long: DataTypes.FLOAT,
  region_id: DataTypes.STRING
}, {
  sequelize,
  modelName: "POI",
  tableName: "pois",
  timestamps: false,
  underscored: true
});

export default POI;
