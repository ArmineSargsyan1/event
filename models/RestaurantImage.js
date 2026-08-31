import { Model, DataTypes } from 'sequelize';
import sequelize from '../clients/db.sequelize.mysql.js';
import Restaurant from './Restaurant.js';

class RestaurantImage extends Model {
  static associate() {
    RestaurantImage.belongsTo(Restaurant, {
      foreignKey: 'restaurant_id',
      as: 'restaurant',
      onDelete: 'CASCADE'
    });
  }
}

RestaurantImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'image_url'
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'public_id'
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'restaurant_id'
    }
  },
  {
    sequelize,
    modelName: 'RestaurantImage',
    tableName: 'restaurant_images',
    underscored: true,
    timestamps: true
  }
);

export default RestaurantImage;
