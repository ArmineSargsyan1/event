import { Model, DataTypes, QueryTypes } from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Hotels from "./Hotels.js";
import ReviewLiked from "./ReviewLiked.js";
import ReviewReplies from "./ReviewReplies.js";
import User from "./User.js";
import Room from "./Room.js";

class Reviews extends Model {
  static associate() {
    Reviews.belongsTo(Hotels, {
      foreignKey: "hotel_id",
      onDelete: "CASCADE",
    });

    Reviews.hasMany(ReviewLiked, {
      foreignKey: "review_id",
      as: "liked_features",
      onDelete: "CASCADE",
    });

    Reviews.hasMany(
      ReviewReplies,
      {
        foreignKey: "review_id",
        as: "replies",
        onDelete: "CASCADE",
      }
    );

    Reviews.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Reviews.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });
  }
}



Reviews.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    score: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: { min: 0, max: 10 },
    },

    comment: DataTypes.TEXT,
    traveller_type: DataTypes.STRING,
    stay_duration: DataTypes.INTEGER,
    stay_date: DataTypes.DATE,

    rating_category: {
      type: DataTypes.ENUM("cleanliness", "staff", "facilities", "location", "value"),
      allowNull: false
    },

    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }

  },
  {
    sequelize,
    modelName: "Reviews",
    tableName: "reviews",
    timestamps: true,
    underscored: true,

  }



);


const recalcHotelRating = async (hotelId, transaction = null) => {
  const id = Number(hotelId);
  if (!Number.isInteger(id) || id <= 0) return;

  const result = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS review_count,
      COALESCE(SUM(CAST(score AS DECIMAL(10,2))), 0) AS rating_sum
    FROM reviews
    WHERE hotel_id = :hotelId
    `,
    {
      replacements: { hotelId: id },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  const row = result?.[0] ?? {};

  const review_count = Number(row.review_count || 0);
  const rating_sum = Number(row.rating_sum || 0);

  const rating =
    review_count > 0
      ? Number((rating_sum / review_count).toFixed(1))
      : 0;

  await Hotels.update(
    {
      review_count,
      rating_sum,
      rating,
    },
    {
      where: { id },
      transaction,
    }
  );
};


Reviews.afterCreate(async (review, options) => {
  await recalcHotelRating(
    review.hotel_id,
    options.transaction || null
  );
});

Reviews.afterDestroy(async (review, options) => {
  await recalcHotelRating(
    review.hotel_id,
    options.transaction || null
  );
});

Reviews.afterUpdate(async (review, options) => {
  const transaction = options.transaction || null;

  const changedFields = review.changed() || [];

  const scoreChanged = changedFields.includes("score");
  const hotelChanged = changedFields.includes("hotel_id");

  if (!scoreChanged && !hotelChanged) return;

  const prevHotelId = review.previous("hotel_id");
  const newHotelId = review.hotel_id;

  const affectedHotels = new Set();

  if (hotelChanged) {
    if (prevHotelId) affectedHotels.add(prevHotelId);
    if (newHotelId) affectedHotels.add(newHotelId);
  } else {
    if (newHotelId) affectedHotels.add(newHotelId);
  }

  await Promise.all(
    [...affectedHotels]
      .filter(Boolean)
      .map((hotelId) =>
        recalcHotelRating(hotelId, transaction)
      )
  );
});


Reviews.afterBulkDestroy(async (options) => {
  const hotelId = options.where?.hotel_id;
  if (hotelId) {
    await recalcHotelRating(hotelId, options.transaction || null);
  }
});

Reviews.afterBulkUpdate(async (options) => {
  const hotelId = options.where?.hotel_id;
  if (hotelId) {
    await recalcHotelRating(hotelId, options.transaction || null);
  }
});


export default Reviews;
