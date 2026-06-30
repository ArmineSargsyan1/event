import Hotels from "../models/Hotels.js";
import Amenity from "../models/Amenity.js";
import HotelPhotos from "../models/HotelPhotos.js";
import {Op, QueryTypes, Sequelize} from "sequelize";
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
import sequelize from "../clients/db.sequelize.mysql.js";

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

  const avgRating = Number(plain.dynamic_rating || 0);

  return {
    id: plain.id,
    name: plain.name,
    city: plain.city,
    country: plain.country,
    description: plain.description,
    price: plain.price_from,
    rating: avgRating,
    reviewCount: Number(plain.dynamic_review_count || 0),
    stars: plain.starsComputed,
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
      minRating, // 👈 Պահված է Ձեր հին դաշտը
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const userId = 1;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // ==========================================
    // 🏊‍♂️ 1. AMENITIES FILTER (ՊԱՀՎԱԾ Է ԱՆՓՈՓՈԽ)
    // ==========================================
    const parsedAmenities = amenities?.length > 0
      ? String(amenities).split(",").map(Number)
      : [];

    let hotelIds = null;

    if (parsedAmenities.length > 0) {
      const rows = await HotelAmenities.findAll({
        attributes: ["hotel_id"],
        where: { amenity_id: { [Op.in]: parsedAmenities } },
        group: ["hotel_id"],
        having: Sequelize.literal(`COUNT(DISTINCT amenity_id) = ${parsedAmenities.length}`),
      });
      hotelIds = rows.map((r) => r.hotel_id);
    }

    // ==========================================
    // 🔍 2. WHERE CLAUSE (ԲՈԼՈՐ ՖԻԼՏՐԵՐԸ ՊԱՀՎԱԾ ԵՆ)
    // ==========================================
    const allowedPropertyClasses = ["hotel", "apartment", "resort", "villa"]; // 👈 Ձեր ստուգումը

    const where = {
      ...(hotelIds && { id: { [Op.in]: hotelIds } }),
      ...(search && { name: { [Op.like]: `%${search}%` } }),
      ...(city && { city }),
      ...(property_class && allowedPropertyClasses.includes(property_class) && { property_class }),
      ...(type && { hotel_category: type }),

      // Ձեր հին minRating ֆիլտրը, եթե այն գնում է ուղիղ բազա
      ...(minRating && { rating: { [Op.gte]: Number(minRating) } }),

      // 💲 Ձեր Գնային ֆիլտրերը (Price Filters)
      ...((minPrice || maxPrice) && {
        price_from: {
          ...(minPrice && { [Op.gte]: Number(minPrice) }),
          ...(maxPrice && { [Op.lte]: Number(maxPrice) }),
        },
      }),
    };

    // ==========================================
    // 🏨 3. GET HOTELS (with Review Stats Scope)
    // ==========================================
    const hotels = await Hotels.scope("withReviewStats").findAll({
      where,
      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main", "sort_order"] // 👈 Ձեր հին ատրիբուտները
        },
        {
          model: Amenity,
          as: "Amenities", // Համոզվեք, որ համապատասխանում է Ձեր model-ի association-ին
          through: { attributes: [] }
        }
      ],
      subQuery: false,
    });

    // ==========================================
    // ❤️ 4. FAVORITES CHECK
    // ==========================================
    let userFavorites = [];
    if (userId) {
      const favs = await Favorites.findAll({ where: { user_id: userId }, attributes: ["hotel_id"] });
      userFavorites = favs.map(f => f.hotel_id);
    }

    // ==========================================
    // 💬 5. REVIEW LIKED FEATURES BULK FETCH
    // ==========================================
    const hotelReviewStatsMap = {};

    if (hotels.length > 0) {
      const activeHotelIds = hotels.map(h => h.id);

      const featuresResult = await sequelize.query(
        `
        SELECT r.hotel_id, rl.feature, COUNT(*) AS count 
        FROM review_liked rl
        INNER JOIN reviews r ON rl.review_id = r.id
        WHERE r.hotel_id IN (:activeHotelIds)
        GROUP BY r.hotel_id, rl.feature
        `,
        { replacements: { activeHotelIds }, type: QueryTypes.SELECT }
      );

      featuresResult.forEach(row => {
        if (!hotelReviewStatsMap[row.hotel_id]) {
          hotelReviewStatsMap[row.hotel_id] = { Pool: 0, Cafe: 0, Restaurant: 0, Exterior: 0, Bathroom: 0, Bedrooms: 0, Kitchen: 0, Amenities: 0 };
        }
        if (hotelReviewStatsMap[row.hotel_id][row.feature] !== undefined) {
          hotelReviewStatsMap[row.hotel_id][row.feature] = Number(row.count);
        }
      });
    }

    // ==========================================
    // ✨ 6. ENRICH (Հարստացում ճիշտ տվյալներով)
    // ==========================================
    let enriched = hotels.map((hotel) => {
      const avgScore = Number(hotel.getDataValue("dynamic_rating") || 0);
      const totalReviews = Number(hotel.getDataValue("dynamic_review_count") || 0);
      const calculatedStars = FileHelper.getHotelStars(hotel);

      const featureCounts = hotelReviewStatsMap[hotel.id] || { Pool: 0, Cafe: 0, Restaurant: 0, Exterior: 0, Bathroom: 0, Bedrooms: 0, Kitchen: 0, Amenities: 0 };

      return {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        address: hotel.address,
        description: hotel.description || "Welcome to our premium property.",
        property_class: hotel.property_class,
        hotelCategory: hotel.hotel_category,
        lat: hotel.lat,
        lon: hotel.lon,
        views: hotel.views || 0,
        price_from: hotel.price_from || 50, // 👈 Պահված է Ձեր հին անունը
        currency: hotel.currency || "USD",
        featured: hotel.featured,
        images: hotel.images || [],
        Amenities: hotel.Amenities || [], // 👈 Պահված է Ձեր հին անունը
        starsComputed: calculatedStars, // 👈 Պահված է Ձեր հին անունը
        review_count: totalReviews, // 👈 Պահված է Ձեր հին անունը
        rating_sum: hotel.rating_sum,
        usersWhoFavorited: userFavorites.includes(hotel.id) ? [{ id: userId }] : [], // 👈 Պահված է Ձեր հին կառուցվածքը

        // 🎯 ԱՎԵԼԱՑՐԻՆՔ ԼՐԱՑՈՒՑԻՉ. Ճիշտ ReviewStats` ինչպես getHotelById-ում է
        reviewStats: {
          total: totalReviews,
          avgScore: Number(avgScore.toFixed(1)),
          ...featureCounts
        },
        typeScore: scoreHotelByType ? scoreHotelByType(hotel.toJSON(), type) : 0
      };
    });

    // ==========================================
    // 🎛️ 7. GUEST RATING & STARS FILTERS (ՊԱՀՎԱԾ ԵՆ)
    // ==========================================
    if (guestRating) {
      const min = Number(guestRating);
      enriched = enriched.filter((h) => h.reviewStats.avgScore >= min);
    }

    if (stars) {
      const starNum = Number(stars);
      enriched = enriched.filter((h) => Math.floor(h.starsComputed) === starNum);
    }

    // ==========================================
    // 🔃 8. SORTING (ՊԱՀՎԱԾ Է ՁԵՐ ՈՃՈՎ)
    // ==========================================
    enriched.sort((a, b) => {
      if (sort === "low") return a.price_from - b.price_from;
      if (sort === "high") return b.price_from - a.price_from;

      if (type) {
        const diff = b.typeScore - a.typeScore;
        if (diff !== 0) return diff;
      }
      return b.reviewStats.avgScore - a.reviewStats.avgScore;
    });

    // ==========================================
    // 🔢 9. PAGINATION (ՊԱՀՎԱԾ Է)
    // ==========================================
    const offset = (pageNum - 1) * limitNum;
    const paginated = enriched.slice(offset, offset + limitNum);

    // ==========================================
    // 🗄️ 10. CLEAN RESPONSE (Մաքուր Ձեր Ֆրոնտի տեսքով)
    // ==========================================
    const cleanHotels = paginated.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      description: hotel.description,
      price: hotel.price_from, // 👈 Ձեր ֆրոնտի սպասած "price" դաշտը
      rating: hotel.reviewStats.avgScore > 0 ? hotel.reviewStats.avgScore : null,
      stars: hotel.starsComputed,
      reviewCount: Number(hotel.review_count),
      images: hotel.images,
      amenities: hotel.Amenities,
      property_class: hotel.property_class,
      currency: hotel.currency,
      lat: hotel.lat,
      lon: hotel.lon,
      favorite: hotel.usersWhoFavorited?.length > 0,

      // 🚀 ԼՐԱՑՈՒՑԻՉ. Միացրինք նաև նոր reviewStats-ը
      reviewStats: hotel.reviewStats
    }));

    // ==========================================
    // 🗄️ 11. FACETS (ՊԱՀՎԱԾ Է ԱՆՓՈՓՈԽ)
    // ==========================================
    const facets = await Amenity.findAll({
      attributes: [
        "id", "name", "category",
        [Sequelize.fn("COUNT", Sequelize.col("Hotels.id")), "count"],
      ],
      include: [{ model: Hotels, attributes: [], through: { attributes: [] } }],
      group: ["Amenity.id"],
    });

    hotels.forEach(hotel => {
      console.log({
        id: hotel.id,
        rating: hotel.rating,
        dynamic_rating: hotel.getDataValue("dynamic_rating"),
      });
    },777777);

    // ==========================================
    // 🚀 12. RESPONSE (ՊԱՀՎԱԾ Է ՁԵՐ ՈՃՈՎ)
    // ==========================================
    return res.status(200).json({
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
    console.error("⛔ ERROR IN getHotels:", error.message);
    next(error);
  }
};


// export const getHotels = async (req, res, next) => {
//   try {
//
//     const {
//       page = 1,
//       limit = 10,
//       search,
//       city,
//       property_class,
//       amenities,
//       type,
//       stars,
//       guestRating,
//       minRating,
//       minPrice,
//       maxPrice,
//       sort,
//     } = req.query;
//
//     const userId = 1;
//     // const userId = req.user?.id;
//
//     const pageNum = Number(page);
//     const limitNum = Number(limit);
//
//     // ======================
//     // AMENITIES FILTER
//     // ======================
//     const parsedAmenities =
//       amenities?.length > 0
//         ? String(amenities)
//           .split(",")
//           .map(Number)
//         : [];
//
//     let hotelIds = null;
//
//     if (parsedAmenities.length > 0) {
//
//       const rows =
//         await HotelAmenities.findAll({
//
//           attributes: ["hotel_id"],
//
//           where: {
//             amenity_id: {
//               [Op.in]: parsedAmenities,
//             },
//           },
//
//           group: ["hotel_id"],
//
//           having: Sequelize.literal(
//             `COUNT(DISTINCT amenity_id) = ${parsedAmenities.length}`
//           ),
//
//         });
//
//       hotelIds = rows.map(
//         (r) => r.hotel_id
//       );
//     }
//
//     // ======================
//     // WHERE
//     // ======================
//     const where = {
//
//       ...(hotelIds && {
//         id: {
//           [Op.in]: hotelIds,
//         },
//       }),
//
//       ...(search && {
//         name: {
//           [Op.like]: `%${search}%`,
//         },
//       }),
//
//       ...(city && {city}),
//
//       ...(property_class &&
//         allowedPropertyClasses.includes(
//           property_class
//         ) && {
//           property_class,
//         }),
//
//       ...(type && {
//         hotel_category: type,
//       }),
//
//       ...(minRating && {
//         rating: {
//           [Op.gte]: Number(minRating),
//         },
//       }),
//
//       ...(minPrice || maxPrice) && {
//
//         price_from: {
//           ...(minPrice && {
//             [Op.gte]: Number(minPrice),
//           }),
//
//           ...(maxPrice && {
//             [Op.lte]: Number(maxPrice),
//           }),
//
//         },
//
//       },
//
//     };
//
//     // ======================
//     // GET HOTELS
//     // ======================
//     const {rows} =
//       await Hotels.findAndCountAll({
//
//         where,
//
//         include: [
//
//           {
//             model: HotelPhotos,
//             as: "images",
//             attributes: [
//               "id",
//               "path",
//               "is_main",
//               "sort_order",
//             ],
//           },
//
//           {
//             model: Amenity,
//             through: {
//               attributes: [],
//             },
//           },
//
//           //  Reviews
//           {
//             model: Reviews,
//             as: "Reviews",
//             attributes: [],
//             required: false,
//           },
//
//           //  Favorites
//           {
//             model: User,
//             as: "usersWhoFavorited",
//
//             attributes: ["id"],
//
//             through: {
//               attributes: [],
//             },
//
//             where: userId
//               ? {id: userId}
//               : undefined,
//
//             required: false,
//           },
//
//         ],
//
//         attributes: {
//
//           include: [
//
//             //  Review count
//             [
//               Sequelize.fn(
//                 "COUNT",
//                 Sequelize.col("Reviews.id")
//               ),
//               "review_count",
//             ],
//
//           ],
//
//         },
//
//         group: [
//           "Hotels.id",
//           "images.id",
//           "Amenities.id",
//           "usersWhoFavorited.id",
//         ],
//
//         subQuery: false,
//
//         distinct: true,
//
//         order: [["rating", "DESC"]],
//
//       });
//
//     // ======================
//     // ENRICH
//     // ======================
//     let enriched =
//       rows.map((hotel) => {
//
//         const plain = hotel.toJSON();
//
//         const avgRating =
//           plain.review_count > 0
//             ? plain.rating_sum /
//             plain.review_count
//             : null;
//
//         return {
//
//           ...plain,
//
//           avgRating,
//
//           typeScore:
//             scoreHotelByType(
//               plain,
//               type
//             ),
//
//           starsComputed:
//             FileHelper.getHotelStars({
//
//               ...plain,
//
//               rating:
//                 avgRating ?? 0,
//
//             }),
//
//         };
//       });
//
//     // ======================
//     // GUEST RATING FILTER
//     // ======================
//     if (guestRating) {
//
//       const min =
//         Number(guestRating);
//
//       enriched =
//         enriched.filter((h) => {
//
//           return (
//             h.avgRating !== null &&
//             h.avgRating >= min
//           );
//
//         });
//     }
//
//     // ======================
//     // STARS FILTER
//     // ======================
//     if (stars) {
//
//       const starNum =
//         Number(stars);
//
//       enriched =
//         enriched.filter((h) => {
//
//           return (
//             Math.floor(
//               h.starsComputed
//             ) === starNum
//           );
//
//         });
//     }
//
//     // ======================
//     // SORT
//     // ======================
//     enriched.sort((a, b) => {
//
//       if (sort === "low") {
//         return (
//           a.price_from -
//           b.price_from
//         );
//       }
//
//       if (sort === "high") {
//         return (
//           b.price_from -
//           a.price_from
//         );
//       }
//
//       if (type) {
//
//         const diff =
//           b.typeScore -
//           a.typeScore;
//
//         if (diff !== 0)
//           return diff;
//       }
//
//       return (
//         (b.avgRating || 0) -
//         (a.avgRating || 0)
//       );
//
//     });
//
//     // ======================
//     // PAGINATION
//     // ======================
//     const offset =
//       (pageNum - 1) * limitNum;
//
//     const paginated =
//       enriched.slice(
//         offset,
//         offset + limitNum
//       );
//
//     // ======================
//     // CLEAN RESPONSE
//     // ======================
//     const cleanHotels =
//       paginated.map((hotel) => ({
//         id: hotel.id,
//         name: hotel.name,
//         city: hotel.city,
//         country: hotel.country,
//         description: hotel.description,
//         price: hotel.price_from,
//         rating: hotel.avgRating !== null
//           ? Number(
//             hotel.avgRating.toFixed(1)
//           )
//           : null,
//         stars: hotel.starsComputed,
//         reviewCount: Number(hotel.review_count),
//         images: hotel.images,
//         amenities: hotel.Amenities,
//         property_class: hotel.property_class,
//         currency: hotel.currency,
//         lat: hotel.lat,
//         lon: hotel.lon,
//         favorite:
//           hotel
//             .usersWhoFavorited
//             ?.length > 0,
//
//       }));
//
//     // ======================
//     // FACETS
//     // ======================
//     const facets =
//       await Amenity.findAll({
//
//         attributes: [
//
//           "id",
//           "name",
//           "category",
//
//           [
//             Sequelize.fn(
//               "COUNT",
//               Sequelize.col(
//                 "Hotels.id"
//               )
//             ),
//             "count",
//           ],
//
//         ],
//
//         include: [
//
//           {
//             model: Hotels,
//             attributes: [],
//             through: {
//               attributes: [],
//             },
//           },
//
//         ],
//
//         group: ["Amenity.id"],
//
//       });
//
//     // ======================
//     // RESPONSE
//     // ======================
//
//     res.status(200).json({
//       status: "success",
//       data: cleanHotels,
//       facets,
//       pagination: {
//         total: enriched.length,
//         page: pageNum,
//         pages: Math.ceil(enriched.length / limitNum),
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };


export const getTopRatedHotels = async (req, res) => {
  try {
    const userId = 1;

    const hotels = await Hotels.scope("withReviewStats").findAll({
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
          where: { id: userId },
          attributes: ["id"],
          required: false,
          through: { attributes: [] },
          duplicating: false,
        },
      ],
      order: [[sequelize.literal("dynamic_rating"), "DESC"]],
      // subQuery: false,
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
    const hotels = await Hotels.scope("withReviewStats").findAll({
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
          through: { attributes: [] },
        },
        {
          model: User,
          as: "usersWhoFavorited",
          attributes: ["id"],
          through: { attributes: [] },
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


export const getSponsoredHotels = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;

    const hotels = await Hotels.scope("withReviewStats").findAll({
      where: {
        featured: true,
        featured_until: {
          [Op.or]: [
            null,
            { [Op.gt]: new Date() },
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
          through: { attributes: [] },
        },

        {
            model: User,
            as: "usersWhoFavorited",
            attributes: ["id"],
            through: { attributes: [] },
            where: userId ? { id: userId } : undefined,
            required: false,
          },

      ],
      // subQuery: false,
      // include: [
      //   {
      //     model: HotelPhotos,
      //     as: "images",
      //     attributes: ["id", "path", "is_main", "sort_order"],
      //   },
      //   {
      //     model: Amenity,
      //     through: { attributes: [] },
      //   },
      //   {
      //     model: User,
      //     as: "usersWhoFavorited",
      //     attributes: ["id"],
      //     through: { attributes: [] },
      //     where: userId ? { id: userId } : undefined,
      //     required: false,
      //   },
      // ],
      // subQuery: false,
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




export const getHotelById = async (req, res, next) => {
  const userId = 1;
  try {
    const hotelId = Number(req.params.hotelId);

    if (!hotelId || isNaN(hotelId)) {
      return res.status(400).json({ success: false, message: "Invalid Hotel ID parameter." });
    }

    const { checkIn, checkOut } = req.query;

    // ==========================================================================
    const hotel = await Hotels.scope("withReviewStats").findByPk(hotelId, {
      include: [
        { model: HotelPhotos, as: "images" },
        { model: Amenity, as: "Amenities", through: { attributes: [] } }
      ],
    });

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found in database registry." });
    }

    await Hotels.increment({ views: 1 }, { where: { id: hotelId } });

    const featuresResult = await sequelize.query(
      `
      SELECT feature, COUNT(*) AS count 
      FROM review_liked rl
      INNER JOIN reviews r ON rl.review_id = r.id
      WHERE r.hotel_id = :hotelId
      GROUP BY feature
      `,
      { replacements: { hotelId }, type: QueryTypes.SELECT }
    );

    const featureCounts = { Pool: 0, Cafe: 0, Restaurant: 0, Exterior: 0, Bathroom: 0, Bedrooms: 0, Kitchen: 0, Amenities: 0 };
    if (Array.isArray(featuresResult)) {
      featuresResult.forEach(row => {
        if (featureCounts[row.feature] !== undefined) {
          featureCounts[row.feature] = Number(row.count);
        }
      });
    }


    const favoriteRecord = await Favorites.findOne({
      where: { hotel_id: hotelId, user_id: userId }
    });
    let isFavorite = !!favoriteRecord;

    const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), "day") : 1;
    const calculatedStars = FileHelper.getHotelStars(hotel);


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
          ...featureCounts
        },
        nights,
      },
    });

  } catch (e) {
    console.error("ERROR IN getHotelById:", e.message);
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








