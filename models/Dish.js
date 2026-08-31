import { Model, DataTypes } from 'sequelize';
import sequelize from '../clients/db.sequelize.mysql.js';

class Dish extends Model {
  static associate(models) {
    Dish.hasMany(models.MenuItem, {
      foreignKey: 'dish_id',
      as: 'menuItems'
    });
  }
}

Dish.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false,},
  category: {
    type: DataTypes.ENUM("breakfast", "appetizer", "soup", "salad", "main", "dessert", "drink"),
    allowNull: false
  },
  defaultImage: { type: DataTypes.STRING(1000), field: 'default_image' }
}, {
  sequelize,
  modelName: "Dish",
  tableName: "dishes",
  underscored: true
});

export default Dish;
