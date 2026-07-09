import {Model, DataTypes} from 'sequelize';
import sequelize from "../clients/db.sequelize.mysql.js";
import User from "./User.js";

class Follower extends Model {
  static associate(models) {
    Follower.belongsTo(User, { foreignKey: 'followerId', as: 'followerUser' });
    Follower.belongsTo(User, { foreignKey: 'followingId', as: 'followingUser' });
  }
}

Follower.init({
  id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  followerId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: 'id',
    },
    onDelete: "CASCADE",
  },
  followingId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: 'id',
    }
  }
},{
  sequelize,
  modelName: "Follower",
  tableName: "followers",
  timestamps: true,
})
export default Follower;
