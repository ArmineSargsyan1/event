import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import User from "./User.js";
import Post from "./Post.js";

class PostTag extends Model {
  static associate(models) {
    PostTag.belongsTo(Post, { foreignKey: 'postId' });
    PostTag.belongsTo(User, { foreignKey: 'taggedUserId', as: 'user' });
  }
}

PostTag.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  x: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  y: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  taggedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PostTag',
  tableName: 'post_tags',
  timestamps: true
});

export default PostTag;
