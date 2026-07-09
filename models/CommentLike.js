import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import PostComment from "./PostComment.js";
import User from "./User.js";
import PostCommentReply from "./PostCommentReply.js";

class CommentLike extends Model {
  static associate(models) {
    CommentLike.belongsTo(PostComment, { foreignKey: 'commentId', constraints: false, as: 'comment' });

    CommentLike.belongsTo(PostCommentReply, { foreignKey: 'commentId', constraints: false,  as: 'reply' });

    CommentLike.belongsTo(User, { as: 'author', foreignKey: 'userId' });
  }
}

CommentLike.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  commentId: { type: DataTypes.UUID, allowNull: false },
  commentType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'COMMENT'
  }
}, {
  sequelize,
  modelName: "CommentLike",
  tableName: "comment_like",
  timestamps: true,
  updatedAt: false
});

export default CommentLike;
