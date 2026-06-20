import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class StripeEventLog extends Model {}

StripeEventLog.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: "stripe_event_log",
    timestamps: true,
  }
);

export default StripeEventLog;
