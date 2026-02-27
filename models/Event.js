import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import User from "./User.js";


class Event extends Model {}

Event.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING
    }
  },
  {
    sequelize,
    modelName: "Event"
  }
);

User.hasMany(Event, { onDelete: "CASCADE" });
Event.belongsTo(User, { foreignKey: 'UserId' });


export default Event;









