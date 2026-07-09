import { Model, DataTypes } from 'sequelize';

import User from "./User.js";
import Story from "./Story.js";
import sequelize from "../clients/db.sequelize.mysql.js";

class StoryView extends Model {
  static associate() {
    StoryView.belongsTo(User, { as: 'viewer', foreignKey: 'userId' });

    StoryView.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
  }
}

StoryView.init({
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
  modelName: 'StoryView',
  tableName: 'story_view',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'storyId'],
    }
  ]
});

export default StoryView;
