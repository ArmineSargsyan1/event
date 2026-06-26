import Joi from "joi";

export default {

  // =========================
  // CREATE ROOM
  // =========================
  createRoom: {

    body: Joi.object({

      hotel_id: Joi.number()
        .integer()
        .positive()
        .required(),

      name: Joi.string()
        .min(2)
        .max(255)
        .required(),

      size: Joi.number()
        .min(1)
        .optional(),

      bed_type: Joi.string()
        .allow("")
        .optional(),

      max_guests: Joi.number()
        .integer()
        .min(1)
        .required(),

      status: Joi.string()
        .valid(
          "active",
          "inactive",
          "archived"
        )
        .optional(),

      // amenities ids
      amenities: Joi.alternatives().try(

        Joi.array().items(
          Joi.number()
            .integer()
            .positive()
        ),

        Joi.string()
      ),

      // room options
      options: Joi.array().items(

        Joi.object({

          name: Joi.string()
            .required(),

          price: Joi.number()
            .min(0)
            .required(),

          meal_plan: Joi.string()
            .valid(
              "none",
              "breakfast",
              "half_board",
              "full_board",
              "all_inclusive"
            )
            .optional(),

          cancellation_type:
            Joi.string()
              .valid(
                "free",
                "partial",
                "non_refundable"
              )
              .optional(),

          free_cancel_days:
            Joi.number()
              .integer()
              .min(0)
              .optional(),

          cancel_time:
            Joi.string()
              .optional(),

          season_start:
            Joi.date()
              .iso()
              .allow(null),

          season_end:
            Joi.date()
              .iso()
              .allow(null),

          price_modifier:
            Joi.number()
              .optional(),

          pay_later:
            Joi.boolean()
              .optional(),

          prepayment_required:
            Joi.boolean()
              .optional(),

          status:
            Joi.string()
              .valid(
                "active",
                "inactive"
              )
              .optional(),

        })

      ),

      // extras
      extras: Joi.array().items(

        Joi.object({

          name: Joi.string()
            .required(),

          price: Joi.number()
            .min(0)
            .optional(),

          type: Joi.string()
            .valid(
              "service",
              "food",
              "comfort"
            )
            .optional(),

        })

      ),

    }),

  },

  // =========================
  // UPDATE ROOM
  // =========================
  updateRoom: {

    params: Joi.object({

      id: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

    body: Joi.object({

      hotel_id: Joi.number()
        .integer()
        .positive(),

      name: Joi.string()
        .min(2)
        .max(255),

      size: Joi.number()
        .min(1),

      bed_type: Joi.string()
        .allow(""),

      max_guests: Joi.number()
        .integer()
        .min(1),

      status: Joi.string()
        .valid(
          "active",
          "inactive",
          "archived"
        ),

      amenities: Joi.alternatives().try(

        Joi.array().items(
          Joi.number()
            .integer()
            .positive()
        ),

        Joi.string()
      ),

      options: Joi.array().items(

        Joi.object({

          id: Joi.number()
            .integer()
            .positive(),

          name: Joi.string(),

          price: Joi.number()
            .min(0),

          meal_plan: Joi.string()
            .valid(
              "none",
              "breakfast",
              "half_board",
              "full_board",
              "all_inclusive"
            ),

          cancellation_type:
            Joi.string()
              .valid(
                "free",
                "partial",
                "non_refundable"
              ),

          free_cancel_days:
            Joi.number()
              .integer()
              .min(0),

          cancel_time:
            Joi.string(),

          season_start:
            Joi.date()
              .iso()
              .allow(null),

          season_end:
            Joi.date()
              .iso()
              .allow(null),

          price_modifier:
            Joi.number(),

          pay_later:
            Joi.boolean(),

          prepayment_required:
            Joi.boolean(),

          status:
            Joi.string()
              .valid(
                "active",
                "inactive"
              ),

        })

      ),

      extras: Joi.array().items(

        Joi.object({

          id: Joi.number()
            .integer()
            .positive(),

          name: Joi.string(),

          price: Joi.number()
            .min(0),

          type: Joi.string()
            .valid(
              "service",
              "food",
              "comfort"
            ),

        })

      ),

    }),

  },

  // =========================
  // GET ROOM BY ID
  // =========================
  getRoomById: {

    params: Joi.object({

      id: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

  },

  // =========================
  // GET ROOMS
  // =========================
  getRooms: {

    query: Joi.object({

      hotel_id: Joi.number()
        .integer()
        .positive(),

      city: Joi.string()
        .allow(""),

      search: Joi.string()
        .allow(""),

      status: Joi.string()
        .valid(
          "active",
          "inactive",
          "archived"
        ),

      minPrice: Joi.number()
        .min(0),

      maxPrice: Joi.number()
        .min(0),

      guests: Joi.number()
        .integer()
        .min(1),

      amenities: Joi.alternatives().try(

        Joi.array().items(
          Joi.number()
            .integer()
        ),

        Joi.string()
      ),

      checkIn: Joi.date()
        .iso()
        .allow(""),

      checkOut: Joi.date()
        .iso()
        .allow(""),

      page: Joi.number()
        .integer()
        .min(1),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(100),

    }),

  },


  uploadRoomImagesSchema:{
    category: Joi.string().valid("Pool", "Cafe", "Restaurant", "Exterior", "Bathroom", "Bedrooms", "Kitchen", "Amenities").optional(),
    photos: Joi.any().optional()
  }

};
