import Hotels from "../models/Hotels.js";
import Amenity from "../models/Amenity.js";
import HotelPhotos from "../models/HotelPhotos.js";
import {literal, Op, QueryTypes, Sequelize} from "sequelize";
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
import Restaurant from "../models/Restaurant.js";
import moment from "moment";
import _ from "lodash";

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


export const getHotels = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, city, property_class,
      amenities, type, stars, guestRating, minRating,
      minPrice, maxPrice, sort,
      priceRange, activeCategory, isGeoActive
    } = req.query;

    const userId = req.userId || null;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

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

    const allowedPropertyClasses = ["hotel", "apartment", "resort", "villa"];

    const where = {
      ...(hotelIds && { id: { [Op.in]: hotelIds } }),
      ...(search && { name: { [Op.like]: `%${search}%` } }),
      ...(city && { city }),
      ...(property_class && allowedPropertyClasses.includes(property_class) && { property_class }),
      ...(type && { hotel_category: type }),
      ...(minRating && { rating: { [Op.gte]: Number(minRating) } }),
      ...((minPrice || maxPrice) && {
        price_from: {
          ...(minPrice && { [Op.gte]: Number(minPrice) }),
          ...(maxPrice && { [Op.lte]: Number(maxPrice) }),
        },
      }),
      ...(priceRange && { price_range: priceRange }),
    };

    const hotels = await Hotels.scope("withReviewStats").findAll({
      where,
      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main", "sort_order"],
          separate: true
        },
        {
          model: Amenity,
          as: "Amenities",
          through: { attributes: [] }
        }
      ],
      order: [
        [Sequelize.literal(`CASE WHEN featured = 1 AND featured_until > NOW() THEN 1 ELSE 0 END`), 'DESC'],
        ['rating', 'DESC']
      ],
      limit: limitNum,
      offset: offset,
      subQuery: true,
    });

    let userFavorites = [];
    if (userId) {
      const favs = await Favorites.findAll({ where: { user_id: userId }, attributes: ["hotel_id"] });
      userFavorites = favs.map(f => f.hotel_id);
    }

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
          hotelReviewStatsMap[row.hotel_id] = {
            Pool: 0, Cafe: 0, Restaurant: 0, Exterior: 0, Bathroom: 0, Bedrooms: 0, Kitchen: 0, Amenities: 0
          };
        }
        if (hotelReviewStatsMap[row.hotel_id][row.feature] !== undefined) {
          hotelReviewStatsMap[row.hotel_id][row.feature] = Number(row.count);
        }
      });
    }

    const currentDate = moment();

    let enriched = hotels.map((hotel) => {
      let avgScore = Number(hotel.getDataValue("dynamic_rating") || 0);
      let totalReviews = Number(hotel.getDataValue("dynamic_review_count") || 0);
      const calculatedStars = typeof FileHelper !== "undefined" && FileHelper.getHotelStars ? FileHelper.getHotelStars(hotel) : 5;

      const featureCounts = hotelReviewStatsMap[hotel.id] || {
        Pool: 0, Cafe: 0, Restaurant: 0, Exterior: 0, Bathroom: 0, Bedrooms: 0, Kitchen: 0, Amenities: 0
      };

      let computedPriceRange = "$";
      if (hotel.price_from > 150) computedPriceRange = "$$$$";
      else if (hotel.price_from > 90) computedPriceRange = "$$$";
      else if (hotel.price_from > 40) computedPriceRange = "$$";

      const isFeaturedActive =
        hotel.featured === true &&
        hotel.featured_until &&
        moment(hotel.featured_until).isAfter(currentDate);

      if (isFeaturedActive) {
        avgScore = 9.5;
        if (totalReviews === 0) totalReviews = 9;
      }

      return {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        address: hotel.address,
        description: hotel.description || "Welcome to our premium property.",
        property_class: hotel.property_class,
        hotel_category: hotel.hotel_category,
        price_range: hotel.price_range || computedPriceRange,
        lat: hotel.lat,
        lon: hotel.lon,
        views: hotel.views || 0,
        price_from: hotel.price_from || 50,
        currency: hotel.currency || "USD",
        featured: hotel.featured,
        images: hotel.images || [],
        Amenities: hotel.Amenities || [],
        starsComputed: calculatedStars,
        review_count: totalReviews,
        rating_sum: hotel.rating_sum,
        favorite: userFavorites.includes(hotel.id),
        reviewStats: {
          total: totalReviews,
          avgScore: Number(avgScore.toFixed(1)),
          ...featureCounts
        },
        typeScore: typeof scoreHotelByType === "function" ? scoreHotelByType(hotel.toJSON(), type) : 0
      };
    });



    let bundledRestaurants = [];
    let restaurantSliderTexts = {
      title: "Trending Restaurants Nearby",
      subtitle: "Discover the finest luxury dining venues with exclusive offers."
    };

    if (enriched && enriched.length > 0) {
      const restaurantWhereCondition = {};

      const currentCity = enriched[0]?.city;
      if (currentCity && !isGeoActive) {
        restaurantWhereCondition.city = currentCity;
      }

      const activePrice = priceRange || enriched[0]?.price_range;
      const isLuxurySegment = activePrice === '$$$' || activePrice === '$$$$';

      if (isLuxurySegment) {
        restaurantWhereCondition.category = { [Op.in]: ['luxury', 'romantic'] };
        restaurantWhereCondition.priceRange = { [Op.in]: ['$$$', '$$$$'] };
      } else {
        restaurantWhereCondition.category = { [Op.in]: ['family', 'business', 'wellness'] };
        restaurantWhereCondition.priceRange = { [Op.in]: ['$', '$$'] };
      }

      if (activeCategory) {
        switch (activeCategory.toLowerCase()) {
          case 'luxury':
            restaurantWhereCondition.category = 'luxury';
            break;
          case 'family':
            restaurantWhereCondition.category = 'family';
            break;
          case 'romantic':
            restaurantWhereCondition.category = 'romantic';
            break;
          case 'business':
            restaurantWhereCondition.category = 'business';
            break;
          case 'wellness':
            restaurantWhereCondition.category = 'wellness';
            break;
        }
      }

      if (typeof Restaurant !== "undefined" && Restaurant !== null) {
        const rawRestaurants = await Restaurant.findAll({
          where: restaurantWhereCondition,
          attributes: ["id", "name", "city", "address", "cuisineType", "category", "priceRange", "image"],
          limit: 6
        });

        bundledRestaurants = rawRestaurants.map(r => {
          const rJson = r.toJSON();
          return {
            id: rJson.id,
            name: rJson.name,
            city: rJson.city,
            address: rJson.address,
            cuisine: rJson.cuisineType || "International",
            restaurant_category: rJson.category,
            images: rJson.image ? { path: rJson.image } : null,
            rating: rJson.rating || 4.5,
            price_average: rJson.priceRange === '$$$$' ? 45 :
              rJson.priceRange === '$$$'  ? 25 :
                rJson.priceRange === '$$'   ? 15 : 8,
            currency: rJson.currency || "USD"
          };
        });
      }

      const cityNameEn = isGeoActive ? "Nearby Your Location" : (currentCity || "Your Stay");
      restaurantSliderTexts.title = `Trending Dining in ${cityNameEn}`;

      if (activeCategory) {
        restaurantSliderTexts.title = `Handpicked Dining for Your Taste`;
        restaurantSliderTexts.subtitle = `Since you are exploring ${activeCategory} stays, here are the best matching restaurants in ${cityNameEn}.`;
      }
    }


    const facets = await Amenity.findAll({
      attributes: [
        "id", "name", "category",
        [Sequelize.fn("COUNT", Sequelize.col("Hotels.id")), "count"],
      ],
      include: [{ model: Hotels, attributes: [], through: { attributes: [] } }],
      group: ["Amenity.id"],
    });

    const totalCount = await Hotels.count({ where });


    return res.status(200).json({
      status: "success",
      data: enriched,
      filteredRestaurants: bundledRestaurants,
      restaurantSliderTexts,
      facets,
      pagination: {
        total: totalCount,
        page: pageNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });

  } catch (error) {
    console.error(" ERROR IN getHotels:", error.message);
    next(error);
  }
};



export const getLandingHotels = async (req, res, next) => {
  try {
    const userId = req.userId || null;

    const commonInclude = [
      {
        model: HotelPhotos,
        as: "images",
        attributes: ["id", "path", "is_main", "sort_order"],
      },
      {
        model: Amenity,
        as: "Amenities",
        through: {attributes: []},
        required: false
      },
      {
        model: User,
        as: "usersWhoFavorited",
        attributes: ["id"],
        through: {attributes: []},
        required: false
      }
    ];

    const [sponsoredIds, topRatedIds, popularIds] = await Promise.all([
      Hotels.findAll({
        attributes: ['id'],
        where: {
          featured: true,
          featured_until: {[Op.or]: [null, {[Op.gt]: new Date()}]}
        },
        limit: 10,
        raw: true
      }),

      Hotels.findAll({
        attributes: ['id'],
        limit: 10,
        order: [sequelize.literal('COALESCE(rating, 0) DESC')],
        raw: true
      }),

      Hotels.findAll({
        attributes: ['id'],
        limit: 10,
        order: [sequelize.literal('COALESCE(views, 0) DESC')],
        raw: true
      })
    ]);

    const sIds = sponsoredIds.map(h => h.id);
    const tIds = topRatedIds.map(h => h.id);
    const pIds = popularIds.map(h => h.id);

    const [sponsoredRows, topRatedRows, popularRows] = await Promise.all([
      sIds.length > 0 ? Hotels.findAll({where: {id: {[Op.in]: sIds}}, include: commonInclude}) : [],
      tIds.length > 0 ? Hotels.findAll({
        where: {id: {[Op.in]: tIds}},
        include: commonInclude,
        order: [sequelize.literal('COALESCE(rating, 0) DESC')]
      }) : [],
      pIds.length > 0 ? Hotels.findAll({
        where: {id: {[Op.in]: pIds}},
        include: commonInclude,
        order: [sequelize.literal('COALESCE(views, 0) DESC')]
      }) : []
    ]);

    const formatHotelList = (hotels) => {
      return hotels.map((h) => {
        const raw = h.get({plain: true});
        const isFavorite = userId
          ? (raw.usersWhoFavorited && raw.usersWhoFavorited.some(u => u.id === userId))
          : false;

        return {
          id: raw.id,
          name: raw.name,
          city: raw.city,
          country: raw.country,
          description: raw.description || "Welcome to our premium property.",
          price: Number(raw.price_from || raw.price || 50),
          rating: raw.rating != null ? Number(raw.rating) : null,
          stars: raw.stars || 4,
          reviewCount: Number(raw.review_count || 0),
          views: Number(raw.views || 0),
          images: raw.images || [],
          amenities: raw.Amenities || [],
          property_class: raw.property_class || "hotel",
          currency: raw.currency || "USD",
          favorite: isFavorite,
          featured: raw.featured,
          popular: raw.popular
        };
      });
    };

    return res.status(200).json({
      success: true,
      data: {
        sponsored: formatHotelList(sponsoredRows),
        topRated: formatHotelList(topRatedRows),
        popular: formatHotelList(popularRows)
      }
    });

  } catch (err) {
    console.error(" ERROR IN getLandingHotels:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const getNearbyRestaurants = async (req, res, next) => {
  try {
    const hotelId = Number(req.params.hotelId);

    if (!hotelId || isNaN(hotelId)) {
      return res.json({success: true, data: []});
    }

    const hotel = await Hotels.findByPk(hotelId, {
      attributes: ['lat', 'lon']
    });

    if (!hotel || !hotel.lat || !hotel.lon) {
      return res.json({success: true, data: []});
    }

    const distanceQuery = literal(`
      (6371 * acos(
        cos(radians(${Number(hotel.lat)})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(${Number(hotel.lon)})) + 
        sin(radians(${Number(hotel.lat)})) * sin(radians(latitude))
      ))
    `);

    const nearbyRecommendedPlaces = await Restaurant.findAll({
      where: {
        latitude: {[Op.ne]: null},
        longitude: {[Op.ne]: null},
        [Op.and]: [literal(`
          (6371 * acos(
            cos(radians(${Number(hotel.lat)})) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${Number(hotel.lon)})) + 
            sin(radians(${Number(hotel.lat)})) * sin(radians(latitude))
          )) <= 100
        `)]
      },
      attributes: [
        'id', 'name', 'image', 'cuisine_type', 'price_range', 'address',
        [distanceQuery, 'distance']
      ],
      order: distanceQuery,
      limit: 6,
      raw: true
    });

    return res.json({
      success: true,
      data: nearbyRecommendedPlaces
    });

  } catch (e) {
    console.error("ERROR IN getNearbyRestaurants:", e.message);
    next(e);
  }
};


export const getRecommendedContextualHotels = async (req, res) => {
  try {
    const {urlCategory, currentPagePrices, activeCity} = req.query;
    let whereClause = {};

    if (activeCity && activeCity !== 'All') {
      whereClause.city = activeCity;
    }

    if (currentPagePrices) {
      const pricesArray = currentPagePrices.split(',');
      const isLuxurySegment = pricesArray.some(p => p === '$$$' || p === '$$$$');

      if (isLuxurySegment) {
        whereClause.hotel_category = {[Op.in]: ['luxury', 'wellness', 'romantic']};
      } else {
        whereClause.hotel_category = {[Op.in]: ['business', 'family']};
      }
    }

    if (urlCategory) {
      const categoryLower = urlCategory.toLowerCase();
      if (categoryLower.includes('traditional') || categoryLower.includes('armenian')) {
        whereClause.hotel_category = 'romantic';
      } else if (categoryLower.includes('pizza') || categoryLower.includes('cafe') || categoryLower.includes('continental')) {
        whereClause.hotel_category = {[Op.in]: ['family', 'business']};
      } else if (categoryLower.includes('luxury') || categoryLower.includes('premium') || categoryLower.includes('fine')) {
        whereClause.hotel_category = 'luxury';
      }
    }

    const recommendedHotels = await Hotels.findAll({
      where: whereClause,
      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "is_main"],
          separate: true,
          limit: 1
        }
      ],
      order: [['rating', 'DESC']],
      limit: 6
    });

    const cityNameEn = activeCity && activeCity !== 'All' ? activeCity : "Your Stay";
    let sliderTitle = ` Trending Hotels in ${cityNameEn}`;
    let sliderSubtitle = "Discover the finest luxury hotels with exclusive offers.";

    if (urlCategory) {
      sliderTitle = ` Handpicked Stays for Your Taste`;
      sliderSubtitle = `Since you prefer ${urlCategory} dining, here are the best matching hotels in ${cityNameEn}.`;
    }

    return res.status(200).json({
      success: true,
      meta: {
        title: sliderTitle,
        subtitle: sliderSubtitle
      },
      data: recommendedHotels
    });

  } catch (error) {
    console.error("Contextual API Error:", error);
    return res.status(500).json({success: false, message: "Internal Server Error"});
  }
};




export const getHotelById = async (req, res, next) => {
  const userId = req.userId;
  try {
    const hotelId = Number(req.params.hotelId);

    if (!hotelId || isNaN(hotelId)) {
      return res.status(400).json({success: false, message: "Invalid Hotel ID parameter."});
    }

    const {checkIn, checkOut} = req.query;

    const hotel = await Hotels.scope("withReviewStats").findByPk(hotelId, {
      include: [
        {model: HotelPhotos, as: "images"},
        {model: Amenity, as: "Amenities", through: {attributes: []}},
        {
          model: Restaurant,
          as: "restaurants",
          attributes: ['id', 'name', 'cuisine_type', 'price_range', 'image', 'description']
        }
      ],
    });

    if (!hotel) {
      return res.status(404).json({success: false, message: "Hotel not found in database registry."});
    }

    await Hotels.increment({views: 1}, {where: {id: hotelId}});

    const hotelReviews = await Reviews.findAll({
      where: {hotel_id: hotelId},
      attributes: ['id'],
      raw: true
    });

    const reviewIds = hotelReviews.map(r => r.id);

    const featureCounts = {
      Pool: 0,
      Cafe: 0,
      Restaurant: 0,
      Exterior: 0,
      Bathroom: 0,
      Bedrooms: 0,
      Kitchen: 0,
      Amenities: 0
    };

    if (reviewIds.length > 0) {
      const featuresResult = await ReviewLiked.findAll({
        where: {
          review_id: {[Op.in]: reviewIds}
        },
        attributes: ['feature', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['feature'],
        raw: true
      });

      if (Array.isArray(featuresResult)) {
        featuresResult.forEach(row => {
          if (featureCounts[row.feature] !== undefined) {
            featureCounts[row.feature] = Number(row.count);
          }
        });
      }
    }

    const favoriteRecord = await Favorites.findOne({
      where: {hotel_id: hotelId, user_id: userId}
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
        restaurant: hotel.restaurants || null,
        stars: calculatedStars,
        favorite: isFavorite,

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
    const {hotelId} = req.params;
    const {category} = req.query;

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

    return res.status(200).json({success: true, data: photos});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};


