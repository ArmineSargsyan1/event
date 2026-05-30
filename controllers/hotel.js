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



const mapHotel = (hotel, userId = null) => {
  const plain = hotel.toJSON();

  const reviewCount = plain.review_count || 0;

  const avgRating =
    reviewCount > 0
      ? plain.rating_sum / reviewCount
      : null;

  return {
    id: plain.id,
    name: plain.name,
    city: plain.city,
    country: plain.country,
    description: plain.description,
    price: plain.price_from,

    rating:
      avgRating !== null
        ? Number(avgRating.toFixed(1))
        : null,

    stars: plain.starsComputed,

    reviewCount: Number(reviewCount),

    images: plain.images,

    amenities: plain.Amenities,

    favorite:
      plain.usersWhoFavorited?.length > 0,
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


export const getTopRatedHotels = async (req, res) => {
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
};


export const getPopularHotels = async (req, res) => {
  const hotels = await Hotels.findAll({
    order: [["views", "DESC"]],
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
};


export const getSponsoredHotels = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;

    const hotels = await Hotels.findAll({
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
          model: Reviews,
          as: "Reviews",
          attributes: [],
          required: false,
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


export const getHotelById = async (req, res, next) => {
  try {
    const hotelId = Number(req.params.hotelId);

    const { checkIn, checkOut, guests = 1 } = req.query;

    // ======================
    // GET HOTEL (single query)
    // ======================
    const hotel = await Hotels.findByPk(hotelId, {
      include: [
        { model: HotelPhotos, as: "images" },
        { model: Amenity, as: "Amenities", through: { attributes: [] } },
        {
          model: Reviews,
          include: [{ model: ReviewLiked, as: "liked_features" }],
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
    // SAFE INCREMENT
    // ======================
    await Hotels.increment(
      { views: 1 },
      { where: { id: hotelId } }
    );

    // ======================
    // NIGHTS
    // ======================
    const nights =
      checkIn && checkOut
        ? dayjs(checkOut).diff(dayjs(checkIn), "day")
        : 1;

    // ======================
    // REVIEWS
    // ======================
    const reviews = hotel.Reviews || [];

    const avgScore =
      reviews.length
        ? Number(
          (
            reviews.reduce((s, r) => s + Number(r.score || 0), 0) /
            reviews.length
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

    reviews.forEach((review) => {
      (review.liked_features || []).forEach((item) => {
        if (featureCounts[item.feature] !== undefined) {
          featureCounts[item.feature]++;
        }
      });
    });

    // ======================
    // RESPONSE (CLEAN)
    // ======================
    return res.json({
      success: true,
      data: {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        stars: hotel.stars,
        views: hotel.views + 1,

        images: hotel.images || [],
        amenities: hotel.Amenities || [],

        reviewStats: {
          total: reviews.length,
          avgScore,
          ...featureCounts,
        },

        nights,
      },
    });
  } catch (e) {
    next(e);
  }
};












