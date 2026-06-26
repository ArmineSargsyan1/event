// import { Model, DataTypes } from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
// import ReviewLiked from "./ReviewLiked.js";
//
// class Reviews extends Model {
//   static associate() {
//     Reviews.belongsTo(Hotels, { foreignKey: "hotel_id", onDelete: "CASCADE" });
//
//     Reviews.hasMany(ReviewLiked, {
//       foreignKey: "review_id",
//       as: "liked_features",
//     });
//   }
// }
//
// Reviews.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//
//     reviewer_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//
//     score: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//       validate: {
//         min: 0,
//         max: 10,
//       },
//     },
//
//     comment: {
//       type: DataTypes.TEXT,
//     },
//
//     traveller_type: {
//       type: DataTypes.STRING,
//     },
//
//     stay_duration: {
//       type: DataTypes.INTEGER,
//     },
//
//     stay_date: {
//       type: DataTypes.DATE,
//     },
//
//     review_date: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//
//     verified: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     hotel_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//   },
//
//   {
//     sequelize,
//     modelName: "Reviews",
//     tableName: "reviews",
//     timestamps: true,
//     underscored: true,
//   }
// );
//
// // CREATE
// Reviews.afterCreate(async (review, options) => {
//   const transaction = options.transaction;
//
//   // 1. increment counters
//   await Hotels.increment(
//     {
//       review_count: 1,
//       rating_sum: review.score,
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
//
//   // 2. update rating WITHOUT extra select (🔥 fastest way)
//   await Hotels.update(
//     {
//       rating: sequelize.literal(
//         "CASE WHEN review_count > 0 THEN rating_sum / review_count ELSE 0 END"
//       ),
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
// });
//
//
// // DELETE
// Reviews.afterDestroy(async (review, options) => {
//   const transaction = options.transaction;
//
//   await Hotels.decrement(
//     {
//       review_count: 1,
//       rating_sum: review.score,
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
//
//   await Hotels.update(
//     {
//       rating: sequelize.literal(
//         "CASE WHEN review_count > 0 THEN rating_sum / review_count ELSE 0 END"
//       ),
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
// });
//
//
// // UPDATE (when score changes)
// Reviews.afterUpdate(async (review, options) => {
//   const transaction = options.transaction;
//
//   // get previous score
//   const prevScore = review._previousDataValues.score;
//   const diff = review.score - prevScore;
//
//   await Hotels.increment(
//     {
//       rating_sum: diff,
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
//
//   await Hotels.update(
//     {
//       rating: sequelize.literal(
//         "CASE WHEN review_count > 0 THEN rating_sum / review_count ELSE 0 END"
//       ),
//     },
//     {
//       where: { id: review.hotel_id },
//       transaction,
//     }
//   );
// });
//
// export default Reviews;
//

//
//
// import { Model, DataTypes, QueryTypes } from "sequelize";
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "./Hotels.js";
// import ReviewLiked from "./ReviewLiked.js";
//
// class Reviews extends Model {
//   static associate() {
//     Reviews.belongsTo(Hotels, {
//       foreignKey: "hotel_id",
//       onDelete: "CASCADE",
//     });
//
//     Reviews.hasMany(ReviewLiked, {
//       foreignKey: "review_id",
//       as: "liked_features",
//       onDelete: "CASCADE",
//     });
//   }
// }
//
// Reviews.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//
//     reviewer_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//
//     score: {
//       type: DataTypes.DECIMAL(3, 2),
//       allowNull: false,
//       validate: { min: 0, max: 10 },
//     },
//
//     comment: DataTypes.TEXT,
//     traveller_type: DataTypes.STRING,
//     stay_duration: DataTypes.INTEGER,
//     stay_date: DataTypes.DATE,
//
//     review_date: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//
//     verified: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//
//     hotel_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//   },
//   {
//     sequelize,
//     modelName: "Reviews",
//     tableName: "reviews",
//     timestamps: true,
//     underscored: true,
//   }
// );
//
//
// const recalcHotelRating = async (hotelId, transaction = undefined) => {
//   if (!hotelId) return;
//
//   const result = await sequelize.query(
//     `
//     SELECT
//       COUNT(*) AS review_count,
//       COALESCE(SUM(score), 0) AS rating_sum
//     FROM reviews
//     WHERE hotel_id = :hotelId
//     `,
//     {
//       replacements: { hotelId },
//       type: QueryTypes.SELECT,
//       transaction,
//     }
//   );
//
//   const row = result?.[0] || {};
//
//   const review_count = Number(row.review_count || 0);
//   const rating_sum = Number(row.rating_sum || 0);
//
//   const rating =
//     review_count > 0 ? rating_sum / review_count : 0;
//
//   await Hotels.update(
//     {
//       review_count,
//       rating_sum,
//       rating,
//     },
//     {
//       where: { id: hotelId },
//       transaction,
//     }
//   );
// };
// Reviews.afterCreate(async (review, options) => {
//   await recalcHotelRating(
//     review.hotel_id,
//     options.transaction || null
//   );
// });
//
// Reviews.afterDestroy(async (review, options) => {
//   await recalcHotelRating(
//     review.hotel_id,
//     options.transaction || null
//   );
// });
//
// Reviews.afterUpdate(async (review, options) => {
//   const transaction = options.transaction ?? undefined;
//
//   const changedFields = review.changed() || [];
//
//   const scoreChanged = changedFields.includes("score");
//   const hotelChanged = changedFields.includes("hotel_id");
//
//   if (!scoreChanged && !hotelChanged) return;
//
//   const affected = new Set();
//
//   if (hotelChanged) {
//     affected.add(review.previous("hotel_id"));
//     affected.add(review.hotel_id);
//   } else {
//     affected.add(review.hotel_id);
//   }
//
//   await Promise.all(
//     [...affected]
//       .filter(Boolean)
//       .map((hotelId) =>
//         recalcHotelRating(hotelId, transaction)
//       )
//   );
// });
//
//
// export default Reviews;



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

//
// ==========================
// 🟢 AFTER CREATE
// ==========================
//
Reviews.afterCreate(async (review, options) => {
  await recalcHotelRating(
    review.hotel_id,
    options.transaction || null
  );
});

//
// ==========================
// 🔴 AFTER DESTROY
// ==========================
//
Reviews.afterDestroy(async (review, options) => {
  await recalcHotelRating(
    review.hotel_id,
    options.transaction || null
  );
});

//
// ==========================
// 🟡 AFTER UPDATE
// ==========================
//
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

// ==========================
// 🟡 AFTER BULK UPDATE
// ==========================
Reviews.afterBulkUpdate(async (options) => {
  const hotelId = options.where?.hotel_id;
  if (hotelId) {
    await recalcHotelRating(hotelId, options.transaction || null);
  }
});

// //
// // ==========================
// // 🔁 RECALC HOTEL RATING
// // ==========================
// //
// const recalcHotelRating = async (hotelId, transaction = null) => {
//   const id = Number(hotelId);
//   if (!Number.isInteger(id) || id <= 0) return;
//
//   const result = await sequelize.query(
//     `
//     SELECT
//       COUNT(*) AS review_count,
//       COALESCE(SUM(score), 0) AS rating_sum
//     FROM reviews
//     WHERE hotel_id = :hotelId
//     `,
//     {
//       replacements: { hotelId: id },
//       type: QueryTypes.SELECT,
//       transaction,
//     }
//   );
//
//   const row = result?.[0] ?? {};
//
//   const review_count = Number(row.review_count || 0);
//   const rating_sum = Number(row.rating_sum || 0);
//
//   const rating =
//     review_count > 0
//       ? Number((rating_sum / review_count).toFixed(2))
//       : 0;
//
//
//   await Hotels.update(
//     {
//       review_count,
//       rating_sum,
//       rating,
//     },
//     {
//       where: { id },
//       transaction,
//     }
//   );
// };
//
// //
// // ==========================
// // 🟢 AFTER CREATE
// // ==========================
// //
// Reviews.afterCreate(async (review, options) => {
//   await recalcHotelRating(review.hotel_id, options.transaction);
// });
//
// //
// // ==========================
// // 🔴 AFTER DESTROY
// // ==========================
// //
// Reviews.afterDestroy(async (review, options) => {
//   await recalcHotelRating(review.hotel_id, options.transaction);
// });
//
// //
// // ==========================
// // 🟡 AFTER UPDATE
// // ==========================
// //
// Reviews.afterUpdate(async (review, options) => {
//   const transaction = options.transaction;
//
//   const changedFields = review.changed() || [];
//
//   const scoreChanged = changedFields.includes("score");
//   const hotelChanged = changedFields.includes("hotel_id");
//
//   if (!scoreChanged && !hotelChanged) return;
//
//   const prevHotelId = review.previous("hotel_id");
//   const newHotelId = review.hotel_id;
//
//   const affectedHotels = new Set();
//
//   if (hotelChanged) {
//     if (prevHotelId) affectedHotels.add(prevHotelId);
//     if (newHotelId) affectedHotels.add(newHotelId);
//   } else {
//     if (newHotelId) affectedHotels.add(newHotelId);
//   }
//
//   await Promise.all(
//     [...affectedHotels]
//       .filter(Boolean)
//       .map((hotelId) =>
//         recalcHotelRating(hotelId, transaction)
//       )
//   );
// });

export default Reviews;
