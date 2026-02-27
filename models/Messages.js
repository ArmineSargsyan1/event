import { Model, DataTypes } from "sequelize";
import db from '../clients/db.sequelize.mysql.js';

class Messages extends Model {
  static async createDefaults() {
    return {};
  }
}

Messages.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  from: {
    type: DataTypes.BIGINT,
  },
  to: {
    type: DataTypes.BIGINT,
  },
  message: {
    type: DataTypes.TEXT,
  }
}, {
  sequelize: db,
  tableName: 'messages',
  modelName: 'messages',
});

export default Messages;




