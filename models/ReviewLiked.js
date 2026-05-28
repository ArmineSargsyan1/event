import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Reviews from "./Reviews.js";

class ReviewLiked extends Model {
  static associate() {
    ReviewLiked.belongsTo(Reviews, {
      foreignKey: "review_id",
      onDelete: "CASCADE",
    });
  }
}

ReviewLiked.init(
  {
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    feature: {
      type: DataTypes.ENUM(
        "cleanliness",
        "staff",
        "facilities",
        "location",
        "value"
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

// ReviewLiked.init(
//   {
//     review_id: { // ✅ սա պարտադիր է
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     feature: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     }
//   },
//   {
//     sequelize,
//     modelName: "ReviewLiked",
//     tableName: "review_liked",
//     timestamps: false,
//     underscored: true,
//   }
// );

export default ReviewLiked;
