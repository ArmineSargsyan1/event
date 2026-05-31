// import Reviews from "../models/Reviews.js";
// import ReviewLiked from "../models/ReviewLiked.js";
//
// export const createReview = async (req, res) => {
//   try {
//     const {
//       reviewer_name,
//       score,
//       comment,
//       traveller_type,
//       stay_duration,
//       stay_date,
//       liked_features,
//       hotel_id,
//     } = req.body;
//
//     // const existing = await Reviews.findOne({
//     //   where: {
//     //     // hotel_id,
//     //     // user_id,
//     //   }
//     // });
//     //
//     // if (existing) {
//     //   return res.status(409).json({ message: "Already reviewed" });
//     // }
//
//     const review = await Reviews.create(
//       {
//         reviewer_name,
//         score,
//         comment,
//         traveller_type,
//         stay_duration,
//         stay_date,
//
//         // ❌ do NOT trust client:
//         verified: false,
//         hotel_id,
//
//         liked_features: Array.isArray(liked_features)
//           ? liked_features.map((f) => ({ feature: f }))
//           : [],
//       },
//       {
//         include: [
//           {
//             model: ReviewLiked,
//             as: "liked_features",
//           },
//         ],
//       }
//     );
//
//     return res.status(201).json({
//       success: true,
//       data: review,
//     });
//   } catch (error) {
//     console.error("Create review error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };





import Reviews from "../models/Reviews.js";
import ReviewLiked from "../models/ReviewLiked.js";
import { Op, fn, col } from "sequelize";
import User from "../models/User.js";
import ReviewReplies from "../models/ReviewReplies.js";
import Hotels from "../models/Hotels.js";

export const createReview = async (req, res) => {
  console.log(req.body,999)
  try {
    const {
      reviewer_name,
      score,
      comment,
      traveller_type,
      stay_duration,
      stay_date,
      liked_features,
      hotel_id ,
    } = req.body;


    const existing = await Reviews.findOne({
      where: {
        hotel_id,
        // user_id,
      }
    });

    console.log(existing,888)
    if (existing) {
      return res.status(409).json({ message: "Already reviewed" });
    }

    const review = await Reviews.create(
      {
        reviewer_name,
        score,
        comment,
        traveller_type,
        stay_duration,
        stay_date,

        // ❌ do NOT trust client:
        verified: false,
        hotel_id,

        liked_features: Array.isArray(liked_features)
          ? liked_features.map((f) => ({ feature: f }))
          : [],
      },
      {
        include: [
          {
            model: ReviewLiked,
            as: "liked_features",
          },
        ],
      }
    );

    return res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};






export const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      hotel_id,
      min_score,
      max_score,
      traveller_type,
      feature,
      sort,
      search,
      verified,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (hotel_id) where.hotel_id = hotel_id;

    if (min_score || max_score) {
      where.score = {};
      if (min_score) where.score[Op.gte] = Number(min_score);
      if (max_score) where.score[Op.lte] = Number(max_score);
    }

    if (traveller_type) where.traveller_type = traveller_type;

    if (verified === "true" || verified === "false") {
      where.verified = verified === "true";
    }

    if (search) {
      where[Op.or] = [
        { comment: { [Op.like]: `%${search}%` } },
        { reviewer_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const include = [
      {
        model: ReviewLiked,
        as: "liked_features",
      },
    ];

    if (feature) {
      include[0].where = { feature };
      include[0].required = true;
    }

    let order = [["created_at", "DESC"]];

    const sortMap = {
      score_desc: ["score", "DESC"],
      score_asc: ["score", "ASC"],
      oldest: ["created_at", "ASC"],
      newest: ["created_at", "DESC"],
    };

    if (sort && sortMap[sort]) {
      order = [sortMap[sort]];
    }

    const { rows, count } = await Reviews.findAndCountAll({
      where,
      include,
      limit: limitNum,
      offset,
      order,
      distinct: true,
    });

    return res.json({
      success: true,
      data: rows,
      pages: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / limitNum),
      }

    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getHotelReviews =
  async (req, res) => {

    try {

      const {
        hotel_id,
      } = req.params;

      const {

        page = 1,

        limit = 10,

        sort = "newest",

      } = req.query;

      // ======================
      // PAGINATION
      // ======================

      const pageNum =
        Number(page);

      const limitNum =
        Number(limit);

      const offset =
        (pageNum - 1) * limitNum;

      // ======================
      // SORT
      // ======================

      let order = [
        ["createdAt", "DESC"],
      ];

      if (sort === "oldest") {

        order = [
          ["createdAt", "ASC"],
        ];

      }

      if (sort === "score_high") {

        order = [
          ["score", "DESC"],
        ];

      }

      if (sort === "score_low") {

        order = [
          ["score", "ASC"],
        ];

      }

      // ======================
      // GET REVIEWS
      // ======================

      const {

        rows,

        count,

      } =
        await Reviews.findAndCountAll({

          where: {
            hotel_id,
          },

          limit: limitNum,

          offset,

          distinct: true,

          order,

          include: [

            {
              model: ReviewLiked,

              as: "liked_features",

              attributes: [
                "id",
                "feature",
              ],
            },

            {
              model:
              ReviewReplies,

              as: "replies",

              attributes: [

                "id",

                "reply",

                "owner_id",

                "is_edited",

                "createdAt",

              ],

              include: [

                {
                  model: User,

                  as: "owner",

                  attributes: [

                    "id",

                    "name",

                    "avatar",

                  ],
                },

              ],
            },

          ],

        });

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        data:
          rows.map(
            (review) => ({

              id:
              review.id,

              reviewer_name:
              review.reviewer_name,

              reviewer_image:
              review.reviewer_image,

              traveller_type:
              review.traveller_type,

              stay_duration:
              review.stay_duration,

              stay_date:
              review.stay_date,

              score:
                Number(
                  review.score
                ),

              comment:
              review.comment,

              verified:
              review.verified,

              createdAt:
              review.createdAt,

              likedFeatures:

                review
                  .liked_features
                  ?.map(
                    (item) =>
                      item.feature
                  ) || [],

              replies:

                review.replies?.map(
                  (reply) => ({

                    id:
                    reply.id,

                    reply:
                    reply.reply,

                    is_edited:
                    reply.is_edited,

                    createdAt:
                    reply.createdAt,

                    owner:
                    reply.owner,

                  })
                ) || [],

            })
          ),

        pagination: {

          total:
          count,

          page:
          pageNum,

          limit:
          limitNum,

          pages:

            Math.ceil(
              count / limitNum
            ),

        },

      });

    } catch (e) {

      console.log(
        "GET HOTEL REVIEWS ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch reviews",

      });

    }

  };



export const getTestimonials = async (req, res) => {
  try {
    const reviews = await Reviews.findAll({
      where: {
        verified: true,
        score: {
          [Op.gte]: 8,
        },
        comment: {
          [Op.ne]: null,
        },
      },

      include: [
        {
          model: Hotels,
          attributes: ["id", "name"],
        },
      ],

      attributes: [
        "id",
        "reviewer_name",
        "score",
        "comment",
        "review_date",
      ],

      order: [
        ["score", "DESC"],
        ["review_date", "DESC"],
      ],

      limit: 6,
    });

    res.json({
      success: true,
      data: reviews,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getRatingBreakdown = async (req, res) => {
  try {
    const { hotel_id } = req.query;
    if (!hotel_id) {
      return res.status(400).json({
        success: false,
        message: "hotel_id is required",
      });
    }

    const id = Number(hotel_id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel_id",
      });
    }

    const total = await Reviews.count({
      where: { hotel_id: id },
    });

    if (!total) {
      return res.json({
        success: true,
        total: 0,
        average: 0,
        breakdown: [],
      });
    }

    //breakdown by score
    const rows = await Reviews.findAll({
      where: { hotel_id: id },
      attributes: [
        "score",
        [fn("COUNT", col("score")), "count"],
      ],
      group: ["score"],
      raw: true,
    });

    //  format breakdown
    const breakdown = rows.map((r) => ({
      score: Number(r.score),
      count: Number(r.count),
      percent: Math.round((r.count / total) * 100),
    }));

    // ⭐ average rating
    const avg = await Reviews.findOne({
      where: { hotel_id: id },
      attributes: [[fn("AVG", col("score")), "avg"]],
      raw: true,
    });


    // const average = Math.round((Number(avg?.avg || 0)) * 10) / 10;
    const average = avg?.avg ? Number(avg.avg).toFixed(1) : "0.0";
    // console.log(average,777)
    // //  response
    return res.json({
      success: true,
      total,
      average,
      breakdown,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};























