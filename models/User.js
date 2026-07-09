import {Model, DataTypes} from 'sequelize';
import crypto from 'crypto';
import sequelize from '../clients/db.sequelize.mysql.js';
import Room from "./Room.js";
import ReviewReplies from "./ReviewReplies.js";
import Favorite from "./Favorites.js";
import Hotels from "./Hotels.js";
import Reviews from "./Reviews.js";

class User extends Model {
  static associate(models) {

    User.hasMany(
      ReviewReplies,
      {
        foreignKey: "owner_id",
        as: "reviewReplies",
      });

    User.belongsToMany(Hotels, {
      through: Favorite,
      foreignKey: "user_id",
      otherKey: "hotel_id",
      as: "favoriteHotels",
    });

    User.hasMany(Hotels, {
      foreignKey: "user_id",
      as: "managedHotels",
      onDelete: "RESTRICT"
    });

    User.hasMany(Reviews, {
        foreignKey: 'user_id',
        as: 'reviews'
      }
    );

    User.hasMany(models.Post, { foreignKey: 'userId', as: 'posts' });

    User.hasMany(models.PostComment, { foreignKey: 'userId', as: 'comments' });

    User.hasMany(models.PostCommentReply, { foreignKey: 'userId', as: 'replies' });


    User.hasMany(models.CommentLike, { foreignKey: 'userId' });


    User.hasMany(models.PostTag, { foreignKey: 'taggedUserId', as: 'taggedInPosts' });

    User.belongsToMany(models.User, { through: models.Follower, as: 'followers', foreignKey: 'followingId', otherKey: 'followerId' });
    User.belongsToMany(models.User, { through: models.Follower, as: 'following', foreignKey: 'followerId', otherKey: 'followingId' });

    // // User <-> Story
    // User.hasMany(models.Story, { foreignKey: 'userId', as: 'stories' });
    //
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasMany(models.Notification, { foreignKey: 'senderId', as: 'sentNotifications' });

    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(models.Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
  }
}


User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    role: {
      type: DataTypes.ENUM(
        'user',
        'owner',
        'admin'
      ),
      allowNull: false,
      defaultValue: 'user'
    },

    userName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {len: [3, 100]}
    },

    bio: {
      type: DataTypes.STRING(150),
      allowNull: true
    },

    lastStoryTimestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },

    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'users_email_unique',
      validate: {isEmail: true},
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {len: [6, 255]}
    },

    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [5, 20]
      }
    },

    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },

    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Armenia",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    activationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },

    resetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    resetTokenExp: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate(user) {
        user.activationToken = crypto.randomUUID();
        user.isActive = false;
      }
    }
  }
);

export default User;


