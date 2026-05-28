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
    return null; // ❗ ոչ թե 0
  }

  return hotel.rating_sum / hotel.review_count;
};

// const getAvgRating = (hotel) => {
//   return hotel.review_count > 0
//     ? hotel.rating_sum / hotel.review_count
//     : 0; // 🔥 կարևոր՝ ոչ թե hotel.rating
// };



export const getHotels = async (req, res) => {

  try {

    const {
      page = 1,
      limit = 15,
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

    console.log(guestRating,888)
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

      ...(city && { city }),

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
    const { rows } =
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

          // ⭐ Reviews
          {
            model: Reviews,
            as: "Reviews",
            attributes: [],
            required: false,
          },

          // ⭐ Favorites
          {
            model: User,
            as: "usersWhoFavorited",

            attributes: ["id"],

            through: {
              attributes: [],
            },

            where: userId
              ? { id: userId }
              : undefined,

            required: false,
          },

        ],

        attributes: {

          include: [

            // ⭐ Review count
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

        const plain =
          hotel.toJSON();

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

        description:
        hotel.description,

        price:
        hotel.price_from,

        rating:
          hotel.avgRating !== null
            ? Number(
              hotel.avgRating.toFixed(1)
            )
            : null,

        stars:
        hotel.starsComputed,

        reviewCount:
          Number(
            hotel.review_count
          ),

        images:
        hotel.images,

        amenities:
        hotel.Amenities,

        property_class:
        hotel.property_class,

        currency:
        hotel.currency,

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
    res.json({

      success: true,

      data: cleanHotels,

      facets,

      pagination: {

        total:
        enriched.length,

        page: pageNum,

        pages: Math.ceil(
          enriched.length /
          limitNum
        ),

      },

    });

  } catch (e) {

    console.error(e);

    res.status(500).json({

      success: false,
      message: "Failed",

    });
  }
};


// export const getHotels = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 15,
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
//     console.log(type)
//
//     const userId = 1
//
//     // const userId = req.user?.id;
//
//     const pageNum = Number(page);
//     const limitNum = Number(limit);
//     const offset = (pageNum - 1) * limitNum;
//
//     // ======================
//     // AMENITIES FILTER
//     // ======================
//     const parsedAmenities =
//       amenities?.length > 0
//         ? String(amenities).split(",").map(Number)
//         : [];
//
//     let hotelIds = null;
//
//     if (parsedAmenities.length > 0) {
//       const rows = await HotelAmenities.findAll({
//         attributes: ["hotel_id"],
//         where: {
//           amenity_id: { [Op.in]: parsedAmenities },
//         },
//         group: ["hotel_id"],
//         having: Sequelize.literal(
//           `COUNT(DISTINCT amenity_id) = ${parsedAmenities.length}`
//         ),
//       });
//
//       hotelIds = rows.map((r) => r.hotel_id);
//     }
//
//     // ======================
//     // WHERE
//     // ======================
//     // const where = {
//     //   ...(hotelIds && { id: { [Op.in]: hotelIds } }),
//     //
//     //   ...(search && {
//     //     name: { [Op.like]: `%${search}%` },
//     //   }),
//     //
//     //   ...(city && { city }),
//     //
//     //   ...(property_class &&
//     //     allowedPropertyClasses.includes(property_class) && {
//     //       property_class,
//     //     }),
//     //
//     //   ...(minRating && {
//     //     rating: { [Op.gte]: Number(minRating) },
//     //   }),
//     //
//     // };
//
//     const where = {
//
//       ...(hotelIds && {
//         id: { [Op.in]: hotelIds },
//       }),
//
//       ...(search && {
//         name: {
//           [Op.like]: `%${search}%`,
//         },
//       }),
//
//       ...(city && { city }),
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
//
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
//     // const { rows } = await Hotels.findAndCountAll({
//     //   where,
//     //   include: [
//     //     { model: HotelPhotos, as: "images" },
//     //     { model: Amenity, through: { attributes: [] } },
//     //
//     //
//     //     {
//     //       model: User,
//     //       as: "usersWhoFavorited",
//     //
//     //       attributes: ["id"],
//     //
//     //       through: {
//     //         attributes: [],
//     //       },
//     //
//     //       where: userId
//     //         ? { id: userId }
//     //         : undefined,
//     //
//     //       required: false,
//     //     },
//     //
//     //   ],
//     //   distinct: true,
//     //   order: [["rating", "DESC"]],
//     // });
//
//     const { rows } = await Hotels.findAndCountAll({
//       where,
//
//       include: [
//
//         {
//           model: HotelPhotos,
//           as: "images",
//         },
//
//         {
//           model: Amenity,
//           through: { attributes: [] },
//         },
//
//         // ⭐ reviews count
//         {
//           model: Reviews,
//           as: "Reviews",
//           attributes: [],
//           required: false,
//         },
//
//         {
//           model: User,
//           as: "usersWhoFavorited",
//
//           attributes: ["id"],
//
//           through: {
//             attributes: [],
//           },
//
//           where: userId
//             ? { id: userId }
//             : undefined,
//
//           required: false,
//         },
//
//       ],
//
//       attributes: {
//
//         include: [
//
//           [
//             Sequelize.fn(
//               "COUNT",
//               Sequelize.col("Reviews.id")
//             ),
//             "review_count",
//           ],
//
//         ],
//
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
//
//       distinct: true,
//
//       order: [["rating", "DESC"]],
//     });
//     // ======================
//     // HELPERS
//     // ======================
//     const getAvgRating = (hotel) => {
//       if (!hotel.review_count || hotel.review_count === 0) return null;
//       return hotel.rating_sum / hotel.review_count;
//     };
//
//     // ======================
//     // ENRICH
//     // ======================
//     let enriched = rows.map((hotel) => {
//       const plain = hotel.toJSON();
//       const avgRating = getAvgRating(plain);
//
//       return {
//         ...plain,
//         avgRating,
//         typeScore: scoreHotelByType(plain, type),
//
//         // 🔥 FIX (null safe)
//         starsComputed: FileHelper.getHotelStars({
//           ...plain,
//           rating: avgRating ?? 0,
//         }),
//       };
//     });
//
//     // ======================
//     // ⭐ GUEST RATING FILTER
//     // ======================
//     if (guestRating) {
//       const min = Number(guestRating);
//
//       enriched = enriched.filter((h) => {
//         return h.avgRating !== null && h.avgRating >= min;
//       });
//     }
//
//
//     // ======================
//     // ⭐ STARS FILTER
//     // ======================
//     if (stars) {
//       const starNum = Number(stars);
//
//       enriched = enriched.filter((h) => {
//         return Math.floor(h.starsComputed) === starNum;
//       });
//     }
//
//     // ======================
//     // SORT
//     // ======================
//     enriched.sort((a, b) => {
//
//       if (sort === "low") {
//         return a.price_from - b.price_from;
//       }
//
//       if (sort === "high") {
//         return b.price_from - a.price_from;
//       }
//
//       if (type) {
//         const diff = b.typeScore - a.typeScore;
//         if (diff !== 0) return diff;
//       }
//
//       return (b.avgRating || 0) - (a.avgRating || 0);
//     });
//
//     // ======================
//     // PAGINATION
//     // ======================
//     const paginated = enriched.slice(offset, offset + limitNum);
//
//     const cleanHotels = paginated.map((hotel) => ({
//       id: hotel.id,
//       name: hotel.name,
//       city: hotel.city,
//       country: hotel.country,
//       description: hotel.description,
//       price: hotel.price_from,
//
//       rating:
//         hotel.avgRating !== null
//           ? Number(hotel.avgRating.toFixed(1))
//           ,
//
//       stars: hotel.starsComputed,
//
//       reviewCount: Number(
//         hotel.review_count
//       ),
//       images: hotel.images,
//       amenities: hotel.Amenities,
//
//       property_class: hotel.property_class,
//       currency: hotel.currency,
//
//       lat: hotel.lat,
//       lon: hotel.lon,
//
//       favorite: hotel.usersWhoFavorited?.length > 0,
//
//     }));
//
//         const facets = await Amenity.findAll({
//       attributes: [
//         "id",
//         "name",
//         "category",
//         [
//           Sequelize.fn("COUNT", Sequelize.col("Hotels.id")),
//           "count",
//         ],
//       ],
//       include: [
//         {
//           model: Hotels,
//           attributes: [],
//           through: { attributes: [] },
//         },
//       ],
//       group: ["Amenity.id"],
//     });
//
//     // const ratingFacets = await getRatingFacets();
//
//     res.json({
//       success: true,
//       data: cleanHotels,
//       facets,
//       pagination: {
//         total: enriched.length,
//         page: pageNum,
//         pages: Math.ceil(enriched.length / limitNum),
//       },
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Failed",
//     });
//   }
// };








//single hotel
const isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const conflict = await Booking.findOne({
    where: {
      room_id: roomId,
      status: "confirmed",
      [Op.or]: [
        {
          check_in: { [Op.lt]: checkOut },
          check_out: { [Op.gt]: checkIn },
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



export const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    const hotelViews =
      await Hotels.findByPk(
        req.params.id
      );

    const {
      checkIn,
      checkOut,
      guests = 1,
    } = req.query;



    await hotelViews.increment("views");
    // ======================
    // NIGHTS
    // ======================
    const nights =
      checkIn && checkOut
        ? dayjs(checkOut).diff(dayjs(checkIn), "day")
        : 1;

    // ======================
    // HOTEL
    // ======================
    const hotel = await Hotels.findByPk(id, {
      include: [
        {
          model: HotelPhotos,
          as: "images",
        },

        {
          model: Amenity,
          as: "Amenities",
          through: { attributes: [] },
        },

        {
          model: Reviews,
          include: [
            {
              model: ReviewLiked,
              as: "liked_features",
            },
          ],
          order: [["review_date", "DESC"]],
        },
      ],
    });

    // ======================
    // NOT FOUND
    // ======================
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // ======================
    // REVIEWS
    // ======================
    // const reviews = hotel.Reviews || [];
    //
    // const avg = (field) => {
    //   const vals = reviews
    //     .map((r) => Number(r[field]))
    //     .filter((v) => !isNaN(v));
    //
    //   if (!vals.length) return 0;
    //
    //   return Number(
    //     (
    //       vals.reduce((a, b) => a + b, 0) /
    //       vals.length
    //     ).toFixed(1)
    //   );
    // };
    //
    // // ======================
    // // REVIEW STATS
    // // ======================
    // const reviewStats = {
    //   total: reviews.length,
    //
    //   avgScore: avg("score"),
    //
    //   cleanliness: avg("cleanliness"),
    //
    //   staff: avg("staff"),
    //
    //   facilities: avg("facilities"),
    //
    //   location: avg("location"),
    //
    //   value_for_money: avg(
    //     "value_for_money"
    //   ),
    // };


    // ======================
// REVIEWS
// ======================
    const reviews = hotel.Reviews || [];

// ======================
// AVG SCORE
// ======================
    const avgScore =
      reviews.length > 0
        ? Number(
          (
            reviews.reduce(
              (sum, r) =>
                sum + Number(r.score || 0),
              0
            ) / reviews.length
          ).toFixed(1)
        )
        : 0;

// ======================
// FEATURE COUNTS
// ======================
    const featureCounts = {
      cleanliness: 0,
      staff: 0,
      facilities: 0,
      location: 0,
      value_for_money: 0,
    };

// ======================
// COUNT LIKED FEATURES
// ======================
    reviews.forEach((review) => {
      (review.liked_features || []).forEach(
        (item) => {
          if (
            item.feature === "value"
          ) {
            featureCounts.value_for_money++;
          } else if (
            featureCounts[item.feature] !==
            undefined
          ) {
            featureCounts[item.feature]++;
          }
        }
      );
    });

// ======================
// REVIEW STATS
// ======================
    const reviewStats = {
      total: reviews.length,

      avgScore,

      cleanliness:
      featureCounts.cleanliness,

      staff: featureCounts.staff,

      facilities:
      featureCounts.facilities,

      location:
      featureCounts.location,

      value_for_money:
      featureCounts.value_for_money,
    };
    // ======================
    // MOST LIKED FEATURES
    // ======================
    const likedMap = {};

    reviews.forEach((review) => {
      (review.liked_features || []).forEach(
        (item) => {
          likedMap[item.feature] =
            (likedMap[item.feature] || 0) + 1;
        }
      );
    });

    const topLiked = Object.entries(likedMap)
      .sort((a, b) => b[1] - a[1])
      .map(([feature, count]) => ({
        feature,
        count,
      }));

    // ======================
    // ROOMS
    // ======================
    const rooms = await Room.findAll({
      where: {
        hotel_id: id,

        status: "active",

        ...(guests && {
          max_guests: {
            [Op.gte]: Number(guests),
          },
        }),
      },

      include: [
        {
          model: Photo,
          as: "images",
        },

        {
          model: Amenity,
          as: "amenities",
          through: { attributes: [] },
        },

        {
          model: RoomOption,
          as: "options",
          where: {
            status: "active",
          },
          required: false,
        },

        {
          model: RoomExtra,
          as: "extras",
        },
      ],
    });

    // ======================
    // FORMAT ROOMS
    // ======================
    const formattedRooms = [];

    for (const room of rooms) {
      const r = room.toJSON();

      // ======================
      // AVAILABILITY
      // ======================
      let available = true;

      if (checkIn && checkOut) {
        available = await isRoomAvailable(
          r.id,
          checkIn,
          checkOut
        );
      }

      if (!available) continue;

      // ======================
      // OPTIONS
      // ======================
      const options = (r.options || []).map(
        (opt) =>
          calcRoomOptionPrice(opt, nights)
      );

      // ======================
      // LOWEST PRICE
      // ======================
      const lowestPrice =
        options.length > 0
          ? Math.min(
            ...options.map(
              (o) => o.total_price
            )
          )
          : 0;

      // ======================
      // GROUP AMENITIES
      // ======================
      const groupedAmenities = {};

      (r.amenities || []).forEach((a) => {
        const key = a.category || "Other";

        if (!groupedAmenities[key]) {
          groupedAmenities[key] = [];
        }

        groupedAmenities[key].push({
          id: a.id,
          name: a.name,
          key: a.key,
        });
      });

      // ======================
      // FORMAT EXTRAS
      // ======================
      const extras = (r.extras || []).map(
        (e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          price: e.price,
        })
      );

      formattedRooms.push({
        id: r.id,

        name: r.name,

        size: r.size,

        bed_type: r.bed_type,

        max_guests: r.max_guests,

        lowest_price: lowestPrice,

        images: r.images || [],

        amenities: r.amenities || [],

        groupedAmenities,

        extras,

        options,
      });
    }

    // ======================
    // RESPONSE
    // ======================
    return res.json({
      success: true,

      data: {
        id: hotel.id,

        name: hotel.name,

        description: hotel.description,

        address: hotel.address,

        city: hotel.city,

        country: hotel.country,

        stars: hotel.stars,

        property_class:
        hotel.property_class,

        currency: hotel.currency,

        rating: hotel.rating,

        review_count:
        hotel.review_count,

        images: hotel.images || [],

        amenities:
          hotel.Amenities || [],

        reviewStats,

        topLiked,

        reviews,

        nights,

        rooms: formattedRooms,
      },
    });
  } catch (e) {
    console.error(
      "GET HOTEL BY ID ERROR:",
      e
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
    });
  }
};

// export const getHotelById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { checkIn, checkOut, guests = 1 } = req.query;
//
//     const nights =
//       checkIn && checkOut
//         ? dayjs(checkOut).diff(dayjs(checkIn), "day")
//         : 1;
//
//     // ======================
//     // HOTEL
//
//
//     const hotel = await Hotels.findByPk(id, {
//       include: [
//         {
//           model: HotelPhotos,
//           as: "images",
//         },
//         {
//           model: Amenity,
//           through: { attributes: [] },
//         },
//         {
//           model: Reviews,
//           order: [["review_date", "DESC"]],
//         },
//
//         // {
//         //   model: Reviews,
//         //   attributes: [
//         //     "score",
//         //     "cleanliness",
//         //     "staff",
//         //     "facilities",
//         //     "location",
//         //     "value_for_money",
//         //   ]
//         // }
//
//       ],
//     });
//
//     if (!hotel) {
//       return res.status(404).json({ message: "Not found" });
//     }
//
//     // ======================
//     // REVIEW STATS (SAFE)
//     // ======================
//     // const reviews = hotel.Reviews || [];
//
//     // const avg = (field) => {
//     //   const vals = reviews
//     //     .map((r) => Number(r[field]))
//     //     .filter((v) => !isNaN(v));
//     //
//     //   if (!vals.length) return null;
//     //
//     //   return Number(
//     //     (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
//     //   );
//     // };
//     //
//     // const reviewStats = {
//     //   total: reviews.length,
//     //   avgScore: avg("score"),
//     //   cleanliness: avg("cleanliness"),
//     //   staff: avg("staff"),
//     //   facilities: avg("facilities"),
//     //   location: avg("location"),
//     //   value_for_money: avg("value_for_money"),
//     // };
//
//     // ======================
//     // ROOMS
//     // ======================
//     const rooms = await Room.findAll({
//       where: {
//         hotel_id: id,
//         status: "active",
//         ...(guests && {
//           max_guests: { [Op.gte]: Number(guests) },
//         }),
//       },
//       include: [
//         { model: Photo, as: "images" },
//         { model: Amenity, as: "amenities", through: { attributes: [] } },
//         { model: RoomOption, as: "options" },
//         { model: RoomExtra, as: "extras" },
//       ],
//     });
//
//     // ======================
//     // FORMAT ROOMS
//     // ======================
//     const formattedRooms = [];
//
//     for (const room of rooms) {
//       const r = room.toJSON();
//
//       // 🔥 availability check (optional if dates provided)
//       let available = true;
//
//       if (checkIn && checkOut) {
//         available = await isRoomAvailable(
//           r.id,
//           checkIn,
//           checkOut
//         );
//       }
//
//       if (!available) continue;
//
//       const options = (r.options || []).map((opt) =>
//         calcRoomOptionPrice(opt, nights)
//       );
//
//       formattedRooms.push({
//         id: r.id,
//         name: r.name,
//         size: r.size,
//         bed_type: r.bed_type,
//         max_guests: r.max_guests,
//
//         images: r.images,
//         amenities: r.amenities,
//         extras: r.extras,
//
//         options,
//       });
//     }
//
//     // ======================
//     // RESPONSE
//     // ======================
//     res.json({
//       success: true,
//       data: {
//         id: hotel.id,
//         name: hotel.name,
//         description: hotel.description,
//         address: hotel.address,
//         city: hotel.city,
//         country: hotel.country,
//
//         rating: hotel.rating,
//         review_count: hotel.review_count,
//
//         images: hotel.images,
//         amenities: hotel.Amenities,
//
//         // reviewStats,
//
//         nights,
//         rooms: formattedRooms,
//       },
//
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       message: "Failed",
//     });
//   }
// };






export const getTopHotels = async (req, res) => {
  try {
    const hotels = await Hotels.findAll({
      order: [["rating", "DESC"]],
      limit: 10,
      include: [
        {
          model: HotelPhotos,
          as: "images",
        },
      ],
    });

    res.json({
      success: true,
      data: hotels,
    });
  } catch (e) {
    res.status(500).json({
      message: "Failed",
      error: e.message,
    });
  }
};




// // // import Room from "../models/Room.js";
// // // import Hotel from "../models/Hotels.js";
// // //
// // // export const getHotels = async (req, res) => {
// // //   try {
// // //     const hotels = await Hotel.findAll();
// // //     res.json(hotels);
// // //   } catch (err) { res.status(500).json({ error: err.message }); }
// // // };
// // //
// // // export const getHotel = async (req, res) => {
// // //   try {
// // //     const hotel = await Hotel.findByPk(req.params.id, { include: [{ model: Room, as: "rooms" }] });
// // //     if (!hotel) return res.status(404).json({ message: "Hotel not found" });
// // //     res.json(hotel);
// // //   } catch (err) { res.status(500).json({ error: err.message }); }
// // // };
// // //
// // // export const createHotel = async (req, res) => {
// // //   try {
// // //     const hotel = await Hotel.create(req.body);
// // //     res.status(201).json(hotel);
// // //   } catch (err) { res.status(500).json({ error: err.message }); }
// // // };
// // //
// // // export const updateHotel = async (req, res) => {
// // //   try {
// // //     const hotel = await Hotel.findByPk(req.params.id);
// // //     if (!hotel) return res.status(404).json({ message: "Hotel not found" });
// // //     await hotel.update(req.body);
// // //     res.json(hotel);
// // //   } catch (err) { res.status(500).json({ error: err.message }); }
// // // };
// // //
// // // export const deleteHotel = async (req, res) => {
// // //   try {
// // //     const hotel = await Hotel.findByPk(req.params.id);
// // //     if (!hotel) return res.status(404).json({ message: "Hotel not found" });
// // //     await hotel.destroy();
// // //     res.json({ message: "Hotel deleted" });
// // //   } catch (err) { res.status(500).json({ error: err.message }); }
// // // };
// //
// //
// //
// // import axios from "axios";
// //
// // const searchHotels = async (city) => {
// //   // const res = await axios.get("https://hotels-com-provider.p.rapidapi.com/v2/regions", {
// //   //   params: { query: city, locale: "en_US", domain: "US" },
// //   //   headers: {
// //   //     "Content-Type": "application/json",
// //   //     "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
// //   //     "x-rapidapi-key": process.env.RAPIDAPI_KEY
// //   //   }
// //   // });
// //
// //   const res = await axios.get("https://hotels-com-provider.p.rapidapi.com/v2/regions", {
// //     params: {
// //       query: city,
// //       locale: "es_AR",
// //       domain: "AR"
// //     },
// //     headers: {
// //       "Content-Type": "application/json",
// //       "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
// //       "x-rapidapi-key": process.env.RAPIDAPI_KEY
// //     }
// //   });
// //   console.log(res.data,1111)
// //   return res.data;
// // };
// // export const getHotelsData = async (req, res) => {
// //   const { city } = req.query;
// //   if (!city) return res.status(400).json({ error: "City is required" });
// //
// //   try {
// //     const cityName = city.split(',')[0]; // truncate
// //     const data = await searchHotels(cityName); // RapidAPI response
// //
// //     // Filter only hotels
// //     // const hotelsOnly = data.data.filter(item => item['@type'] === 'gaiaHotelResult');
// //
// //     const hotelsData = data.data.map(h => ({
// //       id: h.hotelId,
// //       name: h.regionNames?.fullName || "Unknown",
// //       latitude: h.coordinates?.lat || 48.8566,
// //       longitude: h.coordinates?.lon || 2.3522,
// //       address: h.hotelAddress?.streetAddress || ""
// //     }));
// //
// //     res.json({ hotels: hotelsData });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: err.message });
// //   }
// // };
// //
// //
// //
// //
// // import Hotels from '../models/Hotels.js';
// // import Room from '../models/Room.js';
// // import Amenity from '../models/Amenity.js';
// // import RoomExtra from '../models/RoomExtra.js';
// // import RoomOption from '../models/RoomOption.js';
// // import sequelize from '../clients/db.sequelize.mysql.js';
// //
// // export async function createHotelWithRooms(req, res) {
// //   const t = await sequelize.transaction();
// //   try {
// //     const { hotelData, rooms } = req.body;
// //     // hotelData օրինակ՝ { name, description, city, country, lat, lon, ... }
// //
// //     // 1. Ստեղծում ենք հյուրանոցը
// //     const hotel = await Hotels.create(hotelData, { transaction: t });
// //
// //     // 2. Ստեղծում ենք սենյակները մեկ-մեկ
// //     for (const roomData of rooms) {
// //       const { name, size, bedType, maxGuests, price, freeWifi, amenityIds, extras, options } = roomData;
// //
// //       // Ստեղծում սենյակ
// //       const room = await Room.create(
// //         { name, size, bedType, maxGuests, price, freeWifi, hotelId: hotel.id },
// //         { transaction: t }
// //       );
// //
// //       // Միացնել Amenities
// //       if (amenityIds && amenityIds.length) {
// //         await room.addAmenities(amenityIds, { transaction: t });
// //       }
// //
// //       // Ստեղծել RoomExtras
// //       if (extras && extras.length) {
// //         for (const extra of extras) {
// //           await RoomExtra.create({ ...extra, roomId: room.id }, { transaction: t });
// //         }
// //       }
// //
// //       // Ստեղծել RoomOptions
// //       if (options && options.length) {
// //         for (const option of options) {
// //           await RoomOption.create({ ...option, roomId: room.id }, { transaction: t });
// //         }
// //       }
// //     }
// //
// //     await t.commit();
// //
// //     // Վերադարձնում ենք հյուրանոցը՝ իր սենյակներով և հարմարություններով
// //     const createdHotel = await Hotels.findByPk(hotel.id, {
// //       include: {
// //         model: Room,
// //         include: [Amenity, RoomExtra, RoomOption]
// //       }
// //     });
// //
// //     res.status(201).json(createdHotel);
// //
// //   } catch (err) {
// //     await t.rollback();
// //     console.error(err);
// //     res.status(500).json({ message: 'Failed to create hotel with rooms' });
// //   }
// // }
//
//
//
//
//
// import sequelize from "../clients/db.sequelize.mysql.js";
// import Hotels from "../models/Hotels.js";
// import Room from "../models/Room.js";
// import Amenity from "../models/Amenity.js";
// import RoomExtra from "../models/RoomExtra.js";
// import RoomOption from "../models/RoomOption.js";
// import Review from "../models/Reviews.js";
// import LocationPoint from "../models/LocationPoint.js";
//
// export async function createFullHotel(req, res) {
//   const t = await sequelize.transaction();
//
//   try {
//     const data = req.body;
//
//     // 🔹 HOTEL
//     const hotel = await Hotels.create(data.hotel, { transaction: t });
//
//     // 🔹 ROOM
//     const room = await Room.create({
//       ...data.room,
//       hotel_id: hotel.id
//     }, { transaction: t });
//
//     // 🔹 AMENITIES
//     const createdAmenities = [];
//
//     for (const a of data.amenities || []) {
//       const [amenity] = await Amenity.findOrCreate({
//         where: { name: a.name },
//         defaults: a,
//         transaction: t
//       });
//       createdAmenities.push(amenity);
//     }
//
//     await room.addAmenities(createdAmenities, { transaction: t });
//
//     // 🔹 EXTRAS (փոխեցինք bulkCreate → create)
//     for (const e of data.extras || []) {
//       await RoomExtra.create(
//         { ...e, room_id: room.id },
//         { transaction: t }
//       );
//     }
//
//     // 🔹 OPTIONS
//     for (const o of data.options || []) {
//       await RoomOption.create(
//         { ...o, room_id: room.id },
//         { transaction: t }
//       );
//     }
//
//     // 🔹 REVIEWS
//     for (const r of data.reviews || []) {
//       await Review.create(
//         { ...r, hotel_id: hotel.id },
//         { transaction: t }
//       );
//     }
//
//     // 🔹 LOCATION
//     for (const l of data.locations || []) {
//       await LocationPoint.create(
//         { ...l, hotelId: hotel.id },
//         { transaction: t }
//       );
//     }
//
//     await t.commit();
//
//     res.json({ message: "SUCCESS" });
//
//   } catch (err) {
//     await t.rollback();
//     console.error(err);
//     res.status(500).json({ error: "ERROR" });
//   }
// }
