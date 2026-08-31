import Joi from "joi";

export default {

  createReview: {
    body: Joi.object({
      booking_id: Joi.number().integer().positive().required(),

      room_id: Joi.number().integer().positive().allow(null).optional(),

      score: Joi.number().min(0).max(10).required(),
      rating_category: Joi.string()
        .valid("cleanliness", "staff", "facilities", "location", "value")
        .required(),
      comment: Joi.string().allow("").optional(),
      traveller_type: Joi.string().valid("solo", "couple", "family", "business").optional(),
      liked_features: Joi.array()
        .items(Joi.string().valid("Pool", "Cafe", "Restaurant", "Exterior", "Bathroom", "Bedrooms", "Kitchen", "Amenities"))
        .optional(),
    }),
  },


  // =========================
  // GET REVIEWS
  // =========================
  getReviews: {

    query: Joi.object({

      page: Joi.number()
        .integer()
        .min(1)
        .optional(),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional(),

      hotel_id: Joi.number()
        .integer()
        .positive()
        .optional(),

      min_score: Joi.number()
        .min(0)
        .max(10)
        .optional(),

      max_score: Joi.number()
        .min(0)
        .max(10)
        .optional(),

      traveller_type: Joi.string()
        .valid(
          "solo",
          "couple",
          "family",
          "friends",
          "business"
        )
        .optional(),

      feature: Joi.string()
        .valid(
          "cleanliness",
          "staff",
          "facilities",
          "location",
          "value"
        )
        .optional(),

      sort: Joi.string()
        .valid(
          "score_desc",
          "score_asc",
          "oldest",
          "newest"
        )
        .optional(),

      search: Joi.string()
        .allow("")
        .optional(),

      verified: Joi.boolean()
        .optional(),

    }),

  },

  // =========================
  // GET HOTEL REVIEWS
  // =========================
  getHotelReviews: {

    params: Joi.object({

      hotel_id: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

    query: Joi.object({

      page: Joi.number()
        .integer()
        .min(1)
        .optional(),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional(),

      sort: Joi.string()
        .valid(
          "newest",
          "oldest",
          "score_high",
          "score_low"
        )
        .optional(),

    }),

  },

  // =========================
  // GET RATING BREAKDOWN
  // =========================
  getRatingBreakdown: {

    query: Joi.object({

      hotel_id: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

  },


  // =========================
  // CREATE RESTAURANT REVIEW
  // =========================
  // =========================
  // CREATE RESTAURANT REVIEW
  // =========================
  createRestaurantReview: {
    body: Joi.object({
      // 💡 ՈՒՂՂՎԱԾ Է. Թույլ ենք տալիս string-ով եկած թիվը, որ FormData-ն չկոտրի վալիդացիան
      rating: Joi.alternatives().try(
        Joi.number().integer().min(1).max(5),
        Joi.string().valid("1", "2", "3", "4", "5")
      ).required().messages({
        'any.required': 'Rating is required.'
      }),

      comment: Joi.string().min(10).max(1000).required().messages({
        'string.empty': 'Write at least a few words about the restaurant.',
        'string.min': 'Review is too short (minimum 10 characters).'
      }),

      // 💡 ՈՒՂՂՎԱԾ Է. Թույլ ենք տալիս string կամ դատարկ, քանի որ FormData-ն դատարկ դաշտերը ուղարկում է որպես string
      bookingId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().allow('', null)
      ).optional()
    })
  }



};
