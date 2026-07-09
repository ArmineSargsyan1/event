import Favorite from "../models/Favorites.js";
import {Hotels} from "../models/index.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Amenity from "../models/Amenity.js";


export const createFavorite = async (req, res) => {
  try {
    const userId = req.userId;

    const { hotelId } = req.body;

    const exists =
      await Favorite.findOne({
        where: {
          user_id: userId,
          hotel_id: hotelId,
        },
      });

    if (exists) {

      return res.status(400).json({
        success: false,
        message: "Already favorite",
      });

    }

    const favorite =
      await Favorite.create({
        user_id: userId,
        hotel_id: hotelId,
      });

    return res.status(201).json({
      success: true,
      favorite,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

export const getFavorites = async (
  req,
  res
) => {

  try {

    const userId = 1
      // req.user.id;

    const favorites =
      await Favorite.findAll({

        where: {
          user_id: userId,
        },

        include: [
          {
            model: Hotels,
            as: "hotel",

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
                as: "Amenities",
                through: {
                  attributes: [],
                },
              },
            ],
          },
        ],

        order: [
          ["createdAt", "DESC"],
        ],
      });

    const data =
      favorites.map(
        ({ hotel }) => ({

          id:
          hotel.id,

          name:
          hotel.name,

          city:
          hotel.city,

          country:
          hotel.country,

          description:
          hotel.description,

          rating:
          hotel.rating,

          reviewCount:
            Number(
              hotel.review_count
            ),

          stars:
          hotel.stars,

          price:
          hotel.price_from,

          property_class:
          hotel.property_class,

          favorite:
            true,

          amenities:
            hotel.Amenities || [],

          images:
            hotel.images?.length
              ? hotel.images
              : [
                {
                  url:
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945",
                },
              ],

        })
      );

    return res.status(200).json({

      success: true,

      data,

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      success: false,

      message:
      error.message,

    });

  }
};



export const deleteFavorite = async (req, res) => {

  try {

    const userId = 1
      // req.user.id;

    const { hotelId } = req.params;

    const favorite =
      await Favorite.findOne({
        where: {
          user_id: userId,
          hotel_id: hotelId,
        },
      });

    if (!favorite) {

      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });

    }

    await favorite.destroy();

    return res.status(200).json({
      success: true,
      message: "Favorite removed",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

export const clearAllFavorites =
  async (req, res) => {

    try {

      const userId = 1
        // req.user.id;

      await Favorite.destroy({
        where: {
          user_id: userId,
        },
      });

      return res.json({
        success: true,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
        error.message,
      });

    }
  };
