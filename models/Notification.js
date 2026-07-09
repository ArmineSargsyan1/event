import { Model, DataTypes } from "sequelize";
import User from "./User.js";
import Post from "./Post.js";
import {PostComment} from "./index.js";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";


class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
    Notification.belongsTo(PostComment, { foreignKey: 'commentId', as: 'comment' });
    Notification.belongsTo(Hotels, { foreignKey: 'hotelId', as: 'hotel' });
  }
}

Notification.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true
});

export default Notification;
