import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Reviews from "./Reviews.js";

class ReviewLiked extends Model {
  static associate() {
    ReviewLiked.belongsTo(Reviews, {
      foreignKey: "review_id",
      as: "review",
      onDelete: "CASCADE",
    });
  }
}

ReviewLiked.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "reviews",
        key: "id",
      },
    },

    feature: {
      type: DataTypes.ENUM(
        "Pool",
        "Cafe",
        "Restaurant",
        "Exterior",
        "Bathroom",
        "Bedrooms",
        "Kitchen",
        "Amenities"
      ),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ReviewLiked",
    tableName: "review_liked",
    timestamps: false,
    underscored: true,
  }
);

export default ReviewLiked;


