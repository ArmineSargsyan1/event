import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class UserEvents extends Model {}

UserEvents.init(
  {
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    EventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Events', key: 'id' },
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    modelName: 'UserEvents',
    timestamps: true
  }
);

export default UserEvents;
