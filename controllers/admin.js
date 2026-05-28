import sequelize from "../clients/db.sequelize.mysql.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Hotels from "../models/Hotels.js";
import {cloudinary} from "../middlewares/upload.js";
import {Op, Sequelize, Utils} from "sequelize";
import LocationPoint from "../models/LocationPoint.js";
import Room from "../models/Room.js";
import FileHelper from "../services/Utils.js";
import Amenity from "../models/Amenity.js";
import Reviews from "../models/Reviews.js";
import ReviewLiked from "../models/ReviewLiked.js";
import {Parser} from "json2csv";
import dayjs from "dayjs";
import User from "../models/User.js";
import ReviewReplies from "../models/ReviewReplies.js";


export const getHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await Hotels.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: ["images"],
    });

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};







export const getAdminHotels = async (req, res) => {

  try {

    const {

      // ======================
      // PAGINATION
      // ======================

      page = 1,
      limit = 15,

      // ======================
      // FILTERS
      // ======================

      search = "",
      status = "active",

      property_class,

      city,
      country,

      featured,

      minRating,

      minStars,
      minPrice,
      maxPrice,

      minViews,
      maxViews,

      createdFrom,
      createdTo,

      amenities,

      hasPhotos,
      hasRooms,

      currency,

      stars,

      // ======================
      // SORT
      // ======================

      sort = "newest",

    } = req.query;

    // ======================
    // PAGINATION
    // ======================

    const pageNum =
      Math.max(
        Number(page) || 1,
        1
      );

    const limitNum =
      Math.max(
        Number(limit) || 15,
        1
      );

    const offset =
      (pageNum - 1)
      * limitNum;

    // ======================
    // WHERE
    // ======================

    const where = {

      // SEARCH

      ...(search && {
        name: {
          [Op.like]:
            `%${search}%`,
        },
      }),

      // CITY

      ...(city && {
        city: {
          [Op.like]:
            `%${city}%`,
        },
      }),

      // COUNTRY

      ...(country && {
        country: {
          [Op.like]:
            `%${country}%`,
        },
      }),

      // PROPERTY CLASS

      ...(property_class && {
        property_class,
      }),

      // FEATURED

      ...(featured === "true" && {
        featured: true,
      }),

      // CURRENCY

      ...(currency && {
        currency,
      }),

      // MIN RATING

      ...(minRating && {
        rating: {
          [Op.gte]:
            Number(minRating),
        },
      }),

      // PRICE

      ...((minPrice || maxPrice) && {
        price_from: {

          ...(minPrice && {
            [Op.gte]:
              Number(minPrice),
          }),

          ...(maxPrice && {
            [Op.lte]:
              Number(maxPrice),
          }),

        },
      }),

      // VIEWS

      ...((minViews || maxViews) && {
        views: {

          ...(minViews && {
            [Op.gte]:
              Number(minViews),
          }),

          ...(maxViews && {
            [Op.lte]:
              Number(maxViews),
          }),

        },
      }),

      // CREATED DATE

      ...((createdFrom || createdTo) && {
        created_at: {

          ...(createdFrom && {
            [Op.gte]:
            createdFrom,
          }),

          ...(createdTo && {
            [Op.lte]:
            createdTo,
          }),

        },
      }),

      // STATUS

      ...(status === "inactive" && {
        deleted_at: {
          [Op.ne]: null,
        },
      }),

      ...(status === "active" && {
        deleted_at: null,
      }),

    };

    // ======================
    // SORT
    // ======================

    let order = [
      ["createdAt", "DESC"],
    ];

    if (sort === "oldest") {

      order = [
        ["createdAt", "ASC"],
      ];

    }

    if (sort === "views") {

      order = [
        ["views", "DESC"],
      ];

    }

    if (sort === "name") {

      order = [
        ["name", "ASC"],
      ];

    }

    if (sort === "rating") {

      order = [
        ["rating", "DESC"],
      ];

    }

    if (sort === "price_asc") {

      order = [
        ["price_from", "ASC"],
      ];

    }

    if (sort === "price_desc") {

      order = [
        ["price_from", "DESC"],
      ];

    }

    // ======================
    // QUERY
    // ======================

    const {
      count,
      rows,
    } = await Hotels.findAndCountAll({

      where,

      limit: limitNum,

      offset,

      distinct: true,

      subQuery: false,

      paranoid: false,

      order,

      include: [

        // ======================
        // IMAGES
        // ======================

        {
          model: HotelPhotos,

          as: "images",

          required:
            hasPhotos === "true",
        },

        // ======================
        // ROOMS
        // ======================

        {
          model: Room,

          as: "Rooms",

          attributes: [],

          required:
            hasRooms === "true",
        },

        // ======================
        // AMENITIES
        // ======================

        {
          model: Amenity,

          through: {
            attributes: [],
          },

          required:
            !!amenities,

          ...(amenities && {

            where: {

              id: {
                [Op.in]:

                  amenities
                    .split(",")
                    .map(Number),
              },

            },

          }),

        },

      ],

      // ======================
      // ATTRIBUTES
      // ======================

      attributes: {

        include: [

          [

            Sequelize.fn(
              "COUNT",

              Sequelize.fn(
                "DISTINCT",

                Sequelize.col(
                  "Rooms.id"
                )
              )
            ),

            "rooms_count",

          ],

        ],

      },

      // ======================
      // GROUP
      // ======================

      group: [

        "Hotels.id",

        "images.id",

        "Amenities.id",

      ],

    });

    // ======================
    // FORMAT
    // ======================

    let hotels =
      rows.map((hotel) => {

        const plain =
          hotel.toJSON();

        // ======================
        // GROUPED AMENITIES
        // ======================

        const groupedAmenities =

          Object.entries(

            (plain.Amenities || [])

              .reduce(

                (acc, amenity) => {

                  const category =

                    amenity.category
                    || "Other";

                  if (
                    !acc[category]
                  ) {

                    acc[category] = [];

                  }

                  acc[category].push({

                    id:
                    amenity.id,

                    name:
                    amenity.name,

                    key:
                    amenity.key,

                  });

                  return acc;

                },

                {}
              )

          ).map(

            ([category, items]) => ({

              category,

              items,

            })

          );

        // ======================
        // MAIN PHOTO
        // ======================

        const mainPhoto =

          plain.images?.find(
            (img) =>
              img.is_main
          )?.path

          ||

          plain.images?.[0]?.path

          ||

          null;

        // ======================
        // STARS
        // ======================

        const computedStars =

          FileHelper.getHotelStars({

            ...plain,

            rating:
              plain.rating || 0,

          });

        return {

          // ======================
          // BASIC
          // ======================

          id:
          plain.id,

          name:
          plain.name,

          city:
          plain.city,

          country:
          plain.country,

          address:
          plain.address,

          description:
          plain.description,

          property_class:
          plain.property_class,

          price_from:
          plain.price_from,

          currency:
          plain.currency,

          lat:
          plain.lat,

          lon:
          plain.lon,

          // ======================
          // STATUS
          // ======================

          status:

            plain.deleted_at
              ? "inactive"
              : "active",

          featured:
            plain.featured || false,

          // ======================
          // ANALYTICS
          // ======================

          views:
            plain.views || 0,

          review_count:
            plain.review_count || 0,

          rating:
            plain.rating || 0,

          stars:
          computedStars,

          // ======================
          // COUNTS
          // ======================

          rooms_count:

            Number(
              plain.rooms_count
            ) || 0,

          amenities_count:

            plain.Amenities
              ?.length || 0,

          photos_count:

            plain.images
              ?.length || 0,

          // ======================
          // MEDIA
          // ======================

          mainPhoto,

          images:
            plain.images || [],

          // ======================
          // AMENITIES
          // ======================

          amenities:
          groupedAmenities,

          Amenities:
            plain.Amenities || [],

          // ======================
          // DATES
          // ======================

          createdAt:
          plain.createdAt,

          updatedAt:
          plain.updatedAt,

          deleted_at:
          plain.deleted_at,

        };

      });

    // ======================
    // STARS FILTER
    // ======================

    if (minStars) {

      hotels = hotels.filter((hotel) => {

        return (
          hotel.stars >=
          Number(minStars)
        );

      });

    }

    if (stars) {
      console.log(888)
      hotels =
        hotels.filter((h) => {

          return (

            Math.floor(
              h.stars
            )

            ===

            Number(stars)

          );

        });

    }

    // ======================
    // DATES
    // ======================

    const startOfMonth =

      new Date(

        new Date()
          .getFullYear(),

        new Date()
          .getMonth(),

        1
      );

    // ======================
    // GLOBAL STATS
    // ======================

    const [

      totalHotels,

      activeHotels,

      inactiveHotels,

      hotelsThisMonth,

      activeHotelsThisMonth,

      totalViews,

      totalRooms,

      totalPhotos,

      roomsThisMonth,

    ] = await Promise.all([

      // TOTAL HOTELS

      Hotels.count({
        paranoid: false,
      }),

      // ACTIVE HOTELS

      Hotels.count({

        where: {
          deleted_at: null,
        },

        paranoid: false,
      }),

      // INACTIVE HOTELS

      Hotels.count({

        where: {

          deleted_at: {
            [Op.ne]: null,
          },

        },

        paranoid: false,
      }),

      // HOTELS THIS MONTH

      Hotels.count({

        where: {

          created_at: {
            [Op.gte]:
            startOfMonth,
          },

        },

        paranoid: false,
      }),

      // ACTIVE HOTELS THIS MONTH

      Hotels.count({

        where: {

          deleted_at: null,

          created_at: {
            [Op.gte]:
            startOfMonth,
          },

        },

        paranoid: false,
      }),

      // TOTAL VIEWS

      Hotels.sum(
        "views",
        {
          paranoid: false,
        }
      ),

      // TOTAL ROOMS

      Room.count({
        paranoid: false,
      }),

      // TOTAL PHOTOS

      HotelPhotos.count(),

      // ROOMS THIS MONTH

      Room.count({

        where: {

          created_at: {
            [Op.gte]:
            startOfMonth,
          },

        },

        paranoid: false,
      }),

    ]);

    // ======================
    // STATS
    // ======================

    const stats = {

      totalHotels,

      activeHotels,

      inactiveHotels,

      hotelsThisMonth,

      activeHotelsThisMonth,

      totalViews:
        totalViews || 0,

      totalRooms,

      totalPhotos,

      roomsThisMonth,

      pendingHotels: 2,

      pendingHotelsThisMonth: 2,

    };

    // ======================
    // RESPONSE
    // ======================

    return res.json({

      success: true,

      data: hotels,

      stats,

      pagination: {

        total:

          Array.isArray(count)
            ? count.length
            : count,

        page:
        pageNum,

        pages:

          Math.ceil(

            (
              Array.isArray(count)
                ? count.length
                : count
            )

            / limitNum
          ),

      },

    });

  } catch (e) {

    console.log(
      "GET ADMIN HOTELS ERROR:",
      e
    );

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Failed to fetch admin hotels",

      });

  }

};


export const getAdminTopHotels = async (req, res) => {

  try {

    // ======================
    // TOP HOTELS
    // ======================

    const hotels =
      await Hotels.findAll({

        where: {
          deleted_at: null,
        },

        limit: 6,

        order: [
          ["rating", "DESC"],
        ],

        include: [

          {
            model: HotelPhotos,

            as: "images",

            attributes: [
              "id",
              "path",
              "is_main",
            ],
          },

        ],

      });

    // ======================
    // LOCATION STATS
    // ======================

    const locationStats =
      await Hotels.findAll({

        attributes: [

          "city",

          [
            Sequelize.fn(
              "COUNT",
              Sequelize.col("id")
            ),
            "count",
          ],

        ],

        where: {
          deleted_at: null,
        },

        group: ["city"],

        order: [
          [
            Sequelize.literal("count"),
            "DESC",
          ],
        ],

        limit: 5,

        raw: true,

      });

    // ======================
    // GLOBAL STATS
    // ======================

    const [

      totalHotels,

      activeHotels,

      inactiveHotels,

    ] = await Promise.all([

      Hotels.count({
        paranoid: false,
      }),

      Hotels.count({

        where: {
          deleted_at: null,
        },

        paranoid: false,

      }),

      Hotels.count({

        where: {
          deleted_at: {
            [Op.ne]: null,
          },
        },

        paranoid: false,

      }),

    ]);

    // ======================
    // HOTEL STATISTICS
    // ======================

    const hotelStatistics = {

      total:
      totalHotels,

      active:
      activeHotels,

      inactive:
      inactiveHotels,

    };

    // ======================
    // FORMAT HOTELS
    // ======================

    const formatted =
      hotels.map((hotel) => {

        const plain =
          hotel.toJSON();

        // ======================
        // MAIN PHOTO
        // ======================

        const mainPhoto =

          plain.images?.find(
            (img) =>
              img.is_main === 1
          )?.path

          ||

          plain.images?.[0]?.path

          ||

          null;

        // ======================
        // STARS
        // ======================

        const stars =

          FileHelper.getHotelStars({

            ...plain,

            rating:
              plain.rating || 0,

          });

        return {

          id:
          plain.id,

          name:
          plain.name,

          city:
          plain.city,

          country:
          plain.country,

          category:
          plain.property_class,

          rating:
            plain.rating || 0,

          stars,

          price_from:
          plain.price_from,

          currency:
          plain.currency,

          views:
            plain.views || 0,

          mainPhoto,

        };

      });

    // ======================
    // RESPONSE
    // ======================

    return res.json({

      success: true,

      data: formatted,

      hotelStatistics,

      popularLocations:
      locationStats,

    });

  } catch (e) {

    console.log(
      "GET TOP HOTELS ERROR:",
      e
    );

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Failed to fetch top hotels",

      });

  }

};


// ======================
// ADMIN HOTEL STATS
// ======================

export const getAdminHotelStats =
  async (req, res) => {

    try {

      // ======================
      // LOCATION STATS
      // ======================

      const locationStats =
        await Hotels.findAll({

          attributes: [

            "city",

            [
              Sequelize.fn(
                "COUNT",
                Sequelize.col("id")
              ),
              "count",
            ],

          ],

          where: {
            deleted_at: null,
          },

          group: ["city"],

          order: [
            [
              Sequelize.literal("count"),
              "DESC",
            ],
          ],

          limit: 5,

          raw: true,

        });

      // ======================
      // GLOBAL STATS
      // ======================

      const [

        totalHotels,

        activeHotels,

        inactiveHotels,

      ] = await Promise.all([

        Hotels.count({
          paranoid: false,
        }),

        Hotels.count({

          where: {
            deleted_at: null,
          },

          paranoid: false,

        }),

        Hotels.count({

          where: {
            deleted_at: {
              [Op.ne]: null,
            },
          },

          paranoid: false,

        }),

      ]);

      // ======================
      // HOTEL STATISTICS
      // ======================

      const hotelStatistics = {

        total:
        totalHotels,

        active:
        activeHotels,

        inactive:
        inactiveHotels,

      };

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        hotelStatistics,

        popularLocations:
        locationStats,

      });

    } catch (e) {

      console.log(
        "GET ADMIN HOTEL STATS ERROR:",
        e
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch hotel stats",

        });

    }

  };


// export const getAdminTopHotels = async (req, res) => {
//
//   try {
//
//     const hotels =
//       await Hotels.findAll({
//
//         where: {
//           deleted_at: null,
//         },
//
//         limit: 6,
//
//         order: [
//           ["rating", "DESC"],
//         ],
//
//         include: [
//
//           {
//             model: HotelPhotos,
//
//             as: "images",
//
//             attributes: [
//               "id",
//               "path",
//               "is_main",
//             ],
//           },
//
//         ],
//
//       });
//
//     const formatted =
//       hotels.map((hotel) => {
//
//         const plain =
//           hotel.toJSON();
//
//         // ======================
//         // MAIN PHOTO
//         // ======================
//
//         const mainPhoto =
//
//           plain.images?.find(
//             (img) =>
//               img.is_main === 1
//           )?.path
//
//           ||
//
//           plain.images?.[0]?.path
//
//           ||
//
//           null;
//
//
//
//         // ======================
//         // STARS
//         // ======================
//
//         const stars =
//
//           FileHelper.getHotelStars({
//
//             ...plain,
//
//             rating:
//               plain.rating || 0,
//
//           });
//
//         const locationStats =
//           await Hotels.findAll({
//
//             attributes: [
//
//               "city",
//
//               [
//                 Sequelize.fn(
//                   "COUNT",
//                   Sequelize.col("id")
//                 ),
//                 "count",
//               ],
//
//             ],
//
//             where: {
//               deleted_at: null,
//             },
//
//             group: ["city"],
//
//             order: [
//               [
//                 Sequelize.literal("count"),
//                 "DESC",
//               ],
//             ],
//
//             limit: 5,
//
//             raw: true,
//
//           });
//
// // ======================
// // STATUS STATS
// // ======================
//
//         const hotelStatistics = {
//
//           total: totalHotels,
//
//           active: activeHotels,
//
//           inactive: inactiveHotels,
//
//         };
//
//
//         return {
//
//           id:
//           plain.id,
//
//           name:
//           plain.name,
//
//           city:
//           plain.city,
//
//           country:
//           plain.country,
//
//           category:
//           plain.property_class,
//
//           rating:
//             plain.rating || 0,
//
//           stars,
//
//           price_from:
//           plain.price_from,
//
//           currency:
//           plain.currency,
//
//           views:
//             plain.views || 0,
//
//           mainPhoto,
//
//         };
//
//       });
//
//     return res.json({
//
//       success: true,
//
//       data: formatted,
//
//     });
//
//   } catch (e) {
//
//     console.log(
//       "GET TOP HOTELS ERROR:",
//       e
//     );
//
//     return res
//       .status(500)
//       .json({
//
//         success: false,
//
//         message:
//           "Failed to fetch top hotels",
//
//       });
//
//   }
//
// };


export const syncHotelGallery = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { hotel_id } = req.body;

    /* ---------------- PARSE IMAGES ---------------- */
    let images = req.body.images;

    if (typeof images === "string") {
      images = JSON.parse(images);
    }

    if (!Array.isArray(images)) images = [];

    const mainIndex =
      req.body.mainIndex !== undefined
        ? Number(req.body.mainIndex)
        : null;

    /* ---------------- EXISTING ---------------- */
    const existing = await HotelPhotos.findAll({
      where: { hotel_id },
      transaction,
    });

    /* ---------------- DELETE REMOVED ---------------- */
    const frontendIds = images
      .map((i) => Number(i.id))
      .filter(Boolean);

    const toDelete = existing.filter(
      (img) => !frontendIds.includes(img.id)
    );

    for (const img of toDelete) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    if (toDelete.length > 0) {
      await HotelPhotos.destroy({
        where: { id: toDelete.map((i) => i.id) },
        transaction,
      });
    }

    /* ---------------- UPDATE ORDER ---------------- */
    for (const img of images) {
      if (img.id) {
        await HotelPhotos.update(
          {
            sort_order: img.sort_order ?? 0,
            is_main: !!img.is_main,
          },
          {
            where: { id: img.id },
            transaction,
          }
        );
      }
    }

    /* ---------------- REPLACE IMAGES ---------------- */
    let fileIndex = 0;

    for (const img of images) {
      console.log(img.replaced, 1111)
      if (img.replaced && img.id) {
        console.log(8888)
        const file = req.files?.[fileIndex++];

        if (!file) continue;

        const old = await HotelPhotos.findByPk(img.id);

        if (old?.public_id) {
          await cloudinary.uploader.destroy(old.public_id);
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "hotels",
          quality: "auto",
          fetch_format: "auto",
        });

        await HotelPhotos.update(
          {
            path: result.secure_url,
            public_id: result.public_id,
          },
          {
            where: { id: img.id },
            transaction,
          }
        );
      }
    }

    /* ---------------- NEW UPLOADS ---------------- */
    const newImages = images.filter((img) => !img.id && img.isNew);

    let newPhotos = [];

    if (req.files?.length > fileIndex) {
      const files = req.files.slice(fileIndex);

      const uploads = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "hotels",
          quality: "auto",
          fetch_format: "auto",
        });

        uploads.push({
          hotel_id,
          path: result.secure_url,
          public_id: result.public_id,
          sort_order: newImages[i]?.sort_order ?? 9999,
          is_main: false,
        });
      }

      newPhotos = await HotelPhotos.bulkCreate(uploads, {
        transaction,
      });
    }

    /* ---------------- MAIN IMAGE ---------------- */
    await HotelPhotos.update(
      { is_main: false },
      { where: { hotel_id }, transaction }
    );

    let mainImage = images.find((i) => i.is_main && i.id);

    if (!mainImage && newPhotos.length && mainIndex !== null) {
      mainImage = newPhotos[mainIndex];
    }

    if (!mainImage) {
      const first = await HotelPhotos.findOne({
        where: { hotel_id },
        order: [["sort_order", "ASC"]],
        transaction,
      });

      if (first) {
        await first.update({ is_main: true }, { transaction });
      }
    } else {
      await HotelPhotos.update(
        { is_main: true },
        {
          where: { id: mainImage.id },
          transaction,
        }
      );
    }

    /* ---------------- COMMIT ---------------- */
    await transaction.commit();

    const updated = await HotelPhotos.findAll({
      where: { hotel_id },
      order: [["sort_order", "ASC"]],
    });

    return res.json({
      success: true,
      images: updated,
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};



// controllers/hotel.controller.js



export const createHotel = async (req, res) => {
  console.log(req.body.property_class,999)
  try {
    const {
      name,
      description,
      price_from,
      currency,
      city,
      country,
      property_class,
      address,
      lat,
      lon,
      amenities = [],
      location_points = [],
    } = req.body;


    const hotel = await Hotels.create({
      name,
      description,
      price_from,
      currency,
      city,
      country,
      property_class,
      address,
      lat,
      lon,
    });

    // ✅ Amenities (M:N)
    if (amenities.length) {
      await hotel.setAmenities(amenities);
    }

    // ✅ Location points (1:N)
    if (location_points.length) {
      const points = location_points.map((p) => ({
        ...p,
        hotel_id: hotel.id,
      }));

      await LocationPoint.bulkCreate(points);
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (e) {
    console.log("🔥 CREATE HOTEL ERROR:", e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


// export const createHotel = async (req, res) => {
//   console.log(req.body,888)
//   try {
//     const {
//       name,
//       description,
//       price_from,
//       currency,
//       city,
//       country,
//       amenities = [],
//     } = req.body;
//
//     const hotel = await Hotels.create({
//       name,
//       description,
//       price_from,
//       currency,
//       city,
//       country,
//     });
//
//     if (amenities.length) {
//       await hotel.setAmenities(amenities); // 👈 magic Sequelize method
//     }
//
//     res.json({
//       success: true,
//       data: hotel,
//     });
//   } catch (e) {
//     console.log("🔥 CREATE HOTEL ERROR:", e); // 👈 սա պարտադիր
//
//     res.status(500).json({
//       success: false,
//       message: e.message,
//     });
//   }
// };

export const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { amenities, ...data } = req.body;

    const hotel = await Hotels.findByPk(id);

    if (!hotel) {
      return res.status(404).json({ message: "Not found" });
    }

    await hotel.update(data);

    if (amenities) {
      await hotel.setAmenities(amenities); // replace all
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};


export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotels.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Not found" });
    }

    await hotel.destroy(); // 🔥 սա է ճիշտը

    res.json({
      success: true,
      message: "Moved to trash",
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

export const restoreHotel = async (req, res) => {
  try {
    console.log("RESTORE HIT");

    const hotel = await Hotels.findByPk(req.params.id, {
      paranoid: false, // 👈 տեսնի deleted-ները
    });

    if (!hotel) {
      return res.status(404).json({ message: "Not found" });
    }

    await hotel.restore(); // 👈 ճիշտ ձև

    res.json({
      success: true,
      message: "Restored",
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

export const getInactiveHotels = async (req, res) => {
  try {
    const hotels = await Hotels.findAll({
      where: {
        deleted_at: {
          [Op.ne]: null,
        },
      },
      paranoid: false, // 🔥 VERY IMPORTANT
      order: [["id", "DESC"]],
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


//reviews

// ======================
// ADMIN REVIEWS DASHBOARD
// ======================


export const getAdminReviewsDashboard =
  async (req, res) => {

    try {

      // ======================
      // TOTAL REVIEWS
      // ======================

      const totalReviews =
        await Reviews.count();

      // ======================
      // AVERAGE SCORE
      // ======================

      const averageResult =
        await Reviews.findOne({

          attributes: [

            [
              Sequelize.fn(
                "AVG",
                Sequelize.col("score")
              ),
              "averageScore",
            ],

          ],

          raw: true,

        });

      const averageScore =
        averageResult?.averageScore || 0;

      // ======================
      // POSITIVE REVIEWS
      // ======================

      const positiveReviews =
        await Reviews.count({

          where: {

            score: {
              [Op.gte]: 8,
            },

          },

        });

      // ======================
      // POSITIVE %
      // ======================

      const positivePercentage =

        totalReviews > 0

          ? Math.round(

            (
              positiveReviews /
              totalReviews
            ) * 100

          )

          : 0;

      // ======================
      // NEW REVIEWS TODAY
      // ======================

      const startOfDay =
        new Date();

      // ======================
// NEW REVIEWS THIS MONTH
// ======================

      const startOfMonth =
        dayjs()
          .startOf("month")
          .toDate();

      const newReviewsThisMonth =
        await Reviews.count({

          where: {

            createdAt: {
              [Op.gte]:
              startOfMonth,
            },

          },

        });

      const newReviewsToday =
        await Reviews.count({

          where: {

            createdAt: {
              [Op.gte]:
              startOfDay,
            },

          },

        });

      // ======================
      // LATEST REVIEWS
      // ======================

      const latestReviews =
        await Reviews.findAll({

          limit: 6,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {
              model: Hotels,

              attributes: [
                "id",
                "name",
                "city",
                "country",
                "price_from",
              ],
            },

            {
              model: ReviewLiked,

              as: "liked_features",

              attributes: [
                "id",
                "feature",
              ],
            },

          ],

        });

      // ======================
      // RATING OVERVIEW
      // ======================

      const ratingOverview = [

        {
          label: "Excellent",
          min: 9,
          max: 10,
        },

        {
          label: "Very Good",
          min: 8,
          max: 8.9,
        },

        {
          label: "Good",
          min: 7,
          max: 7.9,
        },

        {
          label: "Average",
          min: 5,
          max: 6.9,
        },

        {
          label: "Poor",
          min: 0,
          max: 4.9,
        },

      ];

      const formattedOverview =
        await Promise.all(

          ratingOverview.map(
            async (item) => {

              const count =
                await Reviews.count({

                  where: {

                    score: {

                      [Op.gte]:
                      item.min,

                      [Op.lte]:
                      item.max,

                    },

                  },

                });

              const percent =

                totalReviews > 0

                  ? Math.round(

                    (
                      count /
                      totalReviews
                    ) * 100

                  )

                  : 0;

              return {

                label:
                item.label,

                percent,

              };

            }
          )

        );

      // ======================
      // TOP REVIEWED HOTELS
      // ======================

      const topHotels =
        await Hotels.findAll({

          include: [

            {
              model: Reviews,
              attributes: [],
            },

            {
              model: HotelPhotos,

              as: "images",

              attributes: [
                "id",
                "path",
                "is_main",
              ],
            },

          ],

          attributes: [

            "id",

            "name",

            "city",

            "country",

            "price_from",

            "currency",

            "property_class",

            [

              Sequelize.fn(
                "AVG",
                Sequelize.col(
                  "Reviews.score"
                )
              ),

              "rating",

            ],

            [

              Sequelize.fn(
                "COUNT",
                Sequelize.col(
                  "Reviews.id"
                )
              ),

              "reviewCount",

            ],

          ],

          group: [
            "Hotels.id",
            "images.id",
          ],

          order: [

            [
              Sequelize.literal(
                "rating"
              ),
              "DESC",
            ],

          ],

          limit: 6,

          subQuery: false,

        });

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        // ======================
        // STATS
        // ======================

        stats: {

          averageRating:

            Number(
              averageScore || 0
            ).toFixed(1),

          totalReviews,

          positivePercentage,

          newReviewsThisMonth,

        },

        // ======================
        // LATEST REVIEWS
        // ======================

        latestReviews:

          latestReviews.map(
            (review) => ({

              id:
              review.id,

              userName:
              review.reviewer_name,

              hotelName:
              review.Hotel?.name,

              rating:
                Number(
                  review.score
                ),

              comment:
              review.comment,

              createdAt:
              review.createdAt,

              verified:
              review.verified,

              likedFeatures:

                review.liked_features?.map(
                  (item) =>
                    item.feature
                ) || [],

            })
          ),

        // ======================
        // OVERVIEW
        // ======================

        ratingOverview:
        formattedOverview,

        // ======================
        // TOP HOTELS
        // ======================

        topHotels:

          topHotels.map(
            (hotel) => {

              const plain =
                hotel.toJSON();

              const mainPhoto =

                plain.images?.find(
                  (img) =>
                    img.is_main === 1
                )?.path

                ||

                plain.images?.[0]?.path

                ||

                null;

              return {

                id:
                plain.id,

                name:
                plain.name,

                rating:

                  Number(
                    plain.rating || 0
                  ).toFixed(1),

                reviewCount:

                  Number(
                    plain.reviewCount || 0
                  ),

                city:
                plain.city,

                country:
                plain.country,

                price_from:
                plain.price_from,

                currency:
                plain.currency,

                category:
                plain.property_class,

                mainPhoto,

              };

            }
          ),

      });

    } catch (e) {

      console.log(
        "ADMIN REVIEWS DASHBOARD ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch reviews dashboard",

      });

    }

  };



export const getAdminAllReviews =
  async (req, res) => {

    try {

      const {

        page = 1,

        limit = 10,

        hotel_id,

        search,

        min_score,

        max_score,

        verified,

        traveller_type,

        sort = "newest",

      } = req.query;

      // ======================
      // PAGINATION
      // ======================

      const pageNum =
        Number(page);

      const limitNum =
        Number(limit);

      const offset =
        (pageNum - 1) * limitNum;

      // ======================
      // WHERE
      // ======================

      const where = {};

      // ======================
      // HOTEL FILTER
      // ======================

      if (hotel_id) {

        where.hotel_id =
          hotel_id;

      }

      // ======================
      // TRAVELLER TYPE
      // ======================

      if (traveller_type) {

        where.traveller_type =
          traveller_type;

      }

      // ======================
      // SCORE FILTER
      // ======================

      if (
        min_score ||
        max_score
      ) {

        where.score = {};

        if (min_score) {

          where.score[
            Op.gte
            ] = Number(min_score);

        }

        if (max_score) {

          where.score[
            Op.lte
            ] = Number(max_score);

        }

      }

      // ======================
      // VERIFIED FILTER
      // ======================

      if (
        verified === "true" ||
        verified === "false"
      ) {

        where.verified =
          verified === "true";

      }

      // ======================
      // SEARCH
      // ======================

      if (search) {

        where[Op.or] = [

          {
            reviewer_name: {
              [Op.like]:
                `%${search}%`,
            },
          },

          {
            comment: {
              [Op.like]:
                `%${search}%`,
            },
          },

        ];

      }

      // ======================
      // SORT
      // ======================

      let order = [
        ["createdAt", "DESC"],
      ];

      const sortMap = {

        newest: [
          "createdAt",
          "DESC",
        ],

        oldest: [
          "createdAt",
          "ASC",
        ],

        score_high: [
          "score",
          "DESC",
        ],

        score_low: [
          "score",
          "ASC",
        ],

      };

      if (
        sort &&
        sortMap[sort]
      ) {

        order = [
          sortMap[sort],
        ];

      }

      // ======================
      // GET REVIEWS
      // ======================

      const {

        rows,

        count,

      } =
        await Reviews.findAndCountAll({

          where,

          limit: limitNum,

          offset,

          order,

          distinct: true,

          include: [

            {
              model: Hotels,

              attributes: [

                "id",

                "name",

                "city",

                "country",

              ],
            },

            {
              model: ReviewLiked,

              as: "liked_features",

              attributes: [

                "id",

                "feature",

              ],
            },

            {
              model:
              ReviewReplies,

              as: "replies",

              attributes: [

                "id",

                "reply",

                "owner_id",

                "is_edited",

                "createdAt",

              ],

              include: [

                {
                  model: User,
                  as: "owner",
                  attributes: [
                    "id",
                    "userName",
                    "profilePicture",
                  ]

                },

              ],
            },

          ],

        });

      // ======================
      // TRAVELLER INSIGHTS
      // ======================

      const travellerInsights =
        await Reviews.findAll({

          attributes: [

            "traveller_type",

            [

              Sequelize.fn(
                "COUNT",
                Sequelize.col("id")
              ),

              "totalReviews",

            ],

            [

              Sequelize.fn(
                "AVG",
                Sequelize.col("score")
              ),

              "averageRating",

            ],

          ],

          group: [
            "traveller_type",
          ],

          order: [

            [
              Sequelize.literal(
                "totalReviews"
              ),
              "DESC",
            ],

          ],

          raw: true,

        });

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        data:
          rows.map(
            (review) => ({

              id:
              review.id,

              reviewer_name:
              review.reviewer_name,

              traveller_type:
              review.traveller_type,

              stay_duration:
              review.stay_duration,

              stay_date:
              review.stay_date,

              hotel:
              review.Hotel,

              score:
                Number(
                  review.score
                ),

              comment:
              review.comment,

              verified:
              review.verified,

              createdAt:
              review.createdAt,

              likedFeatures:

                review
                  .liked_features
                  ?.map(
                    (item) =>
                      item.feature
                  ) || [],

              replies:

                review.replies?.map(
                  (reply) => ({

                    id:
                    reply.id,

                    reply:
                    reply.reply,

                    is_edited:
                    reply.is_edited,

                    createdAt:
                    reply.createdAt,

                    owner:
                    reply.owner,

                  })
                ) || [],

            })
          ),

        travellerInsights,

        pagination: {

          total:
          count,

          page:
          pageNum,

          limit:
          limitNum,

          pages:

            Math.ceil(
              count / limitNum
            ),

        },

      });

    } catch (e) {

      console.log(
        "GET ADMIN ALL REVIEWS ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch reviews",

      });

    }

  };



// export const getAdminAllReviews =
//   async (req, res) => {
//
//     try {
//
//       const {
//
//         page = 1,
//
//         limit = 10,
//
//         hotel_id,
//
//         search,
//
//         min_score,
//
//         max_score,
//
//         verified,
//
//         traveller_type,
//
//         sort = "newest",
//
//       } = req.query;
//
//       // ======================
//       // PAGINATION
//       // ======================
//
//       const pageNum =
//         Number(page);
//
//       const limitNum =
//         Number(limit);
//
//       const offset =
//         (pageNum - 1) * limitNum;
//
//       // ======================
//       // WHERE
//       // ======================
//
//       const where = {};
//
//       // ======================
//       // HOTEL FILTER
//       // ======================
//
//       if (hotel_id) {
//
//         where.hotel_id =
//           hotel_id;
//
//       }
//
//       // ======================
//       // TRAVELLER TYPE
//       // ======================
//
//       if (traveller_type) {
//
//         where.traveller_type =
//           traveller_type;
//
//       }
//
//       // ======================
//       // SCORE FILTER
//       // ======================
//
//       if (
//         min_score ||
//         max_score
//       ) {
//
//         where.score = {};
//
//         if (min_score) {
//
//           where.score[
//             Op.gte
//             ] = Number(min_score);
//
//         }
//
//         if (max_score) {
//
//           where.score[
//             Op.lte
//             ] = Number(max_score);
//
//         }
//
//       }
//
//       // ======================
//       // VERIFIED FILTER
//       // ======================
//
//       if (
//         verified === "true" ||
//         verified === "false"
//       ) {
//
//         where.verified =
//           verified === "true";
//
//       }
//
//       // ======================
//       // SEARCH
//       // ======================
//
//       if (search) {
//
//         where[Op.or] = [
//
//           {
//             reviewer_name: {
//               [Op.like]:
//                 `%${search}%`,
//             },
//           },
//
//           {
//             comment: {
//               [Op.like]:
//                 `%${search}%`,
//             },
//           },
//
//         ];
//
//       }
//
//       // ======================
//       // SORT
//       // ======================
//
//       let order = [
//         ["createdAt", "DESC"],
//       ];
//
//       const sortMap = {
//
//         newest: [
//           "createdAt",
//           "DESC",
//         ],
//
//         oldest: [
//           "createdAt",
//           "ASC",
//         ],
//
//         score_high: [
//           "score",
//           "DESC",
//         ],
//
//         score_low: [
//           "score",
//           "ASC",
//         ],
//
//       };
//
//       if (
//         sort &&
//         sortMap[sort]
//       ) {
//
//         order = [
//           sortMap[sort],
//         ];
//
//       }
//
//       // ======================
//       // GET REVIEWS
//       // ======================
//
//       const {
//
//         rows,
//
//         count,
//
//       } = await Reviews.findAndCountAll({
//
//         where,
//
//         limit: limitNum,
//
//         offset,
//
//         order,
//
//         distinct: true,
//
//         include: [
//
//           {
//             model: Hotels,
//
//             attributes: [
//
//               "id",
//
//               "name",
//
//               "city",
//
//               "country",
//
//             ],
//
//           },
//
//           {
//             model: ReviewLiked,
//
//             as: "liked_features",
//
//             attributes: [
//
//               "id",
//
//               "feature",
//
//             ],
//
//           },
//
//         ],
//
//       });
//
//       // ======================
//       // TRAVELLER INSIGHTS
//       // ======================
//
//       const travellerInsights =
//         await Reviews.findAll({
//
//           attributes: [
//
//             "traveller_type",
//
//             [
//
//               Sequelize.fn(
//                 "COUNT",
//                 Sequelize.col("id")
//               ),
//
//               "totalReviews",
//             ],
//
//             [
//
//               Sequelize.fn(
//                 "AVG",
//                 Sequelize.col("score")
//               ),
//
//               "averageRating",
//             ],
//
//           ],
//
//           group: ["traveller_type"],
//
//           order: [
//
//             [
//               Sequelize.literal(
//                 "totalReviews"
//               ),
//               "DESC",
//             ],
//
//           ],
//
//           raw: true,
//
//         });
//
//       // ======================
//       // RESPONSE
//       // ======================
//
//       return res.json({
//
//         success: true,
//
//         data:
//
//           rows.map(
//             (review) => ({
//
//               id:
//               review.id,
//
//               reviewer_name:
//               review.reviewer_name,
//
//               traveller_type:
//               review.traveller_type,
//
//               stay_duration:
//               review.stay_duration,
//
//               stay_date:
//               review.stay_date,
//
//               hotel:
//               review.Hotel,
//
//               score:
//                 Number(
//                   review.score
//                 ),
//
//               comment:
//               review.comment,
//
//               verified:
//               review.verified,
//
//               createdAt:
//               review.createdAt,
//
//               likedFeatures:
//
//                 review
//                   .liked_features
//                   ?.map(
//                     (item) =>
//                       item.feature
//                   ) || [],
//
//             })
//           ),
//
//         travellerInsights,
//
//         pagination: {
//
//           total:
//           count,
//
//           page:
//           pageNum,
//
//           limit:
//           limitNum,
//
//           pages:
//
//             Math.ceil(
//               count / limitNum
//             ),
//
//         },
//
//       });
//
//     } catch (e) {
//
//       console.log(
//         "GET ADMIN ALL REVIEWS ERROR:",
//         e
//       );
//
//       return res.status(500).json({
//
//         success: false,
//
//         message:
//           "Failed to fetch reviews",
//
//       });
//
//     }
//
//   };
//


// ======================
// EXPORT REVIEWS REPORT
// ======================

export const exportReviewsReport =
  async (req, res) => {

    try {

      // ======================
      // GET REVIEWS
      // ======================

      const reviews =
        await Reviews.findAll({

          include: [

            {
              model: Hotels,

              attributes: [
                "name",
                "city",
                "country",
              ],
            },

          ],

          order: [
            ["createdAt", "DESC"],
          ],

        });

      // ======================
      // FORMAT DATA
      // ======================

      const formatted =
        reviews.map((review) => ({

          Reviewer:
          review.reviewer_name,

          Hotel:
            review.Hotel?.name || "",

          City:
            review.Hotel?.city || "",

          Country:
            review.Hotel?.country || "",

          Rating:
          review.score,

          Comment:
            review.comment || "",

          Verified:
            review.verified
              ? "Yes"
              : "No",

          Date:
          review.createdAt,

        }));

      // ======================
      // CSV
      // ======================

      const json2csv =
        new Parser();

      const csv =
        json2csv.parse(formatted);

      // ======================
      // HEADERS
      // ======================

      res.header(
        "Content-Type",
        "text/csv"
      );

      res.attachment(
        "reviews-report.csv"
      );

      // ======================
      // RESPONSE
      // ======================

      return res.send(csv);

    } catch (e) {

      console.log(
        "EXPORT REVIEWS ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to export report",

      });

    }

  };



// ======================
// DELETE REVIEW
// ======================

export const deleteReview =
  async (req, res) => {

    try {

      const {id} = req.params;

      // ======================
      // FIND REVIEW
      // ======================

      const review =
        await Reviews.findByPk(id);

      if (!review) {

        return res.status(404).json({

          success: false,

          message:
            "Review not found",

        });

      }

      // ======================
      // DELETE
      // ======================

      await review.destroy();

      // ======================
      // RESPONSE
      // ======================

      return res.json({

        success: true,

        message:
          "Review deleted successfully",

      });

    } catch (e) {

      console.log(
        "DELETE REVIEW ERROR:",
        e
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to delete review",

      });

    }

  };




///users


// export const getUserStats = async (
//   req,
//   res
// ) => {
//
//   try {
//
//     // =========================
//     // DATES
//     // =========================
//
//     const startOfMonth =
//       dayjs()
//         .startOf("month")
//         .toDate();
//
//     const startOfLastMonth =
//       dayjs()
//         .subtract(1, "month")
//         .startOf("month")
//         .toDate();
//
//     const endOfLastMonth =
//       dayjs()
//         .subtract(1, "month")
//         .endOf("month")
//         .toDate();
//
//
//     // =========================
//     // USERS
//     // =========================
//
//     const totalUsers =
//       await User.count();
//
//     const activeUsers =
//       await User.count({
//         where: {
//           isActive: true,
//         },
//       });
//
//     const inactiveUsers =
//       await User.count({
//         where: {
//           isActive: false,
//         },
//       });
//
//
//     // =========================
//     // MONTHLY USERS
//     // =========================
//
//     const thisMonthUsers =
//       await User.count({
//         where: {
//           createdAt: {
//             [Op.gte]:
//             startOfMonth,
//           },
//         },
//       });
//
//     const lastMonthUsers =
//       await User.count({
//         where: {
//           createdAt: {
//             [Op.between]: [
//               startOfLastMonth,
//               endOfLastMonth,
//             ],
//           },
//         },
//       });
//
//
//     // =========================
//     // PERCENT FUNCTION
//     // =========================
//
//     const calcPercent = (
//       current,
//       previous
//     ) => {
//
//       if (previous === 0) {
//         return "+100%";
//       }
//
//       const percent =
//         (
//           (
//             (
//               current -
//               previous
//             ) /
//             previous
//           ) * 100
//         ).toFixed(1);
//
//       return `${
//         percent >= 0
//           ? "+"
//           : ""
//       }${percent}%`;
//     };
//
//
//     // =========================
//     // STATS
//     // =========================
//
//     const stats = [
//
//       {
//         key: "totalUsers",
//
//         title:
//           "Total Users",
//
//         value:
//           totalUsers.toLocaleString(),
//
//         percent:
//           calcPercent(
//             thisMonthUsers,
//             lastMonthUsers
//           ),
//
//         description:
//           "vs last month",
//       },
//
//       {
//         key: "activeUsers",
//
//         title:
//           "Active Users",
//
//         value:
//           activeUsers.toLocaleString(),
//
//         const calcPercent = (
//           current,
//           previous
//         ) => {
//
//           if (previous === 0) {
//             return "+100%";
//           }
//
//           const percent =
//             parseFloat(
//               (
//                 (
//                   (
//                     current -
//                     previous
//                   ) /
//                   previous
//                 ) * 100
//               ).toFixed(2)
//             );
//
//           return `${
//             percent >= 0
//               ? "+"
//               : ""
//           }${percent}%`;
//         }
//
//         percent:
//           `${(
//             (
//               activeUsers /
//               totalUsers
//             ) * 100
//           ).toFixed(1)}%`,
//
//         description:
//           "currently active",
//       },
//
//       {
//         key: "newUsers",
//
//         title:
//           "New Users",
//
//         value:
//           thisMonthUsers.toLocaleString(),
//
//         percent:
//           calcPercent(
//             thisMonthUsers,
//             lastMonthUsers
//           ),
//
//         description:
//           "this month",
//       },
//
//       {
//         key: "inactiveUsers",
//
//         title:
//           "Inactive Users",
//
//         value:
//           inactiveUsers.toLocaleString(),
//
//         percent:
//           `${(
//             (
//               inactiveUsers /
//               totalUsers
//             ) * 100
//           ).toFixed(1)}%`,
//
//         description:
//           "not activated",
//       },
//
//     ];
//
//
//     // =========================
//     // RESPONSE
//     // =========================
//
//     res.status(200).json({
//
//       success: true,
//
//       stats,
//
//     });
//
//   }
//
//   catch (error) {
//
//     console.log(error);
//
//     res.status(500).json({
//
//       success: false,
//
//       message:
//         "Failed to fetch user stats",
//
//     });
//
//   }
//
// };


export const getUserStats = async (
  req,
  res
) => {

  try {

    // =========================
    // DATES
    // =========================

    const startOfMonth =
      dayjs()
        .startOf("month")
        .toDate();

    const startOfLastMonth =
      dayjs()
        .subtract(1, "month")
        .startOf("month")
        .toDate();

    const endOfLastMonth =
      dayjs()
        .subtract(1, "month")
        .endOf("month")
        .toDate();


    // =========================
    // USERS
    // =========================

    const totalUsers =
      await User.count();

    const activeUsers =
      await User.count({
        where: {
          isActive: true,
        },
      });

    const inactiveUsers =
      await User.count({
        where: {
          isActive: false,
        },
      });


    // =========================
    // MONTHLY USERS
    // =========================

    const thisMonthUsers =
      await User.count({
        where: {
          createdAt: {
            [Op.gte]:
            startOfMonth,
          },
        },
      });

    const lastMonthUsers =
      await User.count({
        where: {
          createdAt: {
            [Op.between]: [
              startOfLastMonth,
              endOfLastMonth,
            ],
          },
        },
      });


    // =========================
    // PERCENT FUNCTION
    // =========================

    const calcPercent = (
      current,
      previous
    ) => {

      if (previous === 0) {
        return "+100%";
      }

      const percent =
        parseFloat(
          (
            (
              (
                current -
                previous
              ) /
              previous
            ) * 100
          ).toFixed(2)
        );

      return `${
        percent >= 0
          ? "+"
          : ""
      }${percent}%`;
    };


    // =========================
    // STATS
    // =========================

    const stats = [

      {
        key: "totalUsers",

        title:
          "Total Users",

        value:
          totalUsers.toLocaleString(),

        percent:
          calcPercent(
            thisMonthUsers,
            lastMonthUsers
          ),

        description:
          "vs last month",
      },

      {
        key: "activeUsers",

        title:
          "Active Users",

        value:
          activeUsers.toLocaleString(),

        percent:
          `${parseFloat(
            (
              (
                activeUsers /
                totalUsers
              ) * 100
            ).toFixed(1)
          )}%`,

        description:
          "currently active",
      },

      {
        key: "newUsers",

        title:
          "New Users",

        value:
          thisMonthUsers.toLocaleString(),

        percent:
          calcPercent(
            thisMonthUsers,
            lastMonthUsers
          ),

        description:
          "this month",
      },

      {
        key: "inactiveUsers",

        title:
          "Inactive Users",

        value:
          inactiveUsers.toLocaleString(),

        percent:
          `${parseFloat(
            (
              (
                inactiveUsers /
                totalUsers
              ) * 100
            ).toFixed(1)
          )}%`,

        description:
          "not activated",
      },

    ];


    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({

      success: true,

      stats,

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Failed to fetch user stats",

    });

  }

};


export const getAllAdminUsers = async (req, res) => {
  console.log(req.query)
  try {

    const {
      search = "",
      role,
      status,
      country
    } = req.query;

    const where = {};

    // SEARCH

    if (search) {

      where[Op.or] = [

        {
          userName: {
            [Op.like]:
              `%${search}%`,
          },
        },

        {
          email: {
            [Op.like]:
              `%${search}%`,
          },
        },

      ];
    }

    //Country

    if (
      country &&
      country !== "All"
    ) {

      where.country =
        country;

    }

    // ROLE

    if (
      role &&
      role !== "All"
    ) {

      where.role =
        role.toLowerCase();

    }

    // STATUS

    if (
      status &&
      status !== "All"
    ) {

      where.isActive =
        status === "Active";

    }

    const users =
      await User.findAll({

        where,

        order: [
          ["createdAt", "DESC"],
        ],

      });

    res.json({

      success: true,

      users,

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

    });

  }

};


// export const getAllAdminUsers = async (
//   req,
//   res
// ) => {
//
//   try {
//
//     const users =
//       await User.findAll({
//
//         order: [
//           ["createdAt", "DESC"],
//         ],
//
//       });
//
//     const formattedUsers =
//       users.map((user) => ({
//
//         id: user.id,
//
//         name:
//         user.userName,
//
//         email:
//         user.email,
//
//         image:
//           user.profilePicture ||
//           `https://i.pravatar.cc/150?u=${user.email}`,
//
//         role:
//           user.role.charAt(0)
//             .toUpperCase() +
//           user.role.slice(1),
//
//         status:
//           user.isActive
//             ? "Active"
//             : "Inactive",
//
//         country:
//           "Armenia",
//
//         createdAt:
//           new Date(
//             user.createdAt
//           ).toLocaleDateString(),
//
//       }));
//
//
//     res.status(200).json({
//
//       success: true,
//
//       users:
//       formattedUsers,
//
//     });
//
//   }
//
//   catch (error) {
//
//     console.log(error);
//
//     res.status(500).json({
//
//       success: false,
//
//       message:
//         "Failed to fetch users",
//
//     });
//
//   }
//
// };


// export const getAdminReviewsDashboard =
//   async (req, res) => {
//
//     try {
//
//       // ======================
//       // TOTAL REVIEWS
//       // ======================
//
//       const totalReviews =
//         await Reviews.count();
//
//       // ======================
//       // AVERAGE SCORE
//       // ======================
//
//       const averageResult =
//         await Reviews.findOne({
//
//           attributes: [
//
//             [
//               Sequelize.fn(
//                 "AVG",
//                 Sequelize.col("score")
//               ),
//               "averageScore",
//             ],
//
//           ],
//
//           raw: true,
//
//         });
//
//       const averageScore =
//         averageResult?.averageScore || 0;
//
//
//       // ======================
//       // POSITIVE REVIEWS
//       // 8-10 SCORE
//       // ======================
//
//       const positiveReviews =
//         await Reviews.count({
//
//           where: {
//
//             score: {
//               [Op.gte]: 8,
//             },
//
//           },
//
//         });
//
//       // ======================
//       // POSITIVE %
//       // ======================
//
//       const positivePercentage =
//
//         totalReviews > 0
//
//           ? Math.round(
//
//             (
//               positiveReviews /
//               totalReviews
//             ) * 100
//
//           )
//
//           : 0;
//
//       // ======================
//       // LATEST REVIEWS
//       // ======================
//
//       const latestReviews =
//         await Reviews.findAll({
//
//           limit: 5,
//
//           order: [
//             ["createdAt", "DESC"],
//           ],
//
//           include: [
//
//             {
//               model: Hotels,
//
//               attributes: [
//                 "id",
//                 "name",
//                 "city",
//                 "country",
//                 "price_from"
//               ],
//             },
//
//           ],
//
//         });
//
//       // ======================
//       // RATING OVERVIEW
//       // ======================
//
//       const ratingOverview = [
//
//         {
//           label: "Excellent",
//           min: 9,
//           max: 10,
//         },
//
//         {
//           label: "Very Good",
//           min: 8,
//           max: 8.9,
//         },
//
//         {
//           label: "Good",
//           min: 7,
//           max: 7.9,
//         },
//
//         {
//           label: "Average",
//           min: 5,
//           max: 6.9,
//         },
//
//         {
//           label: "Poor",
//           min: 0,
//           max: 4.9,
//         },
//
//       ];
//
//       const formattedOverview =
//         await Promise.all(
//
//           ratingOverview.map(
//             async (item) => {
//
//               const count =
//                 await Reviews.count({
//
//                   where: {
//
//                     score: {
//
//                       [Op.gte]:
//                       item.min,
//
//                       [Op.lte]:
//                       item.max,
//
//                     },
//
//                   },
//
//                 });
//
//               const percent =
//
//                 totalReviews > 0
//
//                   ? Math.round(
//
//                     (
//                       count /
//                       totalReviews
//                     ) * 100
//
//                   )
//
//                   : 0;
//
//               return {
//
//                 label:
//                 item.label,
//
//                 percent,
//
//               };
//
//             }
//           )
//
//         );
//
//       // ======================
//       // TOP REVIEWED HOTELS
//       // ======================
//
//       const topHotels =
//         await Hotels.findAll({
//
//           include: [
//
//             {
//               model: Reviews,
//
//               attributes: [],
//             },
//
//           ],
//
//           attributes: [
//
//             "id",
//
//             "name",
//
//             [
//
//               Sequelize.fn(
//                 "AVG",
//                 Sequelize.col(
//                   "Reviews.score"
//                 )
//               ),
//
//               "rating",
//
//             ],
//
//             [
//
//               Sequelize.fn(
//                 "COUNT",
//                 Sequelize.col(
//                   "Reviews.id"
//                 )
//               ),
//
//               "reviewCount",
//
//             ],
//
//           ],
//
//           group: [
//             "Hotels.id",
//           ],
//
//           order: [
//
//             [
//               Sequelize.literal(
//                 "rating"
//               ),
//               "DESC",
//             ],
//
//           ],
//
//           limit: 6,
//
//           subQuery: false,
//
//         });
//
//       // ======================
//       // RESPONSE
//       // ======================
//
//       return res.json({
//
//         success: true,
//
//         // ======================
//         // STATS
//         // ======================
//
//         stats: {
//
//           averageRating:
//
//             Number(
//               averageScore || 0
//             ).toFixed(1),
//
//           totalReviews,
//
//           positivePercentage,
//
//           reportedReviews: 12,
//
//         },
//
//         // ======================
//         // LATEST REVIEWS
//         // ======================
//
//         latestReviews:
//
//           latestReviews.map(
//             (review) => ({
//
//               id:
//               review.id,
//
//               userName:
//               review.reviewer_name,
//
//               hotelName:
//               review.Hotel?.name,
//
//
//               rating:
//                 Number(
//                   review.score
//                 ),
//
//               comment:
//               review.comment,
//
//               createdAt:
//               review.createdAt,
//
//               verified:
//               review.verified,
//
//             })
//           ),
//
//         // ======================
//         // OVERVIEW
//         // ======================
//
//         ratingOverview:
//         formattedOverview,
//
//         // ======================
//         // TOP HOTELS
//         // ======================
//
//         topHotels:
//
//           topHotels.map(
//             (hotel) => ({
//
//               id:
//               hotel.id,
//
//               name: hotel.name,
//
//               rating:
//
//                 Number(
//                   hotel.dataValues
//                     .rating || 0
//                 ).toFixed(1),
//
//               reviewCount:
//
//                 Number(
//                   hotel.dataValues
//                     .reviewCount || 0
//                 ),
//
//
//               city: hotel.city,
//               country: hotel.country,
//               price_from: hotel. price_from
//
//
//             })
//           ),
//
//       });
//
//     } catch (e) {
//
//       console.log(
//         "ADMIN REVIEWS DASHBOARD ERROR:",
//         e
//       );
//
//       return res.status(500).json({
//
//         success: false,
//
//         message:
//           "Failed to fetch reviews dashboard",
//
//       });
//
//     }
//
//   };


// export const deleteHotel = async (req, res) => {
//   try {
//     const { id } = req.params;
//
//     const hotel = await Hotels.findByPk(id);
//
//     if (!hotel) {
//       return res.status(404).json({ message: "Not found" });
//     }
//
//     await hotel.destroy();
//
//     res.json({
//       success: true,
//       message: "Deleted",
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: e.message,
//     });
//   }
// };
//










// export const syncHotelGallery = async (req, res) => {
//   const transaction = await sequelize.transaction();
//
//   try {
//     const { hotel_id } = req.body;
//
//     let images = req.body.images;
//     if (typeof images === "string") images = JSON.parse(images);
//     if (!Array.isArray(images)) images = [];
//
//     const mainIndex =
//       req.body.mainIndex !== undefined ? Number(req.body.mainIndex) : null;
//
//     const existing = await HotelPhotos.findAll({
//       where: { hotel_id },
//       transaction,
//     });
//
//     /* ---------------- DELETE ---------------- */
//     const frontendIds = images
//       .map((i) => Number(i.id))
//       .filter(Boolean);
//
//     const toDelete = existing.filter(
//       (img) => !frontendIds.includes(img.id)
//     );
//
//     for (const img of toDelete) {
//       if (img.public_id) {
//         await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//
//     if (toDelete.length) {
//       await HotelPhotos.destroy({
//         where: { id: toDelete.map((i) => i.id) },
//         transaction,
//       });
//     }
//
//     /* ---------------- ORDER ---------------- */
//     for (const img of images) {
//       if (img.id) {
//         await HotelPhotos.update(
//           {
//             sort_order: img.sort_order,
//             is_main: img.is_main,
//           },
//           { where: { id: img.id }, transaction }
//         );
//       }
//     }
//
//     /* ---------------- NEW UPLOADS ---------------- */
//     let newPhotos = [];
//
//     if (req.files?.length) {
//       const uploads = req.files.map((file, index) => ({
//         hotel_id,
//         path: file.path,
//         public_id: file.filename,
//         sort_order: images.length + index,
//         is_main: false,
//       }));
//
//       newPhotos = await HotelPhotos.bulkCreate(uploads, {
//         transaction,
//       });
//     }
//
//     /* ---------------- MAIN ---------------- */
//     await HotelPhotos.update(
//       { is_main: false },
//       { where: { hotel_id }, transaction }
//     );
//
//     let mainImage = images.find((i) => i.is_main && i.id);
//
//     if (!mainImage && newPhotos.length && mainIndex !== null) {
//       mainImage = newPhotos[mainIndex];
//     }
//
//     if (mainImage?.id) {
//       await HotelPhotos.update(
//         { is_main: true },
//         { where: { id: mainImage.id }, transaction }
//       );
//     }
//
//     await transaction.commit();
//
//     const updated = await HotelPhotos.findAll({
//       where: { hotel_id },
//       order: [["sort_order", "ASC"]],
//     });
//
//     return res.json({
//       success: true,
//       images: updated,
//     });
//   } catch (err) {
//     await transaction.rollback();
//     console.error(err);
//
//     return res.status(500).json({ message: "Server error" });
//   }
// };
//

// export const syncHotelGallery = async (req, res) => {
//   const transaction = await sequelize.transaction();
//
//   try {
//     const { hotel_id } = req.body;
//
//     let images = req.body.images;
//     if (typeof images === "string") images = JSON.parse(images);
//     if (!Array.isArray(images)) images = [];
//
//     const mainIndex =
//       req.body.mainIndex !== undefined ? Number(req.body.mainIndex) : null;
//
//     /* ---------------- EXISTING ---------------- */
//     const existing = await HotelPhotos.findAll({
//       where: { hotel_id },
//       transaction,
//     });
//
//     /* ---------------- DELETE ---------------- */
//     const frontendIds = images
//       .map((i) => Number(i.id))
//       .filter(Boolean);
//
//     const toDelete = existing.filter(
//       (img) => !frontendIds.includes(img.id)
//     );
//
//     for (const img of toDelete) {
//       if (img.public_id) {
//         await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//
//     if (toDelete.length) {
//       await HotelPhotos.destroy({
//         where: { id: toDelete.map((i) => i.id) },
//         transaction,
//       });
//     }
//
//     /* ---------------- ORDER UPDATE ---------------- */
//     for (const img of images) {
//       if (img.id) {
//         await HotelPhotos.update(
//           {
//             sort_order: img.sort_order,
//             is_main: img.is_main,
//           },
//           { where: { id: img.id }, transaction }
//         );
//       }
//     }
//
//     /* ---------------- NEW INSERT ---------------- */
//     let fileIndex = 0;
//
//     const newImages = images.filter((i) => !i.id);
//
//     let newPhotos = [];
//
//     if (req.files?.length && newImages.length) {
//       const uploads = [];
//
//       for (let i = 0; i < req.files.length; i++) {
//         const file = req.files[i];
//
//         uploads.push({
//           hotel_id,
//           path: file.path,
//           public_id: file.filename,
//           sort_order: newImages[i]?.sort_order ?? 9999,
//           is_main: false,
//         });
//       }
//
//       newPhotos = await HotelPhotos.bulkCreate(uploads, {
//         transaction,
//       });
//     }
//
//     /* ---------------- MAIN IMAGE ---------------- */
//     await HotelPhotos.update(
//       { is_main: false },
//       { where: { hotel_id }, transaction }
//     );
//
//     let mainImage = images.find((i) => i.is_main && i.id);
//
//     if (!mainImage && newPhotos.length) {
//       mainImage = newPhotos[mainIndex ?? 0];
//     }
//
//     if (!mainImage) {
//       const first = await HotelPhotos.findOne({
//         where: { hotel_id },
//         order: [["sort_order", "ASC"]],
//         transaction,
//       });
//
//       if (first) {
//         await first.update({ is_main: true }, { transaction });
//       }
//     } else {
//       await HotelPhotos.update(
//         { is_main: true },
//         { where: { id: mainImage.id }, transaction }
//       );
//     }
//
//     await transaction.commit();
//
//     const updated = await HotelPhotos.findAll({
//       where: { hotel_id },
//       order: [["sort_order", "ASC"]],
//     });
//
//     return res.json({
//       success: true,
//       images: updated,
//     });
//   } catch (err) {
//     await transaction.rollback();
//     console.error(err);
//
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };
//



// export const syncHotelGallery = async (req, res) => {
//   const transaction = await sequelize.transaction();
//
//   try {
//     const { hotel_id } = req.body;
//
//     let images = req.body.images;
//     if (typeof images === "string") images = JSON.parse(images);
//     if (!Array.isArray(images)) images = [];
//
//     const mainIndex =
//       req.body.mainIndex !== undefined ? Number(req.body.mainIndex) : null;
//
//     const existing = await HotelPhotos.findAll({
//       where: { hotel_id },
//       transaction,
//     });
//
//     /* ---------------- DELETE ---------------- */
//     const frontendIds = images
//       .map((i) => Number(i.id))
//       .filter(Boolean);
//
//     const toDelete = existing.filter(
//       (img) => !frontendIds.includes(img.id)
//     );
//
//     for (const img of toDelete) {
//       if (img.public_id) {
//         await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//
//     if (toDelete.length) {
//       await HotelPhotos.destroy({
//         where: { id: toDelete.map((i) => i.id) },
//         transaction,
//       });
//     }
//
//     /* ---------------- UPDATE ORDER + MAIN ---------------- */
//     for (const img of images) {
//       if (img.id) {
//         await HotelPhotos.update(
//           {
//             sort_order: img.sort_order,
//           },
//           { where: { id: img.id }, transaction }
//         );
//       }
//     }
//
//     /* ---------------- NEW INSERT ONLY ---------------- */
//     let newPhotos = [];
//
//     const newImages = images.filter((i) => !i.id);
//
//     if (req.files?.length && newImages.length) {
//       const uploads = [];
//
//       for (let i = 0; i < req.files.length; i++) {
//         const file = req.files[i];
//
//         uploads.push({
//           hotel_id,
//           path: file.path,
//           public_id: file.filename,
//           sort_order: newImages[i]?.sort_order ?? 9999,
//           is_main: false,
//         });
//       }
//
//       newPhotos = await HotelPhotos.bulkCreate(uploads, {
//         transaction,
//       });
//     }
//
//     /* ---------------- MAIN IMAGE ---------------- */
//     await HotelPhotos.update(
//       { is_main: false },
//       { where: { hotel_id }, transaction }
//     );
//
//     let mainImage = images.find((i) => i.is_main && i.id);
//
//     if (!mainImage && newPhotos.length) {
//       mainImage = newPhotos[mainIndex ?? 0];
//     }
//
//     if (mainImage?.id) {
//       await HotelPhotos.update(
//         { is_main: true },
//         { where: { id: mainImage.id }, transaction }
//       );
//     }
//
//     await transaction.commit();
//
//     return res.json({
//       success: true,
//       message: "Updated correctly 🚀",
//     });
//   } catch (err) {
//     await transaction.rollback();
//     console.error(err);
//
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };



// export const syncHotelGallery = async (req, res) => {
//   const transaction = await sequelize.transaction();
//
//   try {
//     const { hotel_id } = req.body;
//
//     let images = req.body.images;
//     console.log(images,111)
//     if (typeof images === "string") images = JSON.parse(images);
//     if (!Array.isArray(images)) images = [];
//
//     const mainIndex =
//       req.body.mainIndex !== undefined ? Number(req.body.mainIndex) : null;
//
//     const existing = await HotelPhotos.findAll({
//       where: { hotel_id },
//       transaction,
//     });
//
//     /* ---------------- DELETE ---------------- */
//     const frontendIds = images
//       .map((i) => Number(i.id))
//       .filter(Boolean);
//
//     const toDelete = existing.filter(
//       (img) => !frontendIds.includes(img.id)
//     );
//
//     for (const img of toDelete) {
//       if (img.public_id) {
//         await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//
//     if (toDelete.length) {
//       await HotelPhotos.destroy({
//         where: { id: toDelete.map((i) => i.id) },
//         transaction,
//       });
//     }
//
//     /* ---------------- UPDATE ORDER ---------------- */
//     for (const img of images) {
//       if (img.id) {
//         await HotelPhotos.update(
//           {
//             sort_order: img.sort_order,
//             is_main: img.is_main,
//           },
//           { where: { id: img.id }, transaction }
//         );
//       }
//     }
//
//     /* ---------------- NEW UPLOADS ---------------- */
//     let newPhotos = [];
//
//     if (req.files?.length) {
//       const uploads = req.files.map((file, index) => ({
//         hotel_id,
//         path: file.path,
//         public_id: file.filename,
//         sort_order: images.length + index,
//         is_main: false,
//       }));
//
//       newPhotos = await HotelPhotos.bulkCreate(uploads, {
//         transaction,
//       });
//     }
//
//     /* ---------------- MAIN IMAGE RESET ---------------- */
//     await HotelPhotos.update(
//       { is_main: false },
//       { where: { hotel_id }, transaction }
//     );
//
//     let mainImage =
//       images.find((i) => i.is_main && i.id) || null;
//
//     if (!mainImage && newPhotos.length) {
//       mainImage =
//         newPhotos[
//           mainIndex !== null ? mainIndex : 0
//           ];
//     }
//
//     if (mainImage?.id) {
//       await HotelPhotos.update(
//         { is_main: true },
//         { where: { id: mainImage.id }, transaction }
//       );
//     }
//
//     await transaction.commit();
//
//     const updatedImages = await HotelPhotos.findAll({
//       where: { hotel_id },
//       order: [["sort_order", "ASC"]],
//     });
//
//     return res.json({
//       success: true,
//       images: updatedImages,
//     });
//   } catch (err) {
//     await transaction.rollback();
//     console.error(err);
//
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };
//


/* ---------------------------------
   SYNC HOTEL GALLERY (PRO VERSION)
---------------------------------- */
// export const syncHotelGallery = async (req, res) => {
//   const transaction = await sequelize.transaction();
//
//   try {
//     const { hotel_id } = req.body;
//
//     let images = req.body.images;
//
//     if (typeof images === "string") {
//       images = JSON.parse(images);
//     }
//
//     if (!Array.isArray(images)) {
//       images = [];
//     }
//
//     const mainIndex =
//       req.body.mainIndex !== undefined
//         ? Number(req.body.mainIndex)
//         : null;
//
//     /* ---------------- EXISTING ---------------- */
//     const existing = await HotelPhotos.findAll({
//       where: { hotel_id },
//       transaction,
//     });
//
//     /* ---------------- DELETE REMOVED ---------------- */
//     const frontendIds = images
//       .filter((img) => img.id)
//       .map((img) => Number(img.id));
//
//     const toDelete = existing.filter(
//       (img) => !frontendIds.includes(img.id)
//     );
//
//     for (const img of toDelete) {
//       if (img.public_id) {
//         await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//
//     if (toDelete.length > 0) {
//       await HotelPhotos.destroy({
//         where: { id: toDelete.map((i) => i.id) },
//         transaction,
//       });
//     }
//
//     /* ---------------- UPDATE ORDER ---------------- */
//     for (const img of images) {
//       if (img.id) {
//         await HotelPhotos.update(
//           {
//             sort_order: img.sort_order ?? 0,
//             is_main: img.is_main ?? false,
//           },
//           {
//             where: { id: img.id },
//             transaction,
//           }
//         );
//       }
//     }
//
//     /* ---------------- NEW UPLOADS ---------------- */
//     const newImages = images.filter((img) => !img.id && img.isNew);
//
//     let newPhotos = [];
//
//     if (req.files?.length > 0) {
//       const uploads = req.files.map((file, index) => ({
//         hotel_id,
//         path: file.path,          // 👈 Cloudinary URL
//         public_id: file.filename, // 👈 Cloudinary ID
//         sort_order: newImages[index]?.sort_order ?? 9999,
//         is_main: false,
//       }));
//
//       newPhotos = await HotelPhotos.bulkCreate(uploads, {
//         transaction,
//       });
//     }
//
//     /* ---------------- MAIN IMAGE ---------------- */
//     await HotelPhotos.update(
//       { is_main: false },
//       { where: { hotel_id }, transaction }
//     );
//
//     let mainImage = images.find((i) => i.is_main && i.id);
//
//     if (!mainImage && newPhotos.length && mainIndex !== null) {
//       mainImage = newPhotos[mainIndex];
//     }
//
//     if (!mainImage) {
//       const first = await HotelPhotos.findOne({
//         where: { hotel_id },
//         order: [["sort_order", "ASC"]],
//         transaction,
//       });
//
//       if (first) {
//         await first.update({ is_main: true }, { transaction });
//       }
//     } else {
//       await HotelPhotos.update(
//         { is_main: true },
//         {
//           where: { id: mainImage.id },
//           transaction,
//         }
//       );
//     }
//
//     /* ---------------- COMMIT ---------------- */
//     await transaction.commit();
//
//     return res.json({
//       success: true,
//       message: "Gallery synced successfully 🚀",
//     });
//   } catch (err) {
//     await transaction.rollback();
//     console.error("syncHotelGallery error:", err);
//
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

