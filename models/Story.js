import { Model, DataTypes } from "sequelize";
import User from "./User.js";
import sequelize from "../clients/db.sequelize.mysql.js";
import StoryMention from "./StoryMention.js";
import StoryComment from "./StoryComment.js";
import StoryLike from "./StoryLike.js";
import StoryView from "./StoryView.js";



class Story extends Model {
  static associate(models) {
    Story.belongsTo(User, { foreignKey: 'userId', as: 'author' });
    Story.hasMany(StoryMention, { foreignKey: 'storyId', as: 'mentions', onDelete: 'CASCADE' });
    Story.hasMany(StoryComment, { foreignKey: 'storyId', as: 'comments', onDelete: 'CASCADE' });
    Story.hasMany(StoryLike, { foreignKey: 'storyId', as: 'likes', onDelete: 'CASCADE' });
    Story.hasMany(StoryView, { foreignKey: 'storyId', as: 'views', onDelete: 'CASCADE' });
    Story.hasMany(models.Message, { foreignKey: 'storyId', as: 'shares' });
  }
}

Story.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    defaultValue: 'image'
  },
  caption: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  locationName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  musicTrack: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Story',
  tableName: 'stories',
  timestamps: true,
  underscored: true,
});

export default Story;
