import { Model, DataTypes } from "sequelize";

import User from "./User.js";
import Story from "./Story.js";
import sequelize from "../clients/db.sequelize.mysql.js";

class StoryMention extends Model {
  static associate(models) {

    StoryMention.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });

    StoryMention.belongsTo(User, { foreignKey: 'userId', as: 'taggedUser' });
  }
}

StoryMention.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "stories",
      key: "id",
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    }
  }
}, {
  sequelize,
  modelName: "StoryMention",
  tableName: "story_mentions",
  timestamps: true
});

export default StoryMention;
