import {Model, DataTypes} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";

class Accessibility extends Model {
  static associate() {
    Accessibility.belongsTo(Hotels, { foreignKey: "hotel_id", onDelete: "CASCADE" });
  }
}

Accessibility.init(
  {
    feature: { type: DataTypes.STRING, allowNull: false }
  },
  {
    sequelize,
    modelName: "Accessibility",
    tableName: "accessibilities",
    timestamps: true,
    underscored: true
  }
);

export default Accessibility;
