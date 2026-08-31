import { Model, DataTypes } from 'sequelize';
import User from './User.js';
import Restaurant from './Restaurant.js';
import Reservation from './Reservation.js';
import sequelize from "../clients/db.sequelize.mysql.js";

class RestaurantReview extends Model {
  static associate() {
    RestaurantReview.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
    RestaurantReview.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant', onDelete: 'CASCADE' });
    RestaurantReview.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation', onDelete: 'CASCADE' });

  }
}

RestaurantReview.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sentiment: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'neutral'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'restaurant_id'
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reservation_id'
  }
}, {
  sequelize,
  modelName: 'RestaurantReview',
  tableName: 'restaurant_reviews',
  underscored: true,
  timestamps: true
});

export default RestaurantReview;
