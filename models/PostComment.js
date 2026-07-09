import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import User from "./User.js";
import Post from "./Post.js";
import CommentLike from "./CommentLike.js";

class PostComment extends Model {
  static associate(models) {
    PostComment.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
    PostComment.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
    PostComment.hasMany(models.CommentLike, { foreignKey: 'commentId', as: 'likes', onDelete: 'CASCADE' });

    // ՈՒՂՂՎԱԾ Է ԱՅՍՏԵՂ. Կապում ենք նոր առանձին մոդելի հետ
    PostComment.hasMany(models.PostCommentReply, { foreignKey: 'commentId', as: 'replies', onDelete: 'CASCADE' });
  }
}

PostComment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'post_comments', key: 'id' }
  }
}, {
  sequelize,
  modelName: "PostComment",
  tableName: "post_comments",
  timestamps: true
});

export default PostComment;
