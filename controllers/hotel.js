import Hotels from "../models/Hotels.js";
import Amenity from "../models/Amenity.js";
import HotelPhotos from "../models/HotelPhotos.js";
import {Op, Sequelize} from "sequelize";
import Reviews from "../models/Reviews.js";
import HotelAmenities from "../models/HotelAmenity.js";
import FileHelper from "../services/Utils.js";
import Room from "../models/Room.js";
import Photo from "../models/Photo.js";
import RoomOption from "../models/RoomOption.js";
import RoomExtra from "../models/RoomExtra.js";
import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import ReviewLiked from "../models/ReviewLiked.js";
import User from "../models/User.js";
import Favorites from "../models/Favorites.js";

const allowedPropertyClasses = [
  "hotel",
  "apartment",
  "villa",
  "hostel",
  "resort",
];

const HOTEL_TYPE_RULES = {
  luxury: ["spa", "gym", "pool"],
  wellness: ["spa", "gym"],
  family: ["pool", "restaurant"],
};

// ======================
// HELPERS
// ======================

const getAmenityKeys = (hotel) =>
  (hotel.Amenities || []).map((a) => a.key);

const scoreHotelByType = (hotel, type) => {
  if (!type || !HOTEL_TYPE_RULES[type]) return 0;

  const rules = HOTEL_TYPE_RULES[type];
  const keys = getAmenityKeys(hotel);

  return rules.filter((r) => keys.includes(r)).length;
};


const getAvgRating = (hotel) => {
  if (!hotel.review_count || hotel.review_count === 0) {
    return null;
  }

  return hotel.rating_sum / hotel.review_count;
};

// const getAvgRating = (hotel) => {
//   return hotel.review_count > 0
//     ? hotel.rating_sum / hotel.review_count
//     : 0;
// };


const mapHotel = (hotel, userId = null) => {
  const plain = hotel.toJSON();

  const reviewCount = Number(plain.review_count || 0);

  const avgRating = plain.avg_rating !== undefined && plain.avg_rating !== null
    ? Number(Number(plain.avg_rating).toFixed(1))
    : null;

  return {
    id: plain.id,
    name: plain.name,
    city: plain.city,
    country: plain.country,
    description: plain.description,
    price: plain.price_from,

    rating: plain.rating,

    stars: plain.starsComputed,

    reviewCount,

    images: plain.images,

    amenities: plain.Amenities,

    favorite: plain.usersWhoFavorited?.length > 0,
  };
};


export const getHotels = async (req, res, next) => {
  try {

    const {
      page = 1,
      limit = 10,
      search,
      city,
      property_class,
      amenities,
      type,
      stars,
      guestRating,
      minRating,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const userId = 1;
    // const userId = req.user?.id;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // ======================
    // AMENITIES FILTER
    // ======================
    const parsedAmenities =
      amenities?.length > 0
        ? String(amenities)
          .split(",")
          .map(Number)
        : [];

    let hotelIds = null;

    if (parsedAmenities.length > 0) {

      const rows =
        await HotelAmenities.findAll({

          attributes: ["hotel_id"],

          where: {
            amenity_id: {
              [Op.in]: parsedAmenities,
            },
          },

          group: ["hotel_id"],

          having: Sequelize.literal(
            `COUNT(DISTINCT amenity_id) = ${parsedAmenities.length}`
          ),

        });

      hotelIds = rows.map(
        (r) => r.hotel_id
      );
    }

    // ======================
    // WHERE
    // ======================
    const where = {

      ...(hotelIds && {
        id: {
          [Op.in]: hotelIds,
        },
      }),

      ...(search && {
        name: {
          [Op.like]: `%${search}%`,
        },
      }),

      ...(city && {city}),

      ...(property_class &&
        allowedPropertyClasses.includes(
          property_class
        ) && {
          property_class,
        }),

      ...(type && {
        hotel_category: type,
      }),

      ...(minRating && {
        rating: {
          [Op.gte]: Number(minRating),
        },
      }),

      ...(minPrice || maxPrice) && {

        price_from: {
          ...(minPrice && {
            [Op.gte]: Number(minPrice),
          }),

          ...(maxPrice && {
            [Op.lte]: Number(maxPrice),
          }),

        },

      },

    };

    // ======================
    // GET HOTELS
    // ======================
    const {rows} =
      await Hotels.findAndCountAll({

        where,

        include: [

          {
            model: HotelPhotos,
            as: "images",
            attributes: [
              "id",
              "path",
              "is_main",
              "sort_order",
            ],
          },

          {
            model: Amenity,
            through: {
              attributes: [],
            },
          },

          //  Reviews
          {
            model: Reviews,
            as: "Reviews",
            attributes: [],
            required: false,
          },

          //  Favorites
          {
            model: User,
            as: "usersWhoFavorited",

            attributes: ["id"],

            through: {
              attributes: [],
            },

            where: userId
              ? {id: userId}
              : undefined,

            required: false,
          },

        ],

        attributes: {

          include: [

            //  Review count
            [
              Sequelize.fn(
                "COUNT",
                Sequelize.col("Reviews.id")
              ),
              "review_count",
            ],

          ],

        },

        group: [
          "Hotels.id",
          "images.id",
          "Amenities.id",
          "usersWhoFavorited.id",
        ],

        subQuery: false,

        distinct: true,

        order: [["rating", "DESC"]],

      });

    // ======================
    // ENRICH
    // ======================
    let enriched =
      rows.map((hotel) => {

        const plain = hotel.toJSON();

        const avgRating =
          plain.review_count > 0
            ? plain.rating_sum /
            plain.review_count
            : null;

        return {

          ...plain,

          avgRating,

          typeScore:
            scoreHotelByType(
              plain,
              type
            ),

          starsComputed:
            FileHelper.getHotelStars({

              ...plain,

              rating:
                avgRating ?? 0,

            }),

        };
      });

    // ======================
    // GUEST RATING FILTER
    // ======================
    if (guestRating) {

      const min =
        Number(guestRating);

      enriched =
        enriched.filter((h) => {

          return (
            h.avgRating !== null &&
            h.avgRating >= min
          );

        });
    }

    // ======================
    // STARS FILTER
    // ======================
    if (stars) {

      const starNum =
        Number(stars);

      enriched =
        enriched.filter((h) => {

          return (
            Math.floor(
              h.starsComputed
            ) === starNum
          );

        });
    }

    // ======================
    // SORT
    // ======================
    enriched.sort((a, b) => {

      if (sort === "low") {
        return (
          a.price_from -
          b.price_from
        );
      }

      if (sort === "high") {
        return (
          b.price_from -
          a.price_from
        );
      }

      if (type) {

        const diff =
          b.typeScore -
          a.typeScore;

        if (diff !== 0)
          return diff;
      }

      return (
        (b.avgRating || 0) -
        (a.avgRating || 0)
      );

    });

    // ======================
    // PAGINATION
    // ======================
    const offset =
      (pageNum - 1) * limitNum;

    const paginated =
      enriched.slice(
        offset,
        offset + limitNum
      );

    // ======================
    // CLEAN RESPONSE
    // ======================
    const cleanHotels =
      paginated.map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        description: hotel.description,
        price: hotel.price_from,
        rating: hotel.avgRating !== null
          ? Number(
            hotel.avgRating.toFixed(1)
          )
          : null,
        stars: hotel.starsComputed,
        reviewCount: Number(hotel.review_count),
        images: hotel.images,
        amenities: hotel.Amenities,
        property_class: hotel.property_class,
        currency: hotel.currency,
        lat: hotel.lat,
        lon: hotel.lon,
        favorite:
          hotel
            .usersWhoFavorited
            ?.length > 0,

      }));

    // ======================
    // FACETS
    // ======================
    const facets =
      await Amenity.findAll({

        attributes: [

          "id",
          "name",
          "category",

          [
            Sequelize.fn(
              "COUNT",
              Sequelize.col(
                "Hotels.id"
              )
            ),
            "count",
          ],

        ],

        include: [

          {
            model: Hotels,
            attributes: [],
            through: {
              attributes: [],
            },
          },

        ],

        group: ["Amenity.id"],

      });

    // ======================
    // RESPONSE
    // ======================

    res.status(200).json({
      status: "success",
      data: cleanHotels,
      facets,
      pagination: {
        total: enriched.length,
        page: pageNum,
        pages: Math.ceil(enriched.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};


const isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const conflict = await Booking.findOne({
    where: {
      room_id: roomId,
      status: "confirmed",
      [Op.or]: [
        {
          check_in: {[Op.lt]: checkOut},
          check_out: {[Op.gt]: checkIn},
        },
      ],
    },
  });

  return !conflict;
};


const calcRoomOptionPrice = (option, nights) => {
  const base = Number(option.price || 0);

  return {
    ...option,
    price_per_night: base,
    total_price: Number((base * nights).toFixed(2)),
  };
};


export const getTopRatedHotels = async (req, res) => {
  try {
    const userId = 1;

    const hotels = await Hotels.findAll({
      limit: 10,

      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main", "sort_order"],
        },
        {
          model: User,
          as: "usersWhoFavorited",
          where: {id: userId},
          attributes: ["id"],
          required: false,
          through: {attributes: []},
          duplicating: false
        }
      ],

      order: [["rating", "DESC"]],

      subQuery: false,
    });

    const data = hotels.map((h) => {
      const rawHotel = h.get({plain: true});
      const hotelData = mapHotel(h);

      const isFavorite = rawHotel.usersWhoFavorited && rawHotel.usersWhoFavorited.length > 0;

      return {
        ...hotelData,
        favorite: !!isFavorite,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (err) {
    console.error("Sequelize error details:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getPopularHotels = async (req, res) => {
  const userId = req.user?.id || 1;
  // req.userId
  try {
    const hotels = await Hotels.findAll({
      order: [["views", "DESC"]],
      limit: 10,
      subQuery: true,
      distinct: true,

      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main", "sort_order"],
        },
        {
          model: Amenity,
          through: {attributes: []},
        },
        {
          model: User,
          as: "usersWhoFavorited",
          attributes: ["id"],
          through: {attributes: []},
        },

      ],

    });

    const data = hotels.map((h) => {
      const base = mapHotel(h, userId);

      return {
        ...base,
        popular: h.popular
      };
    });

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// export const getPopularHotels = async (req, res) => {
//   const userId = req.user?.id || 1;
//   try {
//     const hotels = await Hotels.findAll({
//       order: [["views", "DESC"]],
//       limit: 10,
//
//       include: [
//         {
//           model: HotelPhotos,
//           as: "images",
//           attributes: ["id", "path", "is_main", "sort_order"],
//         },
//         {
//           model: Amenity,
//           through: { attributes: [] },
//         },
//         {
//           model: Reviews,
//           as: "Reviews",
//           attributes: [],
//           required: false,
//         },
//         {
//           model: User,
//           as: "usersWhoFavorited",
//           attributes: ["id"],
//           through: { attributes: [] },
//         },
//       ],
//
//       attributes: {
//         include: [
//           [
//             Sequelize.fn("COUNT", Sequelize.col("Reviews.id")),
//             "review_count",
//           ],
//         ],
//       },
//
//       group: [
//         "Hotels.id",
//         "images.id",
//         "Amenities.id",
//         "usersWhoFavorited.id",
//       ],
//
//       subQuery: false,
//     });
//
//     const data = hotels.map((h) => {
//       const base = mapHotel(h, userId);
//
//       return {
//         ...base,
//         popular: h.popular
//       };
//     });
//     console.log(data,88888)
//     res.json({
//       success: true,
//       data,
//     });
//
//
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export const getSponsoredHotels = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;

    const hotels = await Hotels.findAll({
      where: {
        featured: true,
        featured_until: {
          [Op.or]: [
            null,
            {[Op.gt]: new Date()},
          ],
        },
      },

      limit: 10,

      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main", "sort_order"],
        },
        {
          model: Amenity,
          through: {attributes: []},
        },
        {
          model: Reviews,
          as: "Reviews",
          attributes: [],
          required: false,
        },
        {
          model: User,
          as: "usersWhoFavorited",
          attributes: ["id"],
          through: {attributes: []},
          where: userId ? {id: userId} : undefined,
          required: false,
        },
      ],

      attributes: {
        include: [
          [
            Sequelize.fn("COUNT", Sequelize.col("Reviews.id")),
            "review_count",
          ],
        ],
      },

      group: [
        "Hotels.id",
        "images.id",
        "Amenities.id",
        "usersWhoFavorited.id",
      ],

      subQuery: false,
    });

    const data = hotels.map((h) => {
      const base = mapHotel(h, userId);

      return {
        ...base,

        featured: h.featured,
        featured_until: h.featured_until,
      };
    });


    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};


// export const getHotelById = async (req, res, next) => {
//   // const userId = req.body.userId
//   const userId = 1;
//   try {
//     const hotelId = Number(req.params.hotelId);
//
//     const {checkIn, checkOut} = req.query;
//
//     // ======================
//     // GET HOTEL (single query)
//     // ======================
//     const hotel = await Hotels.findByPk(hotelId, {
//       include: [
//         {model: HotelPhotos, as: "images"},
//         {model: Amenity, as: "Amenities", through: {attributes: []}},
//         {
//           model: Reviews,
//           as: "reviews",
//           include: [{model: ReviewLiked, as: "liked_features"}],
//         },
//         {
//           model: User,
//           as: "usersWhoFavorited",
//           attributes: ["id"],
//           through: {attributes: [],
//           },
//
//           where: userId
//             ? {id: userId}
//
//             : undefined,
//
//           required: false,
//         },
//       ],
//     });
//
//     // ======================
//     // NOT FOUND
//     // ======================
//     if (!hotel) {
//       return res.status(404).json({
//         success: false,
//         message: "Hotel not found",
//       });
//     }
//
//     // ======================
//     // SAFE INCREMENT
//     // ======================
//     await Hotels.increment(
//       {views: 1},
//       {where: {id: hotelId}}
//     );
//
//     // ======================
//     // NIGHTS
//     // ======================
//     const nights = checkIn && checkOut
//         ? dayjs(checkOut).diff(dayjs(checkIn), "day")
//         : 1;
//
//     const calculatedStars =FileHelper.getHotelStars(hotel);
//
//     const reviews = hotel.Reviews || [];
//
//
//
//     // ======================
//     // FEATURE COUNTS
//     // ======================
//     const featureCounts = {
//       cleanliness: 0,
//       staff: 0,
//       facilities: 0,
//       location: 0,
//       value_for_money: 0,
//     };
//
//     reviews.forEach((review) => {
//       (review.liked_features || []).forEach((item) => {
//         if (featureCounts[item.feature] !== undefined) {
//           featureCounts[item.feature]++;
//         }
//       });
//     });
//
//     const isFavorite = hotel.usersWhoFavorited && hotel.usersWhoFavorited.length > 0
//     // ======================
//     // RESPONSE
//     // ======================
//     return res.json({
//       success: true,
//       data: {
//         id: hotel.id,
//         name: hotel.name,
//         city: hotel.city,
//         country: hotel.country,
//         address: hotel.address,
//         description: hotel.description || "Welcome to our premium property.",
//
//         propertyClass: hotel.property_class,
//         hotelCategory: hotel.hotel_category,
//
//
//         lat: hotel.lat,
//         lon: hotel.lon,
//
//         views: hotel.views + 1,
//         priceFrom: hotel.price_from || 50,
//         currency: hotel.currency || "USD",
//         featured: hotel.featured,
//
//         images: hotel.images || [],
//         amenities: hotel.Amenities || [],
//         stars: calculatedStars,
//         isFavorite: isFavorite,
//         reviewStats: {
//           total: hotel.review_count || reviews.length,
//           avgScore: hotel.rating,
//           ...featureCounts,
//         },
//
//         nights,
//       },
//     });
//
//
//   } catch (e) {
//     next(e);
//   }
// };


export const getHotelById = async (req, res, next) => {
  const userId = 1; // Ժամանակավոր հաստատուն ID
  try {
    const hotelId = Number(req.params.hotelId);
    const { checkIn, checkOut } = req.query;

    // ==========================================================================
    // 🏨 GET HOTEL WITH SCOPE (ALL 10 DYNAMIC AGGREGATIONS ARE LOADED AUTOMATICALLY)
    // ==========================================================================
    const hotel = await Hotels.scope("withReviewStats").findByPk(hotelId, {
      include: [
        { model: HotelPhotos, as: "images" },
        { model: Amenity, as: "Amenities", through: { attributes: [] } },
        {
          model: User,
          as: "usersWhoFavorited",
          attributes: ["id"],
          through: { attributes: [] },
          where: userId ? { id: userId } : undefined,
          required: false,
        },
      ],
    });

    // If hotel not found
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    // Views increment
    await Hotels.increment({ views: 1 }, { where: { id: hotelId } });

    const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), "day") : 1;
    const calculatedStars = FileHelper.getHotelStars(hotel);
    const isFavorite = hotel.usersWhoFavorited && hotel.usersWhoFavorited.length > 0;

    // ==========================================================================
    // 🚀 RESPONSE)
    // ==========================================================================
    return res.json({
      success: true,
      data: {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        address: hotel.address,
        description: hotel.description || "Welcome to our premium property.",
        propertyClass: hotel.property_class,
        hotelCategory: hotel.hotel_category,
        lat: hotel.lat,
        lon: hotel.lon,
        views: (hotel.views || 0) + 1,
        priceFrom: hotel.price_from || 50,
        currency: hotel.currency || "USD",
        featured: hotel.featured,
        images: hotel.images || [],
        amenities: hotel.Amenities || [],
        stars: calculatedStars,
        isFavorite,

        reviewStats: {
          total: Number(hotel.getDataValue("dynamic_review_count") || 0),
          avgScore: Number(hotel.getDataValue("dynamic_rating") || 0),
          Pool: Number(hotel.getDataValue("Pool") || 0),
          Cafe: Number(hotel.getDataValue("Cafe") || 0),
          Restaurant: Number(hotel.getDataValue("Restaurant") || 0),
          Exterior: Number(hotel.getDataValue("Exterior") || 0),
          Bathroom: Number(hotel.getDataValue("Bathroom") || 0),
          Bedrooms: Number(hotel.getDataValue("Bedrooms") || 0),
          Kitchen: Number(hotel.getDataValue("Kitchen") || 0),
          Amenities: Number(hotel.getDataValue("Amenities") || 0)
        },
        nights,
      },
    });

  } catch (e) {
    console.error("CRITICAL ERROR IN getHotelById:", e.message);
    next(e);
  }
};


export const getHotelGallery = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { category } = req.query;

    const whereCondition = {hotel_id: hotelId};

    if (category) {
      whereCondition.category = category;
    }

    const photos = await HotelPhotos.findAll({
      where: whereCondition,
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'public_id', 'room_id', 'uploaded_by']
      },
      order: [["sort_order", "ASC"]],
    });

    return res.status(200).json({ success: true, data: photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



// export const getHotelGallery = async (req, res) => {
//   console.log(req,999999)
//   console.log(typeof (req.query)),88888
//   try {
//     const { hotelId, category } = req.query;
//
//     const whereCondition = { hotelId };
//
//     if (category && category !== "All") {
//       whereCondition.category = category;
//     }
//
//     const photos = await HotelPhotos.findAll({
//       where: whereCondition,
//       order: [["sort_order", "ASC"]],
//     });
//
//     return res.status(200).json({ success: true, data: photos });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// return res.json({
//   success: true,
//   data: {
//     id: hotel.id,
//     name: hotel.name,
//     city: hotel.city,
//     country: hotel.country,
//     stars: hotel.stars,
//     views: hotel.views + 1,
//
//     images: hotel.images || [],
//     amenities: hotel.Amenities || [],
//
//     reviewStats: {
//       total: reviews.length,
//       avgScore,
//       ...featureCounts,
//     },
//
//     nights,
//     featured
//   },
// });







