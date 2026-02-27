import { Model, DataTypes } from 'sequelize';
import crypto from 'crypto';
import sequelize from '../clients/db.sequelize.mysql.js';

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userName: { type: DataTypes.STRING(100), allowNull: false, validate: { len: [3, 100] } },

    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },

    password: { type: DataTypes.STRING(255), allowNull: false, validate: { len: [6, 255] } },

    profilePicture: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },

    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },

    activationToken: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },

    resetToken: { type: DataTypes.STRING(255), allowNull: true },

    resetTokenExp: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      async beforeCreate(user) {
        user.activationToken = crypto.randomUUID();
        user.isActive = false;
      },
    },
  }
);



export default User;
