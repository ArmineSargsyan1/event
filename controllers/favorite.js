import Favorite from "../models/Favorites.js";
import {Hotels} from "../models/index.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Amenity from "../models/Amenity.js";
import Restaurant from "../models/Restaurant.js";
import RestaurantReview from "../models/RestaurantReview.js";
import RestaurantFavorite from "../models/RestaurantFavorite.js";
import {Op} from "sequelize";


export const createFavorite = async (req, res, next) => {
  try {
    const hotelId = req.params.id;
    const userId = req.userId;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID is required" });
    }

    const [fav, created] = await Favorite.findOrCreate({
      where: {
        user_id: userId,
        hotel_id: hotelId
      }
    });

    return res.status(201).json({ success: true, created, fav });
  } catch (err) {
    console.error("Error in createFavorite (Hotel):", err);
    next(err);
  }
};

export const deleteFavorite = async (req, res, next) => {
  try {
    const hotelId = req.params.id;
    const userId = req.userId;

    await Favorite.destroy({
      where: {
        user_id: userId,
        hotel_id: hotelId
      }
    });

    return res.status(200).json({ success: true, message: "Successfully removed from hotel favorites" });
  } catch (err) {
    console.error("Error in deleteFavorite (Hotel):", err);
    next(err);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || '';

    const hotelWhere = {};
    if (search) {
      hotelWhere.name = { [Op.like]: `%${search}%` };
    }

    let orderClause = [['id', 'DESC']];
    if (sort === 'low') orderClause = [[{ model: Hotels, as: 'hotel' }, 'price_from', 'ASC']];
    if (sort === 'high') orderClause = [[{ model: Hotels, as: 'hotel' }, 'price_from', 'DESC']];

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Hotels,
        as: 'hotel',
        where: hotelWhere
      }],
      order: orderClause,
      limit,
      offset,
      raw: true,
      nest: true
    });

    const formattedHotels = favorites.map(f => {
      if (!f.hotel) return null;

      return {
        ...f.hotel,
        favorite: true,
        price: f.hotel.price_from,
        hotelCategory: f.hotel.hotel_category,
        stars: f.hotel.rating
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      favorites: formattedHotels,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error("Error in getFavorites:", err);
    next(err);
  }
};





export const clearAllFavorites = async (req, res) => {
  console.log(req.userId,888)
    try {

      const userId = req.userId;

      await Favorite.destroy({
        where: {
          user_id: userId,
        },
      });

      return res.json({
        success: true,
      });

    } catch (error) {
      console.log(error)
      return res.status(500).json({
        success: false,
        message:
        error.message,
      });

    }
  };


export const addRestaurantFavorite = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.userId;

    const [fav, created] = await RestaurantFavorite.findOrCreate({
      where: {
        user_id: userId,
        restaurant_id: restaurantId
      }
    });

    return res.status(201).json({
      success: true,
      created,
      fav
    });
  } catch (err) {
    console.error("Error in addRestaurantFavorite:", err);
    next(err);
  }
};

export const removeRestaurantFavorite = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.userId;

    await RestaurantFavorite.destroy({
      where: {
        user_id: userId,
        restaurant_id: restaurantId
      }
    });

    return res.status(200).json({
      success: true,
      message: "Successfully removed from favorites"
    });
  } catch (err) {
    console.error("Error in removeRestaurantFavorite:", err);
    next(err);
  }
};

export const getRestaurantFavorites = async (req, res, next) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const restaurantWhere = {};
    if (search) {
      restaurantWhere.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: favorites } = await RestaurantFavorite.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Restaurant,
        as: 'restaurant',
        where: restaurantWhere
      }],
      order: [['id', 'DESC']],
      limit,
      offset,
      raw: true,
      nest: true
    });

    const reviews = await RestaurantReview.findAll({
      attributes: ['restaurant_id', 'rating'],
      raw: true
    });

    const reviewStats = {};
    reviews.forEach(r => {
      const restId = r.restaurantId || r.restaurant_id;
      if (!restId) return;
      if (!reviewStats[restId]) {
        reviewStats[restId] = { total: 0, count: 0 };
      }
      reviewStats[restId].total += Number(r.rating || 0);
      reviewStats[restId].count += 1;
    });

    const formattedRestaurants = favorites.map(f => {
      if (!f.restaurant) return null;
      const r = f.restaurant;
      const stats = reviewStats[r.id] || { total: 0, count: 0 };

      r.isFavorite = true;
      r.avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : "0.0";
      r.reviewCount = stats.count;
      return r;
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      restaurants: formattedRestaurants,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error("Error in getRestaurantFavorites:", err);
    next(err);
  }
};

export const clearAllRestaurantFavorites = async (req, res, next) => {
  try {
    const userId = req.userId;

    await RestaurantFavorite.destroy({
      where: { user_id: userId }
    });

    return res.status(200).json({
      success: true,
      message: "Successfully cleared all restaurant favorites"
    });
  } catch (err) {
    console.error("Error in clearAllRestaurantFavorites:", err);
    next(err);
  }
};

