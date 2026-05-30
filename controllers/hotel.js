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
    return null;
  }

  return hotel.rating_sum / hotel.review_count;
};

// const getAvgRating = (hotel) => {
//   return hotel.review_count > 0
//     ? hotel.rating_sum / hotel.review_count
//     : 0;
// };



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
              ? { id: userId }
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



export const getHotelById = async (req, res, next) => {
  console.log(req.params, 8888888)
  try {
    const { hotelId} = req.params;

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
    const hotel = await Hotels.findByPk(hotelId, {
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

      cleanliness: featureCounts.cleanliness,

      staff: featureCounts.staff,

      facilities: featureCounts.facilities,

      location: featureCounts.location,

      value_for_money: featureCounts.value_for_money,
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
        hotel_id: hotelId,

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
    next(e)
  }
};


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



