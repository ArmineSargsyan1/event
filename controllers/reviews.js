import Reviews from "../models/Reviews.js";
import ReviewLiked from "../models/ReviewLiked.js";
import { Op, fn, col } from "sequelize";
import User from "../models/User.js";
import ReviewReplies from "../models/ReviewReplies.js";
import Hotels from "../models/Hotels.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import dayjs from "dayjs";
import sequelize from "../clients/db.sequelize.mysql.js";

// export const createReview = async (req, res) => {
//   console.log(req.body,999)
//   try {
//     const {
//       reviewer_name,
//       score,
//       comment,
//       traveller_type,
//       stay_duration,
//       stay_date,
//       liked_features,
//       hotel_id ,
//     } = req.body;
//
//
//     const existing = await Reviews.findOne({
//       where: {
//         hotel_id,
//         user_id,
//       }
//     });
//
//     console.log(existing,888)
//     if (existing) {
//       return res.status(409).json({ message: "Already reviewed" });
//     }
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



// export const createReview = async (req, res) => {
//   console.log("RECEIVED BODY:", req.body);
//
//   try {
//     const userId = req.userId || 1;
//
//     const {
//       score,
//       comment,
//       traveller_type,
//       rating_category,
//       liked_features,
//       hotel_id,
//       room_id,
//     } = req.body;
//
//
//     const today = new Date().toISOString().split('T')[0];
//
//     const validBooking = await Booking.findOne({
//       where: {
//         user_id: userId,
//         room_id: Number(room_id),
//         status: "confirmed",
//         check_out: { [Op.lte]: today }
//       },
//       include: [{
//         model: Room,
//         as: "room",
//         where: { hotel_id: Number(hotel_id) },
//         attributes: ["id", "hotel_id"]
//       }]
//     });
//
//     if (!validBooking) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. You can only review a property after your stay is completed."
//       });
//     }
//
//     const exactStayDate = dayjs(validBooking.check_in).format("YYYY-MM-DD");
//
//     const existingReview = await Reviews.findOne({
//       where: {
//         hotel_id: Number(hotel_id),
//         room_id: Number(room_id),
//         user_id: userId,
//         [Op.and]: [
//           sequelize.where(sequelize.fn('DATE', sequelize.col('stay_date')), exactStayDate)
//         ]
//       }
//     });
//
//     if (existingReview) {
//       return res.status(409).json({
//         success: false,
//         message: "You have already submitted a review for this specific booking stay."
//       });
//     }
//
//     const checkInDate = new Date(validBooking.check_in);
//     const checkOutDate = new Date(validBooking.check_out);
//     const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
//
//     const review = await Reviews.create(
//       {
//         score: Number(score),
//         comment,
//         traveller_type: traveller_type || "solo",
//         stay_duration: totalNights,
//         stay_date: exactStayDate,
//         rating_category,
//         verified: true,
//         user_id: userId,
//         hotel_id: Number(hotel_id),
//         room_id: Number(room_id),
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
//       message: "Review verified and created successfully!",
//       data: review,
//     });
//
//   } catch (error) {
//     console.error("Create review error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const createReview = async (req, res) => {
//   console.log("📥 RECEIVED BODY:", req.body);
//
//   try {
//     const userId = req.userId || 1; // 🔒 Օգտատիրոջ ID-ն Auth Token-ից
//     const { booking_id, score, comment, traveller_type, rating_category, liked_features } = req.body;
//
//     // ՔԱՅԼ 1: Փնտրում ենք հաստատված (confirmed) բուքինգ, որի check_out-ն անցել է
//     const today = dayjs().format("YYYY-MM-DD");
//
//     const validBooking = await Booking.findOne({
//       where: {
//         id: Number(booking_id),
//         user_id: userId,
//         status: "confirmed",
//         check_out: { [Op.lte]: today }
//       },
//       include: [{
//         model: Room,
//         as: "room",
//         attributes: ["id", "hotel_id"] // 🏢 Վերցնում ենք հյուրանոցի ID-ն սենյակից
//       }]
//     });
//
//     if (!validBooking) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Valid completed booking not found for this user."
//       });
//     }
//
//     // ՔԱՅԼ 2: Ավտոմատ տվյալների ստացում բուքինգից
//     const hotelId = validBooking.room?.hotel_id;
//     const roomId = validBooking.room_id; // ⚡ Կլինի կա՛մ թիվ, կա՛մ NULL (եթե սենյակ չկա)
//     const exactStayDate = dayjs(validBooking.check_in).format("YYYY-MM-DD");
//
//     // ՔԱՅԼ 3: Կրկնակի գրանցման արգելափակում (Timezone Safe)
//     const existingReview = await Reviews.findOne({
//       where: {
//         hotel_id: hotelId,
//         user_id: userId,
//         [Op.and]: [
//           sequelize.where(sequelize.fn('DATE', sequelize.col('stay_date')), exactStayDate)
//         ]
//       }
//     });
//
//     if (existingReview) {
//       return res.status(409).json({
//         success: false,
//         message: "You have already submitted a review for this specific booking stay."
//       });
//     }
//
//     // ՔԱՅԼ 4: Օրերի քանակի հաշվարկ
//     const checkInDate = new Date(validBooking.check_in);
//     const checkOutDate = new Date(validBooking.check_out);
//     const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
//
//     // ՔԱՅԼ 5: Ստեղծում ենք կարծիքը և դրա հետ միասին Liked Features-ը
//     const review = await Reviews.create(
//       {
//         score: Number(score),
//         comment,
//         traveller_type: traveller_type || "solo",
//         stay_duration: totalNights,
//         stay_date: exactStayDate,
//         rating_category,
//         verified: true,
//         user_id: userId,
//         hotel_id: hotelId,
//         room_id: roomId, // 🛏️ Եթե բուքինգում null էր, այստեղ էլ null կգրանցվի
//
//         liked_features: Array.isArray(liked_features)
//           ? liked_features.map((f) => ({ feature: f }))
//           : [],
//       },
//       {
//         include: [{ model: ReviewLiked, as: "liked_features" }],
//       }
//     );
//
//     return res.status(201).json({
//       success: true,
//       message: "Review verified and created successfully!",
//       data: review,
//     });
//
//   } catch (error) {
//     console.error("⛔ Create review error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const createReview = async (req, res) => {
  console.log("📥 RECEIVED BODY:", req.body);

  try {
    const userId = req.userId || 1;
    const { booking_id, room_id, score, comment, traveller_type, rating_category, liked_features } = req.body;

    // 1. Փնտրում ենք հաստատված ամրագրումը բազայից
    const today = dayjs().format("YYYY-MM-DD");
    const validBooking = await Booking.findOne({
      where: {
        id: Number(booking_id),
        user_id: userId,
        status: "confirmed",
        check_out: { [Op.lte]: today }
      },
      include: [{ model: Room, as: "room", attributes: ["id", "hotel_id"] }]
    });

    if (!validBooking) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Completed booking registry not found for this user."
      });
    }

    // Ավտոմատ կարդում ենք հյուրանոցի ID-ն և check_in օրը
    const hotelId = validBooking.room?.hotel_id;
    const exactStayDate = dayjs(validBooking.check_in).format("YYYY-MM-DD");

    // 2. ԴԻՆԱՄԻԿ ՍՏՈՒԳՈՒՄ (Կրկնակի գրանցման արգելափակում)
    const reviewWhere = {
      hotel_id: hotelId,
      user_id: userId,
      [Op.and]: [
        sequelize.where(sequelize.fn('DATE', sequelize.col('stay_date')), exactStayDate)
      ]
    };

    // 🎯 Եթե ֆրոնտենդն ուզում է գնահատել կոնկրետ սենյակը, կրկնությունը ստուգում ենք սենյակի մակարդակով
    if (room_id) {
      reviewWhere.room_id = Number(room_id);
    } else {
      reviewWhere.room_id = null; // Ստուգում ենք՝ արդյո՞ք արդեն ունի ընդհանուր հյուրանոցի կարծիք այս այցից
    }

    const existingReview = await Reviews.findOne({ where: reviewWhere });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review for this stay."
      });
    }

    // 3. Օրերի քանակի հաշվարկ
    const totalNights = dayjs(validBooking.check_out).diff(dayjs(validBooking.check_in), "day") || 1;

    // 4. ✨ ԳՐԱՆՑՈՒՄ ԲԱԶԱՅՈՒՄ (Հաշվի առնելով ձեր տրամաբանությունը)
    const review = await Reviews.create(
      {
        score: Number(score),
        comment,
        traveller_type: traveller_type || "solo",
        stay_duration: totalNights,
        stay_date: exactStayDate,
        rating_category,
        verified: true,
        user_id: userId,
        hotel_id: hotelId,

        // 🔥 ԱՄԵՆԱԿԱՐԵՎՈՐ ՏՈՂԸ: Եթե տրված է՝ կգրվի թիվ, եթե ոչ՝ NULL
        room_id: room_id ? Number(room_id) : null,

        liked_features: Array.isArray(liked_features)
          ? liked_features.map((f) => ({ feature: f }))
          : [],
      },
      { include: [{ model: ReviewLiked, as: "liked_features" }] }
    );

    return res.status(201).json({
      success: true,
      message: "Review verified and created successfully!",
      data: review,
    });

  } catch (error) {
    console.error("⛔ Create review error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      hotel_id,
      room_id,
      min_score,
      max_score,
      traveller_type,
      sort,
      search,
      feature,
    } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 5;
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (hotel_id && hotel_id !== "") {
      where.hotel_id = Number(hotel_id);
    }

    if (room_id && room_id !== "") {
      where.room_id = Number(room_id);
    }

    if (feature && feature.trim() !== "" && feature !== "All features") {
      where.rating_category = feature;
    }

    if (traveller_type && traveller_type.trim() !== "") {
      where.traveller_type = traveller_type;
    }

    if ((min_score && min_score !== "") || (max_score && max_score !== "")) {
      where.score = {};
      if (min_score && min_score !== "") where.score[Op.gte] = Number(min_score);
      if (max_score && max_score !== "") where.score[Op.lte] = Number(max_score);
    }

    if (search && search.trim() !== "") {
      where[Op.or] = [
        { comment: { [Op.like]: `%${search}%` } },
        { '$user.user_name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const include = [
      {
        model: User,
        as: "user",
        attributes: ["id", "userName", "profilePicture", "country"],
        required: false
      }
    ];

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
    console.error(err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// export const getReviews = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 5,
//       hotel_id,
//       min_score,
//       max_score,
//       traveller_type,
//       sort,
//       search,
//       feature,
//     } = req.query;
//
//     const pageNum = Number(page) || 1;
//     const limitNum = Number(limit) || 5;
//     const offset = (pageNum - 1) * limitNum;
//
//     const where = {};
//
//     if (hotel_id && hotel_id !== "") {
//       where.hotel_id = Number(hotel_id);
//     }
//
//     if (feature && feature.trim() !== "" && feature !== "All features") {
//       where.rating_category = feature;
//     }
//
//     if (traveller_type && traveller_type.trim() !== "") {
//       where.traveller_type = traveller_type;
//     }
//
//     if ((min_score && min_score !== "") || (max_score && max_score !== "")) {
//       where.score = {};
//       if (min_score && min_score !== "") where.score[Op.gte] = Number(min_score);
//       if (max_score && max_score !== "") where.score[Op.lte] = Number(max_score);
//     }
//
//     if (search && search.trim() !== "") {
//       where[Op.or] = [
//         { comment: { [Op.like]: `%${search}%` } },
//         { '$user.user_name$': { [Op.like]: `%${search}%` } }
//       ];
//     }
//
//     const include = [
//       {
//         model: User,
//         as: "user",
//         attributes: ["id", "userName", "profilePicture", "country"],
//         required: false
//       }
//     ];
//
//     let order = [["created_t", "DESC"]];
//     const sortMap = {
//       score_desc: ["score", "DESC"],
//       score_asc: ["score", "ASC"],
//       oldest: ["createdAt", "ASC"],
//       newest: ["createdAt", "DESC"],
//     };
//
//     if (sort && sortMap[sort]) {
//       order = [sortMap[sort]];
//     }
//
//     const { rows, count } = await Reviews.findAndCountAll({
//       where,
//       include,
//       limit: limitNum,
//       offset,
//       order,
//       distinct: true,
//     });
//
//     return res.json({
//       success: true,
//       data: rows,
//       pages: {
//         total: count,
//         page: pageNum,
//         pages: Math.ceil(count / limitNum),
//       }
//     });
//   } catch (err) {
//     console.error( err.message);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };


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
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" }
          ]
        },
      },

      include: [
        {
          model: Hotels,
          attributes: ["id", "name"],
        },

        {
          model: User,
          as: "user",
          attributes: ["id", "user_name", "email", "profile_picture"],
        }
      ],

      attributes: [
        "id",
        "score",
        "comment",
        "created_at",
      ],

      order: [
        ["score", "DESC"],
        ["created_at", "DESC"],
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


// export const getTestimonials = async (req, res) => {
//   try {
//     const reviews = await Reviews.findAll({
//       where: {
//         verified: true,
//         score: {
//           [Op.gte]: 8,
//         },
//         comment: {
//           [Op.ne]: null,
//         },
//       },
//
//       include: [
//         {
//           model: Hotels,
//           attributes: ["id", "name"],
//         },
//       ],
//
//       attributes: [
//         "id",
//         "reviewer_name",
//         "score",
//         "comment",
//         "review_date",
//       ],
//
//       order: [
//         ["score", "DESC"],
//         ["review_date", "DESC"],
//       ],
//
//       limit: 6,
//     });
//
//     res.json({
//       success: true,
//       data: reviews,
//     });
//
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

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























