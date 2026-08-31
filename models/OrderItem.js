import { Model, DataTypes } from 'sequelize';
import sequelize from '../clients/db.sequelize.mysql.js';
import MenuItem from './MenuItem.js';

class OrderItem extends Model {
  static associate(models) {
    OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
    OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', onDelete: 'RESTRICT' });
  }
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id'
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'menu_item_id'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
    timestamps: true,
    underscored: true,
  }
);

export default OrderItem;
