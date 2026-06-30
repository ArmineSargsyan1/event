import Joi from "joi";

export default {

  // =========================
  // GET HOTELS
  // =========================
  getHotels: {

    query: Joi.object({

      // SEARCH
      search: Joi.string()
        .allow("")
        .optional(),

      city: Joi.string()
        .allow("")
        .optional(),

      // RATING
      minRating: Joi.number()
        .min(0)
        .max(10)
        .optional(),

      guestRating: Joi.number()
        .min(0)
        .max(10)
        .optional(),

      // PROPERTY
      property_class: Joi.string()
        .valid(
          "hotel",
          "apartment",
          "villa",
          "hostel",
          "resort"
        )
        .allow("")
        .optional(),

      // CATEGORY
      type: Joi.string()
        .valid(
          "luxury",
          "wellness",
          "family",
          "business",
          "romantic"
        )
        .allow("")
        .optional(),

      // STARS
      stars: Joi.number()
        .valid(1, 2, 3, 4, 5)
        .optional(),

      // SORT
      sort: Joi.string()
        .valid(
          "low",
          "high",
          "rating"
        )
        .allow("")
        .optional(),

      // PRICE
      minPrice: Joi.number()
        .min(0)
        .optional(),

      maxPrice: Joi.number()
        .min(0)
        .optional(),

      // AMENITIES
      amenities: Joi.alternatives().try(

        Joi.array().items(
          Joi.number().integer()
        ),

        Joi.string()

      ).optional(),

      // BOOKING
      checkIn: Joi.date()
        .iso()
        .optional(),

      checkOut: Joi.date()
        .iso()
        .optional(),


      guests: Joi.number()
        .integer()
        .min(1)
        .optional(),

      // PAGINATION
      page: Joi.number()
        .integer()
        .min(1)
        .optional(),

      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional(),

    }),

  },

  // =========================
  // GET SINGLE HOTEL
  // =========================
  getSingleHotel: {

    params: Joi.object({

      hotelId: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

    query: Joi.object({

      checkIn: Joi.date()
        .iso()
        .allow("")
        .optional(),

      checkOut: Joi.date()
        .iso()
        .allow("")
        .optional(),

      guests: Joi.number()
        .integer()
        .min(1)
        .optional(),

    }),

  },

  // =========================
  // CREATE HOTEL
  // =========================
  createHotel: {

    body: Joi.object({

      name: Joi.string()
        .min(2)
        .max(255)
        .required(),

      description: Joi.string()
        .allow("")
        .optional(),

      property_class: Joi.string()
        .valid(
          "hotel",
          "apartment",
          "villa",
          "hostel",
          "resort"
        )
        .required(),

      hotel_category: Joi.string()
        .valid(
          "luxury",
          "wellness",
          "family",
          "business",
          "romantic"
        )
        .required(),

      address: Joi.string()
        .min(2)
        .max(255)
        .required(),

      city: Joi.string()
        .min(2)
        .max(100)
        .required(),

      country: Joi.string()
        .min(2)
        .max(100)
        .required(),

      lat: Joi.number()
        .min(-90)
        .max(90)
        .required(),

      lon: Joi.number()
        .min(-180)
        .max(180)
        .required(),

      price_from: Joi.number()
        .min(1)
        .required(),

      currency: Joi.string()
        .max(10)
        .optional(),

    }),

  },



  getHotelGallery: {
    params: Joi.object({
      hotelId: Joi.number().integer().positive().required()
    }),

    query: Joi.object({
      category: Joi.string()
        .valid("Pool", "Cafe", "Restaurant", "Exterior", "Bathroom", "Bedrooms", "Kitchen", "Amenities")
        .optional()
    })
  },


  // =========================
  // UPDATE HOTEL
  // =========================
  updateHotel: {

    params: Joi.object({

      hotelId: Joi.number()
        .integer()
        .positive()
        .required(),

    }),

    body: Joi.object({

      name: Joi.string()
        .min(2)
        .max(255),

      description: Joi.string()
        .allow(""),

      property_class: Joi.string()
        .valid(
          "hotel",
          "apartment",
          "villa",
          "hostel",
          "resort"
        ),

      hotel_category: Joi.string()
        .valid(
          "luxury",
          "wellness",
          "family",
          "business",
          "romantic"
        ),

      address: Joi.string()
        .min(2)
        .max(255),

      city: Joi.string()
        .min(2)
        .max(100),

      country: Joi.string()
        .min(2)
        .max(100),

      lat: Joi.number()
        .min(-90)
        .max(90),

      lon: Joi.number()
        .min(-180)
        .max(180),

      price_from: Joi.number()
        .min(0),

      currency: Joi.string()
        .valid(
          "USD",
          "EUR",
          "GBP",
          "AMD",
          "RUB"
        ),

      amenities: Joi.array().items(
        Joi.number().integer()
      ),

    }),

  },

};
