import { Model, DataTypes } from 'sequelize';
import User from "./User.js";
import Post from "./Post.js";
import sequelize from "../clients/db.sequelize.mysql.js";

class Message extends Model {
  static associate(models) {
    Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

    Message.belongsTo(Post, { foreignKey: 'postId', as: 'postContext' });
    Message.belongsTo(Post, { foreignKey: 'sharedPostId', as: 'sharedPost' });

    Message.belongsTo(models.Story, { foreignKey: 'storyId', as: 'sharedStory' });

    Message.hasMany(Message, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
    Message.belongsTo(Message, { foreignKey: 'parentId', as: 'parentMessage' });
  }
}

Message.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedBySender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedByReceiver:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sharedPostId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'posts',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  underscored: true,
});

export default Message;
