import sequelize from "../clients/db.sequelize.mysql.js";
import { Model, DataTypes } from "sequelize";
import Hotels from "./Hotels.js";
import User from "./User.js";
import SupportMessage from "./SupportMessage.js";
import Reservation from "./Reservation.js";
import MenuItem from "./MenuItem.js";
import RestaurantImage from "./RestaurantImage.js";
import RestaurantReview from "./RestaurantReview.js";

class Restaurant extends Model {
  static associate(models) {
    Restaurant.belongsTo(Hotels, {
      foreignKey: "hotel_id",
      as: "hotel",
      onDelete: "CASCADE",
    });

    Restaurant.belongsTo(User, {
      foreignKey: "owner_id",
      as: "owner",
      onDelete: "RESTRICT",
    });

    Restaurant.hasMany(MenuItem, {
      foreignKey: "restaurant_id",
      as: "menuItems",
      onDelete: "CASCADE"
    });

    Restaurant.hasMany(RestaurantImage, {
      foreignKey: 'restaurant_id',
      as: 'images',
      onDelete: 'CASCADE'
    });

    Restaurant.hasMany(SupportMessage, {
      foreignKey: "restaurant_id",
      as: "supportMessages",
      onDelete: "CASCADE",
    });

    Restaurant.hasMany(Reservation, {
      foreignKey: "restaurant_id",
      as: "reservations",
      onDelete: "CASCADE",
    });

    Restaurant.hasMany(RestaurantReview, {
      foreignKey: "restaurant_id",
      as: "restaurantReviews",
      onDelete: "CASCADE",
    });

    Restaurant.hasMany(models.Post, {
      foreignKey: "restaurant_id",
      as: "visitorPosts",
      onDelete: "CASCADE",
    });

    Restaurant.hasMany(models.Order, {
      foreignKey: "restaurant_id",
      as: "Orders",
      onDelete: "CASCADE",
    });


  }
}

Restaurant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'hotel_id'
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    cuisineType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cuisine_type'
    },
    category: {
      type: DataTypes.ENUM("luxury", "family", "wellness", "business", 'romantic'),
      allowNull: false,
      defaultValue: "luxury",
      field: 'restaurant_category'
    },
    priceRange: {
      type: DataTypes.ENUM("$", "$$", "$$$", "$$$$"),
      allowNull: true,
      field: 'price_range'
    },
    phone: {
      type: DataTypes.STRING,
    },
    image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Yerevan'
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: { min: -90, max: 90 }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: { min: -180, max: 180 }
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Restaurant",
    tableName: "restaurants",
    timestamps: true,
    underscored: true,
  }
);

export default Restaurant;
