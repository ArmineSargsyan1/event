import { Model, DataTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";

class ReviewReplies extends Model {
  static associate(models) {

    // review
    ReviewReplies.belongsTo(
      models.Reviews,
      {
        foreignKey: "review_id",
        as: "review",
        onDelete: "CASCADE",
      }
    );

    // owner user
    ReviewReplies.belongsTo(
      models.User,
      {
        foreignKey: "owner_id",
        as: "owner",
        onDelete: "CASCADE",
      }
    );
  }
}

ReviewReplies.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,

      references: {
        model: "reviews",
        key: "id",
      },
    },

    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,

      references: {
        model: "users",
        key: "id",
      },
    },

    reply: {
      type: DataTypes.TEXT,
      allowNull: false,

      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },

    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,

    modelName: "ReviewReplies",

    tableName: "review_replies",

    timestamps: true,

    underscored: true,
  }
);

export default ReviewReplies;
