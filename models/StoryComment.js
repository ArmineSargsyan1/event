import { DataTypes, Model } from 'sequelize';

import User from "./User.js";
import Story from "./Story.js";
import sequelize from "../clients/db.sequelize.mysql.js";

class StoryComment extends Model {
  static associate(models) {
    StoryComment.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });

    StoryComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
  }
}

StoryComment.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stories',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'StoryComment',
  tableName: 'story_comments',
  timestamps: true
});

export default StoryComment;
