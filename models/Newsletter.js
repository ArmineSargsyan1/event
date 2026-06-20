import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class Newsletter extends Model {}

Newsletter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    }
  },
  {
    sequelize,
    modelName: "Newsletter",
    tableName: "newsletters",
    timestamps: true
  }
);

export default Newsletter;
