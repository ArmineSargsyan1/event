import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import User from "./User.js";
import Post from "./Post.js";

class PostLike extends Model {
  static associate(models) {
    PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
    PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}

PostLike.init({
  postId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: "PostLike",
  tableName: "post_likes",
  timestamps: true,
  updatedAt: false
});

export default PostLike;
