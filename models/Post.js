import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

import User from "./User.js";
import PostTag from "./PostTag.js";
import PostComment from "./PostComment.js";
import PostLike from "./PostLike.js";

class Post extends Model {
  static associate(models) {
    Post.belongsTo(User, { as: 'author', foreignKey: 'userId' });

    Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
    Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
    Post.hasMany(PostTag, { foreignKey: 'postId', as: 'tags', onDelete: 'CASCADE' });

    Post.hasMany(models.Message, { foreignKey: 'sharedPostId', as: 'shares' });
    Post.hasMany(models.Message, { foreignKey: 'postId' });
  }
}

Post.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  mediaUrl: { type: DataTypes.STRING, allowNull: false },
  mediaType: { type: DataTypes.ENUM('image', 'video'), defaultValue: 'image' },
  caption: { type: DataTypes.TEXT, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  commentsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  musicTrack: { type: DataTypes.JSON, allowNull: true }
}, {
  sequelize,
  modelName: "Post",
  tableName: "posts",
  timestamps: true
});

export default Post;
