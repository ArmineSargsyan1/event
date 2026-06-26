import sequelize from "../clients/db.sequelize.mysql.js";
import { Model, DataTypes } from "sequelize";
import Room from "./Room.js";
import Amenity from "./Amenity.js";
import Reviews from "./Reviews.js";
import LocationPoint from "./LocationPoint.js";
import HotelPhotos from "./HotelPhotos.js";
import HotelAmenities from "./HotelAmenity.js";
import Favorite from "./Favorites.js";
import User from "./User.js";

class Hotels extends Model {
  static associate() {
    Hotels.hasMany(Room, {
      foreignKey: "hotel_id",
      onDelete: "CASCADE",
    });

    Hotels.belongsToMany(Amenity, {
      through: HotelAmenities,
      foreignKey: "hotel_id",
      otherKey: "amenity_id",
    });


    Hotels.hasMany(Reviews, {
      foreignKey: "hotel_id",
      as: "Reviews",
      onDelete: "CASCADE",
    });



    Hotels.hasMany(LocationPoint, {
      foreignKey: "hotel_id",
      onDelete: "CASCADE",
    });

    Hotels.hasMany(HotelPhotos, {
      foreignKey: "hotel_id",
      as: "images",
      onDelete: "CASCADE",
    });

    Hotels.belongsToMany(User, {
      through: Favorite,
      foreignKey: "hotel_id",
      otherKey: "user_id",
      as: "usersWhoFavorited",
    });

    Hotels.belongsTo(User, {
      foreignKey: "user_id",
      as: "owner",
      onDelete: "RESTRICT"
    });
  }
}

Hotels.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    rating_sum: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    price_from: DataTypes.FLOAT,
    currency: DataTypes.STRING,

    property_class: {
      type: DataTypes.ENUM(
        "hotel",
        "apartment",
        "villa",
        "hostel",
        "resort"
      ),
      allowNull: false,
    },


    hotel_category: {
      type: DataTypes.ENUM(
        "luxury",
        "wellness",
        "family",
        "business",
        "romantic"
      ),

      allowNull: false,

      defaultValue: "business",
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    address: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,

    lat: DataTypes.FLOAT,
    lon: DataTypes.FLOAT,

    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    featured_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },


  },



  {
    sequelize,
    modelName: "Hotels",
    tableName: "hotels",
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    underscored: true,
    indexes: [
      { fields: ["city"] },
      { fields: ["property_class"] },
      { fields: ["lat", "lon"] },
      { fields: ["hotel_category"] },
      { fields: ["name"], unique: true },
    ],

    scopes: {
      withReviewStats: {
        attributes: {
          include: [
            [
              sequelize.literal(`(SELECT COUNT(*) FROM reviews WHERE reviews.hotel_id = Hotels.id)`),
              "dynamic_review_count"
            ],
            [
              sequelize.literal(`(SELECT COALESCE(ROUND(AVG(score), 2), 0) FROM reviews WHERE reviews.hotel_id = Hotels.id)`),
              "dynamic_rating"
            ],
          ],
        },
      },
    }
  }
);

export default Hotels;
