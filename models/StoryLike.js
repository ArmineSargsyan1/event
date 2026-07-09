import { Model, DataTypes } from 'sequelize';

import User from "./User.js";
import Story from "./Story.js";
import sequelize from "../clients/db.sequelize.mysql.js";

class StoryLike extends Model {
  static associate() {

    StoryLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    StoryLike.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
  }
}

StoryLike.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stories',
      key: 'id',
    }
  },
}, {
  sequelize,
  modelName: 'StoryLike',
  tableName: 'story_like',
  timestamps: true,
});

export default StoryLike;
