import { Model, DataTypes } from 'sequelize';
import sequelize from "../clients/db.sequelize.mysql.js";

class PostCommentReply extends Model {
  static associate(models) {
    PostCommentReply.belongsTo(models.PostComment, { foreignKey: 'commentId', as: 'parentComment', onDelete: 'CASCADE' });
    PostCommentReply.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });

    PostCommentReply.hasMany(models.CommentLike, { foreignKey: 'commentId', as: 'likes', onDelete: 'CASCADE' });
  }
}

PostCommentReply.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PostCommentReply',
  tableName: 'post_comment_replies'
});

export default PostCommentReply;
