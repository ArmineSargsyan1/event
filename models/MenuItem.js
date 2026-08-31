import { Model, DataTypes } from 'sequelize';
import sequelize from '../clients/db.sequelize.mysql.js';

class MenuItem extends Model {
  static associate(models) {
    MenuItem.belongsTo(models.Restaurant, { foreignKey: 'restaurant_id', onDelete: 'CASCADE' });
    MenuItem.belongsTo(models.Dish, {
      foreignKey: 'dish_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

MenuItem.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurantId: { type: DataTypes.INTEGER, allowNull: false, field: 'restaurant_id' },
  dishId: { type: DataTypes.INTEGER, allowNull: false, field: 'dish_id' },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  customImage: { type: DataTypes.STRING(1000), allowNull: true, field: 'custom_image' }
}, {
  sequelize,
  modelName: "MenuItem",
  tableName: "menu_items",
  underscored: true
});

export default MenuItem;
