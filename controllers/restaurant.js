import {literal, Op} from 'sequelize';

import sequelize from '../clients/db.sequelize.mysql.js';
import OrderItem from "../models/OrderItem.js";
import Booking from "../models/Booking.js";
import {Order, RestaurantImage, RestaurantReview} from "../models/index.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import RestaurantFavorite from "../models/RestaurantFavorite.js";
import Dish from "../models/Dish.js";
import User from "../models/User.js";
import Hotels from "../models/Hotels.js";
import HotelPhotos from "../models/HotelPhotos.js";
import {cloudinary} from "../middlewares/upload.js";


export const getAllRestaurants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const userId = req.userId;

    const isNearby = req.query.is_nearby === 'true';
    const { latitude, longitude, radius } = req.query;
    const rad = parseFloat(radius || 20);

    let activeCategory = req.query.category || '';
    if (activeCategory) {
      activeCategory = decodeURIComponent(activeCategory).trim();
    }

    let requestedCuisineType = req.query.cuisine_type || '';
    if (requestedCuisineType) {
      requestedCuisineType = decodeURIComponent(requestedCuisineType).trim();
    }

    const requestedPriceRange = req.query.price_range || '';

    const whereCondition = {};

    if (search) {
      whereCondition.name = { [Op.like]: `%${search}%` };
    }

    if (activeCategory) {
      whereCondition.category = activeCategory;
    }

    if (requestedCuisineType) {
      whereCondition.cuisine_type = requestedCuisineType;
    }

    if (requestedPriceRange) {
      whereCondition.priceRange = requestedPriceRange;
    }

    const isGeoActive = isNearby && latitude && longitude;

    if (isGeoActive) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const latDelta = rad / 111;
      const lngDelta = rad / (111 * Math.cos(lat * Math.PI / 180));

      whereCondition.latitude = { [Op.between]: [lat - latDelta, lat + latDelta] };
      whereCondition.longitude = { [Op.between]: [lng - lngDelta, lng + lngDelta] };
    }

    const attributesInclude = [];
    if (isGeoActive) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      attributesInclude.push([
        sequelize.literal(`(
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        )`),
        'distance'
      ]);
    }

    const results = await Restaurant.findAll({
      where: whereCondition,
      attributes: attributesInclude.length > 0 ? { include: attributesInclude } : undefined,
      having: isGeoActive ? sequelize.literal(`distance <= ${rad}`) : undefined,
      order: isGeoActive ? [[sequelize.literal('distance'), 'ASC']] : [['id', 'DESC']],
      limit,
      offset,
      raw: true
    });

    const reviews = await RestaurantReview.findAll({
      attributes: ['restaurant_id', 'rating'],
      raw: true
    });

    const reviewStats = {};
    reviews.forEach(r => {
      if (!reviewStats[r.restaurant_id]) {
        reviewStats[r.restaurant_id] = { total: 0, count: 0 };
      }
      reviewStats[r.restaurant_id].total += Number(r.rating || 0);
      reviewStats[r.restaurant_id].count += 1;
    });

    let favoriteIds = [];
    if (userId) {
      const favorites = await RestaurantFavorite.findAll({ where: { user_id: userId }, attributes: ['restaurant_id'], raw: true });
      favoriteIds = favorites.map(f => f.restaurant_id);
    }

    const restaurantsFinalPayload = results.map(r => {
      const stats = reviewStats[r.id] || { total: 0, count: 0 };
      r.isFavorite = favoriteIds.includes(r.id);
      r.avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : "0.0";
      r.reviewCount = stats.count;
      return r;
    });

    const allCategoriesRaw = await Restaurant.findAll({
      attributes: ['category'],
      raw: true
    });

    const uniqueCategories = [
      ...new Set(allCategoriesRaw.map(r => r.category).filter(Boolean))
    ];
    const categoriesPayload = uniqueCategories.map(c => ({ category: c }));

    let totalCount = 0;
    if (isGeoActive) {
      const totalFiltered = await Restaurant.findAll({
        where: whereCondition,
        attributes: attributesInclude.length > 0 ? { include: attributesInclude } : undefined,
        having: sequelize.literal(`distance <= ${rad}`),
        raw: true
      });
      totalCount = totalFiltered.length;
    } else {
      totalCount = await Restaurant.count({ where: whereCondition });
    }


    let bundledHotels = [];
    let sliderTexts = {
      title: "Trending Hotels for Your Stay",
      subtitle: "Discover the finest luxury hotels with exclusive offers."
    };

    if (restaurantsFinalPayload && restaurantsFinalPayload.length > 0) {
      const hotelWhereCondition = {};

      const currentCity = restaurantsFinalPayload[0]?.city;
      if (currentCity && !isGeoActive) {
        hotelWhereCondition.city = currentCity;
      }

      const activePrice = requestedPriceRange || restaurantsFinalPayload[0]?.priceRange || restaurantsFinalPayload[0]?.price_range;
      const isLuxurySegment = activePrice === '$$$' || activePrice === '$$$$';

      if (isLuxurySegment) {
        hotelWhereCondition.hotel_category = { [Op.in]: ['luxury', 'wellness', 'romantic'] };
        hotelWhereCondition.price_range = { [Op.in]: ['$$$', '$$$$'] };
      } else {
        hotelWhereCondition.hotel_category = { [Op.in]: ['family', 'business'] };
        hotelWhereCondition.price_range = { [Op.in]: ['$', '$$'] };
      }

      if (activeCategory) {
        switch (activeCategory.toLowerCase()) {
          case 'luxury':
            hotelWhereCondition.hotel_category = 'luxury';
            break;
          case 'family':
            hotelWhereCondition.hotel_category = 'family';
            break;
          case 'wellness':
            hotelWhereCondition.hotel_category = 'wellness';
            break;
          case 'business':
            hotelWhereCondition.hotel_category = 'business';
            break;
        }
      }

      bundledHotels = await Hotels.findAll({
        where: hotelWhereCondition,
        include: [{
          model: HotelPhotos,
          as: "images",
          attributes: ["path", "is_main"],
          required: false,
          separate: true,
          order: [
            ["is_main", "DESC"],
            ["created_at", "DESC"]
          ],
          limit: 1
        }],
        order: [['rating', 'DESC']],
        limit: 6
      });

      const cityNameEn = isGeoActive ? "Nearby Your Location" : (currentCity || "Your Stay");
      sliderTexts.title = `Trending Hotels in ${cityNameEn}`;

      if (activeCategory) {
        sliderTexts.title = `Handpicked Stays for Your Taste`;
        sliderTexts.subtitle = `Since you are exploring ${activeCategory} venues, here are the best matching hotels in ${cityNameEn}.`;
      }
    }

    return res.status(200).json({
      success: true,
      restaurants: restaurantsFinalPayload,
      categories: categoriesPayload,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hotels: bundledHotels,
      sliderTexts: sliderTexts
    });

  } catch (err) {
    console.error("Error in getAllRestaurants:", err);
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId || null;

    const restaurant = await Restaurant.findByPk(id, {
      attributes: {
        exclude: ['ownerId', 'owner_id']
      },
      include: [
        { model: RestaurantImage, as: 'images' },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'userName', 'profilePicture', 'email', 'phone_number']
        },
        {
          model: Hotels,
          as: 'hotel',
          attributes: ['id', 'name', 'rating', 'city']
        },
        {
          model: MenuItem,
          as: 'menuItems',
          include: [
            {
              model: Dish,
              attributes: ['name', 'category', 'defaultImage']
            }
          ]
        }
      ]
    });

    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    const reviews = await RestaurantReview.findAll({
      where: { restaurant_id: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'userName', 'profilePicture', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((total, r) => total + parseFloat(r.rating || 0), 0);
      avgRating = (sum / reviews.length).toFixed(1);
    }

    restaurant.setDataValue('avgRating', avgRating);

    let isFavorite = false;
    if (userId) {
      const fav = await RestaurantFavorite.findOne({ where: { user_id: userId, restaurant_id: id } });
      isFavorite = !!fav;
    }

    return res.status(200).json({
      success: true,
      restaurant,
      reviews,
      isFavorite,
      images: restaurant.images || [],
      menu: restaurant.menuItems || []
    });
  } catch (err) {
    console.error("Error in getOne:", err);
    next(err);
  }
};

export const getHotelRestaurant = async (req, res, next) => {
  try {
    const { hotel_id} = req.query;


    if (!hotel_id) {
      return res.status(400).json({ success: false, message: "hotel_id parameter is required." });
    }

    const restaurant = await Restaurant.findOne({
      where: { hotel_id: hotel_id },
      include: [
        {
          model: MenuItem,
          as: 'menuItems',
          attributes: ['id', 'price', 'customImage'],
          include: [
            {
              model: Dish,
              attributes: ['name', 'category', 'defaultImage']
            }
          ]
        }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "No restaurant found for this hotel." });
    }

    return res.status(200).json({
      success: true,
      restaurant
    });
  } catch (err) {
    console.error("Error in getHotelRestaurant:", err);
    next(err);
  }
};

export const getNearbyPage = async (req, res, next) => {
  try {
    let { latitude, longitude, radius = 20, cuisine_type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Latitude and Longitude are required" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    const latDelta = rad / 111;
    const lngDelta = rad / (111 * Math.cos(lat * Math.PI / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const whereCondition = {
      latitude: { [Op.between]: [minLat, maxLat] },
      longitude: { [Op.between]: [minLng, maxLng] }
    };

    if (cuisine_type) {
      whereCondition.cuisine_type = cuisine_type;
    }

    const nearbyRestaurants = await Restaurant.findAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              6371 * acos(
                cos(radians(${lat})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(latitude))
              )
            )`),
            'distance'
          ]
        ]
      },
      having: sequelize.literal(`distance <= ${rad}`),
      order: [[sequelize.literal('distance'), 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: nearbyRestaurants.length,
      restaurants: nearbyRestaurants
    });
  } catch (err) {
    console.error("Error in getNearbyPage:", err);
    next(err);
  }
};



export const getNearbyHotels = async (req, res, next) => {
  try {
    const restaurantId = Number(req.params.restaurantId);
    const radius = 5;

    if (!restaurantId || isNaN(restaurantId)) {
      return res.json({ success: true, data: [] });
    }

    const restaurant = await Restaurant.findByPk(restaurantId, {
      attributes: ['latitude', 'longitude']
    });

    if (!restaurant || !restaurant.latitude || !restaurant.longitude) {
      return res.json({ success: true, data: [] });
    }

    const lat = parseFloat(restaurant.latitude);
    const lng = parseFloat(restaurant.longitude);

    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const whereCondition = {
      lat: { [Op.between]: [minLat, maxLat] },
      lon: { [Op.between]: [minLng, maxLng] }
    };

    // 🛠️ ՀԱՐՑՈՒՄԸ ՄՆՈՒՄ Է ՁԵՐ ՄՈԴԵԼԻ ՕՐԻԳԻՆԱԼ ԴԱՇՏԵՐՈՎ
    const nearbyHotels = await Hotels.findAll({
      where: whereCondition,
      attributes: [
        'id', 'name', 'city', 'country', 'price_from', 'hotel_category',
        [
          literal(`(
            6371 * acos(
              cos(radians(${lat})) * cos(radians(lat)) *
              cos(radians(lon) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(lat))
            )
          )`),
          'distance'
        ]
      ],
      include: [
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["path"],
          where: { is_main: true },
          required: false,
          separate: true,
          limit: 1
        }
      ],
      order: [[literal(`(
        6371 * acos(
          cos(radians(${lat})) * cos(radians(lat)) *
          cos(radians(lon) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(lat))
        )
      )`), 'ASC']],
      limit: 6
    });

    const formattedHotels = nearbyHotels.map(hotel => {
      const hotelJson = hotel.get({ plain: true });

      const firstImage = hotelJson.images && hotelJson.images[0] ? hotelJson.images[0].path : null;

      const { images, ...rest } = hotelJson;

      return {
        id: rest.id,
        title: rest.name,
        badge: rest.hotel_category,
        price_label: rest.price_from ? `$${rest.price_from}` : "$$$",
        location: rest.city ? `${rest.city}, ${rest.country}` : "",
        image: firstImage,
        distance: rest.distance,
        rating: rest.rating || 4.9,
        reviews_count: rest.review_count || 32
      };
    });

    return res.json({
      success: true,
      data: formattedHotels
    });

  } catch (err) {
    console.error("Error in safe getNearbyHotels:", err.message);
    next(err);
  }
};




//sranq petq chen
export const create = async (req, res, next) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only system administrators can create restaurants' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Загрузите хотя бы одно изображение' });
    }

    const restaurant = await Restaurant.create({
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      cuisine_type: req.body.cuisine_type,
      price_range: req.body.price_range,
      hotel_id: req.body.hotel_id || null,
      image: req.files.image ? req.files.image.path : req.files.path,
      owner_id: req.body.owner_id
    });

    const imageData = req.files.image
      ? req.files.image.map(file => ({ restaurant_id: restaurant.id, imageUrl: file.path, publicId: file.filename }))
      : req.files.map(file => ({ restaurant_id: restaurant.id, imageUrl: file.path, publicId: file.filename }));

    await RestaurantImage.bulkCreate(imageData);

    return res.status(201).json({
      success: true,
      message: "Restaurant created successfully by Admin",
      restaurant
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    if (restaurant.owner_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the designated restaurant owner can update this profile' });
    }

    const { name, description, address, cuisine_type, price_range } = req.body;
    await restaurant.update({ name, description, address, cuisine_type, price_range });

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant
    });
  } catch (err) {
    next(err);
  }
};



export const remove = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [{ model: RestaurantImage, as: 'images' }]
    });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only system administrators can delete restaurant profiles' });
    }

    if (restaurant.images && restaurant.images.length > 0) {
      const deletePromises = restaurant.images.map(img => cloudinary.uploader.destroy(img.publicId));
      await Promise.all(deletePromises);
    }

    await restaurant.destroy();
    return res.status(200).json({ success: true, message: "Restaurant deleted successfully by Admin" });
  } catch (err) {
    next(err);
  }
};

export const renderEditForm = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the restaurant owner can access the edit form' });
    }

    return res.status(200).json({
      success: true,
      restaurant
    });
  } catch (err) {
    console.error("Error in renderEditForm:", err);
    next(err);
  }
};


//sa adminin avelacnen apayman
export const getFinalInvoice = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const restaurantOrders = await Order.findAll({
      where: {
        bookingId: booking_id,
        status: 'pending'
      }
    });

    const prepaidAmount = parseFloat(booking.total_price) || 0;

    const additionalRestaurantCharges = restaurantOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.amount) || 0);
    }, 0);

    const totalInvoiceValue = prepaidAmount + additionalRestaurantCharges;
    const amountToPayAtDesk = additionalRestaurantCharges;

    return res.status(200).json({
      success: true,
      invoice: {
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        mealPlanSnapshot: booking.snapshot_meal_plan,
        financials: {
          prepaidAmount,
          additionalRestaurantCharges,
          totalInvoiceValue
        },
        checkoutActionRequired: {
          amountToPayAtDesk,
          paymentStatus: amountToPayAtDesk === 0 ? 'fully_settled' : 'requires_payment'
        }
      }
    });

  } catch (err) {
    console.error("Error in getFinalInvoice:", err);
    next(err);
  }
};




export const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await RestaurantImage.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }]
    });

    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    if (image.restaurant.owner_id !== req.userId) {
      return res.status(403).json({ success: false, message: "Only the restaurant owner can delete images" });
    }

    await cloudinary.uploader.destroy(image.publicId);
    await image.destroy();

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully from gallery"
    });
  } catch (err) {
    console.error("Error in deleteImage:", err);
    next(err);
  }
};


