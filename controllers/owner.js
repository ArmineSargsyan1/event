// ======================
// CONTROLLER
// ======================

import Users from "../models/User.js";
import {Op} from "sequelize";
import Messages from "../models/Messages.js";
import Socket from "../services/Socket.js";
import {ReviewLiked, ReviewReplies} from "../models/index.js";



export default {

  async createReviewReply(req, res, next) {
    try {

      const reviewId =
        req.params.id;

      const ownerId =
        req.user.id;

      const { reply } =
        req.body;

      // ======================
      // VALIDATION
      // ======================

      if (!reply?.trim()) {

        return res.status(400).json({

          success: false,

          message:
            "Reply is required",

        });

      }

      // ======================
      // REVIEW
      // ======================

      const review =
        await Reviews.findByPk(
          reviewId
        );

      if (!review) {

        return res.status(404).json({

          success: false,

          message:
            "Review not found",

        });

      }

      // ======================
      // HOTEL OWNER CHECK
      // ======================

      const hotel =
        await Hotels.findOne({

          where: {

            id: review.hotel_id,

            owner_id: ownerId,

          },

        });

      if (!hotel) {

        return res.status(403).json({

          success: false,

          message:
            "You do not own this hotel",

        });

      }

      // ======================
      // ONLY ONE REPLY
      // ======================

      const alreadyExists =
        await ReviewReplies.findOne({

          where: {

            review_id: reviewId,

          },

        });

      if (alreadyExists) {

        return res.status(400).json({

          success: false,

          message:
            "Reply already exists",

        });

      }

      // ======================
      // CREATE
      // ======================

      const createdReply =
        await ReviewReplies.create({

          review_id: reviewId,

          owner_id: ownerId,

          reply:
            reply.trim(),

        });

      // ======================
      // RESPONSE
      // ======================

      return res.status(201).json({

        success: true,

        message:
          "Reply created successfully",

        data:
        createdReply,

      });

    } catch (e) {

      console.log(
        "CREATE REVIEW REPLY ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to create review reply",

      });

    }
  },


  async getOwnerHotelReviews(req, res, next) {
    console.log(req.hotel_id,8)
    try {

      const {
        hotel_id,
      } = req.params;

      const {

        page = 1,

        limit = 10,

        search,

        min_score,

        max_score,

        verified,

        traveller_type,

        sort = "newest",

      } = req.query;

      // ======================
      // CHECK OWNER ACCESS
      // ======================

      const ownerHotel =
        await HotelOwners.findOne({

          where: {
            hotel_id,
            owner_id:
            req.user.id,
          },

        });

      if (!ownerHotel) {

        return res.status(403).json({

          success: false,

          message:
            "Access denied",

        });

      }

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
      // WHERE
      // ======================

      const where = {
        hotel_id,
      };

      // ======================
      // TRAVELLER TYPE
      // ======================

      if (traveller_type) {

        where.traveller_type =
          traveller_type;

      }

      // ======================
      // SCORE FILTER
      // ======================

      if (
        min_score ||
        max_score
      ) {

        where.score = {};

        if (min_score) {

          where.score[
            Op.gte
            ] = Number(min_score);

        }

        if (max_score) {

          where.score[
            Op.lte
            ] = Number(max_score);

        }

      }

      // ======================
      // VERIFIED FILTER
      // ======================

      if (
        verified === "true" ||
        verified === "false"
      ) {

        where.verified =
          verified === "true";

      }

      // ======================
      // SEARCH
      // ======================

      if (search) {

        where[Op.or] = [

          {
            reviewer_name: {
              [Op.like]:
                `%${search}%`,
            },
          },

          {
            comment: {
              [Op.like]:
                `%${search}%`,
            },
          },

        ];

      }

      // ======================
      // SORT
      // ======================

      let order = [
        ["createdAt", "DESC"],
      ];

      const sortMap = {

        newest: [
          "createdAt",
          "DESC",
        ],

        oldest: [
          "createdAt",
          "ASC",
        ],

        score_high: [
          "score",
          "DESC",
        ],

        score_low: [
          "score",
          "ASC",
        ],

      };

      if (
        sort &&
        sortMap[sort]
      ) {

        order = [
          sortMap[sort],
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

          where,

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
                  model: Users,

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
      // REVIEW INSIGHTS
      // ======================

      const averageScore =
        rows.length > 0
          ? Number(
            (
              rows.reduce(
                (sum, r) =>
                  sum +
                  Number(
                    r.score || 0
                  ),
                0
              ) / rows.length
            ).toFixed(1)
          )
          : 0;

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        insights: {

          totalReviews:
          count,

          averageScore,

        },

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
      next(e)
    }

  },




};

