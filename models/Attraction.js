import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class Attraction extends Model {
  static associate(models) {
  }
}

Attraction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    category: {
      type: DataTypes.ENUM(
        "historical",
        "monastery",
        "nature",
        "mountain",
        "lake",
        "waterfall",
        "fortress",
        "cave",
        "museum",
        "viewpoint",
        "church",
      ),
      allowNull: false,
    },

    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },

    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },

    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 4.5,
      validate: {
        min: 0,
        max: 5
      }
    },

    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },


  },
  {
    sequelize,
    modelName: "Attraction",
    tableName: "attractions",
    underscored: true,
    timestamps: true,
  }
);

export default Attraction;
