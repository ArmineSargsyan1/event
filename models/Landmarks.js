import sequelize from "../clients/db.sequelize.mysql.js";
import {DataTypes, Model} from "sequelize";

class Landmark extends Model {}

Landmark.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Landmark',
  tableName: 'landmarks',
  timestamps: false
});

export default Landmark
