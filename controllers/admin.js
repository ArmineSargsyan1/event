import sequelize from "../clients/db.sequelize.mysql.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Hotels from "../models/Hotels.js";
import {cloudinary} from "../middlewares/upload.js";
import {col, fn, Model as LocationPoints, Op, Sequelize} from "sequelize";
import LocationPoint from "../models/LocationPoint.js";
import Room from "../models/Room.js";
import FileHelper from "../services/Utils.js";
import Amenity from "../models/Amenity.js";
import Reviews from "../models/Reviews.js";
import ReviewLiked from "../models/ReviewLiked.js";
import {Parser} from "json2csv";
import dayjs from "dayjs";
import User from "../models/User.js";
import Restaurant from '../models/Restaurant.js';
import Booking from '../models/Booking.js';
import Reservation from '../models/Reservation.js';
import Order from '../models/Order.js';
import moment from "moment";
import md5 from "md5";
import RestaurantReview from "../models/RestaurantReview.js";
import RestaurantImage from "../models/RestaurantImage.js";
import MenuItem from "../models/MenuItem.js";
import Dish from "../models/Dish.js";
import OrderItem from "../models/OrderItem.js";
import Notification from "../models/Notification.js";


export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const totalHotels = await Hotels.count({where: {deleted_at: null}});
    const totalRestaurants = await Restaurant.count();
    const totalUsers = await User.count({where: {role: 'user'}});

    const curHotelBookings = await Booking.count({
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const curReservations = await Reservation.count({
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const curFoodOrders = await Order.count({
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const totalOrders = curHotelBookings + curReservations + curFoodOrders;

    const curHotelRev = await Booking.sum('total_price', {
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.in]: ['confirmed', 'pending']}
      }
    }) || 0;
    const curFoodRev = await Order.sum('amount', {
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.in]: ['paid', 'pending']}
      }
    }) || 0;
    const totalRevenue = curHotelRev + curFoodRev;

    const lastMonthHotels = await Hotels.count({
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        deleted_at: null
      }
    });
    const lastMonthRestaurants = await Restaurant.count({where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}});
    const lastMonthUsers = await User.count({
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        role: 'user'
      }
    });

    const lastHotelBookings = await Booking.count({
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const lastReservations = await Reservation.count({
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const lastFoodOrders = await Order.count({
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.ne]: 'cancelled'}
      }
    });
    const lastMonthOrders = lastHotelBookings + lastReservations + lastFoodOrders;

    const lastHotelRev = await Booking.sum('total_price', {
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.in]: ['confirmed', 'pending']}
      }
    }) || 0;
    const lastFoodRev = await Order.sum('amount', {
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.in]: ['paid', 'pending']}
      }
    }) || 0;
    const lastMonthTotalRevenue = lastHotelRev + lastFoodRev;

    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? "+100%" : "+0.0%";

      let change = ((current - last) / last) * 100;

      if (change >= 100) return "+100%";
      if (change <= -100) return "-100%";

      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };


    const stats = [
      {
        id: "revenue",
        title: "Total Revenue",
        value: `$${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        percent: calculateGrowth(totalRevenue, lastMonthTotalRevenue),
        description: "from last month"
      },
      {
        id: "orders",
        title: "Total Orders",
        value: totalOrders.toLocaleString(),
        percent: calculateGrowth(totalOrders, lastMonthOrders),
        description: `Stays: ${curHotelBookings} | Food: ${curFoodOrders} | Tables: ${curReservations}`
      },
      {
        id: "hotels",
        title: "Total Hotels",
        value: totalHotels.toLocaleString(),
        percent: calculateGrowth(totalHotels, lastMonthHotels),
        description: "from last month"
      },
      {
        id: "restaurants",
        title: "Restaurants",
        value: totalRestaurants.toLocaleString(),
        percent: calculateGrowth(totalRestaurants, lastMonthRestaurants),
        description: "from last month"
      },
      {
        id: "users",
        title: "Users",
        value: totalUsers.toLocaleString(),
        percent: calculateGrowth(totalUsers, lastMonthUsers),
        description: "from last month"
      }
    ];

    return res.status(200).json({success: true, data: stats});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

export const getBookingChartData = async (req, res) => {
  try {
    const rawData = await Booking.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%a'), 'name'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'bookings'],
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'revenue']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%a')],
      raw: true
    });

    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const defaultData = {
      Mon: {name: "Mon", bookings: 0, revenue: 0},
      Tue: {name: "Tue", bookings: 0, revenue: 0},
      Wed: {name: "Wed", bookings: 0, revenue: 0},
      Thu: {name: "Thu", bookings: 0, revenue: 0},
      Fri: {name: "Fri", bookings: 0, revenue: 0},
      Sat: {name: "Sat", bookings: 0, revenue: 0},
      Sun: {name: "Sun", bookings: 0, revenue: 0}
    };

    rawData.forEach(row => {
      if (defaultData[row.name]) {
        defaultData[row.name].bookings = parseInt(row.bookings, 10) || 0;
        defaultData[row.name].revenue = parseFloat(row.revenue) || 0;
      }
    });

    const formattedChartData = daysOrder.map(day => defaultData[day]);

    return res.status(200).json({success: true, data: formattedChartData});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getOrderChartData = async (req, res) => {
  try {
    const rawData = await Order.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%a'), 'name'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('amount')), 'revenue']
      ],
      group: [fn('DATE_FORMAT', col('created_at'), '%a')],
      raw: true
    });

    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const defaultData = {
      Mon: {name: "Mon", orders: 0, revenue: 0},
      Tue: {name: "Tue", orders: 0, revenue: 0},
      Wed: {name: "Wed", orders: 0, revenue: 0},
      Thu: {name: "Thu", orders: 0, revenue: 0},
      Fri: {name: "Fri", orders: 0, revenue: 0},
      Sat: {name: "Sat", orders: 0, revenue: 0},
      Sun: {name: "Sun", orders: 0, revenue: 0}
    };

    rawData.forEach(row => {
      if (defaultData[row.name]) {
        defaultData[row.name].orders = parseInt(row.orders, 10) || 0;
        defaultData[row.name].revenue = parseFloat(row.revenue) || 0;
      }
    });

    const formattedChartData = daysOrder.map(day => defaultData[day]);

    return res.status(200).json(formattedChartData);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getTopLocationsChartData = async (req, res) => {
  try {
    const totalBookings = await Booking.count();
    const totalOrders = await Order.count();

    if (totalBookings === 0 && totalOrders === 0) {
      return res.status(200).json([
        {name: "Hotels", value: 1},
        {name: "Restaurants", value: 1}
      ]);
    }

    const chartData = [
      {name: "Hotels", value: totalBookings},
      {name: "Restaurants", value: totalOrders}
    ];

    return res.status(200).json(chartData);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getRecentTransactions = async (req, res) => {
  try {
    const recentBookings = await Booking.findAll({
      limit: 3,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Room,
          as: 'room',
          include: [
            {
              model: Hotels,
              as: 'hotel',
              include: [
                {
                  model: HotelPhotos,
                  as: 'images',
                  limit: 1
                }
              ]
            }
          ]
        }
      ],
      nest: true
    });

    const recentOrders = await Order.findAll({
      limit: 3,
      order: [['created_at', 'DESC']],
      include: [{model: Restaurant, as: 'restaurant'}],
      nest: true
    });

    const bookingsFormatted = recentBookings.map(b => {
      const hotelObj = b.room?.hotel;

      const hotelImg = hotelObj?.images && hotelObj.images.length > 0
        ? (hotelObj.images[0]?.path || hotelObj.images[0]?.image || hotelObj.images[0]?.url || "")
        : "";

      return {
        id: `booking-${b.id}`,
        title: hotelObj?.name || "Hotel Stay",
        image: hotelImg,
        type: "Hotel Stay",
        detail: `${b.nights || 1} Nights`,
        price: `$${parseFloat(b.total_price || b.totalPrice || 0).toFixed(2)}`,
        status: b.status || "confirmed",
        createdAt: b.created_at
      };
    });

    const ordersFormatted = recentOrders.map(o => {
      const restObj = o.restaurant;
      const restImg = restObj?.image || restObj?.path || restObj?.main_image || "";

      return {
        id: `order-${o.id}`,
        title: restObj?.name || "Restaurant Order",
        image: restImg,
        type: "Food Order",
        detail: o.status === "paid" ? "Delivery/Table" : "Pending food",
        price: `$${parseFloat(o.amount || o.total_price || 0).toFixed(2)}`,
        status: o.status || "pending",
        createdAt: o.created_at
      };
    });

    const allTransactions = [...bookingsFormatted, ...ordersFormatted]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return res.status(200).json(allTransactions);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getTopHotels = async (req, res) => {
  try {
    const topHotelBookings = await Booking.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Booking.id')), 'bookingsCount']
      ],
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['hotel_id'],
          required: true
        }
      ],
      group: ['room.hotel_id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Booking.id')), 'DESC']],
      limit: 3,
      raw: true
    });

    if (!topHotelBookings || topHotelBookings.length === 0) {
      return res.status(200).json([]);
    }

    const hotelIds = topHotelBookings.map(b => b['room.hotel_id'] || b.hotel_id).filter(Boolean);

    const hotels = await Hotels.findAll({
      where: {id: hotelIds},
      include: [
        {
          model: HotelPhotos,
          as: 'images',
          limit: 1,
          attributes: ['id', 'path']
        }
      ]
    });

    const formattedHotels = hotelIds.map(id => {
      const hotelObj = hotels.find(h => h.id === id);
      const bookingInfo = topHotelBookings.find(b => (b['room.hotel_id'] || b.hotel_id) === id);

      if (!hotelObj) return null;

      const bookingsCount = bookingInfo ? bookingInfo.bookingsCount : 0;

      const hotelImg = hotelObj.images && hotelObj.images.length > 0
        ? (hotelObj.images[0].path || "")
        : "";

      return {
        id: hotelObj.id,
        name: hotelObj.name || "Premium Hotel",
        image: hotelImg,
        count: `${bookingsCount} Bookings`,
        rating: parseFloat(hotelObj.rating || 4.5).toFixed(1)
      };
    }).filter(Boolean);

    return res.status(200).json(formattedHotels);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getTopRestaurants = async (req, res) => {
  try {
    const topRestaurantOrders = await Order.findAll({
      attributes: [
        'restaurant_id',
        [fn('COUNT', col('id')), 'ordersCount']
      ],
      group: ['restaurant_id'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 3,
      raw: true
    });

    if (!topRestaurantOrders || topRestaurantOrders.length === 0) {
      return res.status(200).json([]);
    }

    const restaurantIds = topRestaurantOrders.map(o => o.restaurant_id).filter(Boolean);

    const restaurants = await Restaurant.findAll({
      where: {id: restaurantIds},
      attributes: [
        'id',
        'name',
        'image',
        [
          Sequelize.literal(`(
            SELECT COALESCE(AVG(rating), 4.5) 
            FROM restaurant_reviews 
            WHERE restaurant_reviews.restaurant_id = Restaurant.id
          )`),
          'avgRating'
        ]
      ]
    });

    const formattedRestaurants = restaurantIds.map(id => {
      const restObj = restaurants.find(r => r.id === id);
      const orderInfo = topRestaurantOrders.find(o => o.restaurant_id === id);

      if (!restObj) return null;

      const ordersCount = orderInfo ? orderInfo.ordersCount : 0;

      const rawRating = restObj.getDataValue('avgRating') || 4.5;
      const finalRating = parseFloat(rawRating).toFixed(1);

      return {
        id: restObj.id,
        name: restObj.name || "Delicious Restaurant",
        image: restObj.image || "",
        orders: ordersCount,
        rating: finalRating
      };
    }).filter(Boolean);

    return res.status(200).json(formattedRestaurants);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

const calculateGrowth = (current, last) => {
  if (last === 0) return current > 0 ? "+100%" : "+0.0%";

  const change = ((current - last) / last) * 100;

  if (change >= 100) return "+100%";
  if (change <= -100) return "-100%";

  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

export const getRevenueOverview = async (req, res) => {
  try {
    const now = new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentBookingRevenue = await Booking.sum('total_price', {
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.in]: ['confirmed', 'pending']}
      }
    }) || 0;

    const currentOrderRevenue = await Order.sum('amount', {
      where: {
        created_at: {[Op.gte]: startOfCurrentMonth},
        status: {[Op.in]: ['paid', 'pending']}
      }
    }) || 0;

    const totalCurrentRevenue = currentBookingRevenue + currentOrderRevenue;

    const lastBookingRevenue = await Booking.sum('total_price', {
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.in]: ['confirmed', 'pending']}
      }
    }) || 0;

    const lastOrderRevenue = await Order.sum('amount', {
      where: {
        created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
        status: {[Op.in]: ['paid', 'pending']}
      }
    }) || 0;

    const totalLastRevenue = lastBookingRevenue + lastOrderRevenue;

    const monthlyRevenues = [];
    const maxMonths = 5;

    for (let i = maxMonths - 1; i >= 0; i--) {
      const dStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const bSum = await Booking.sum('total_price', {
        where: {
          created_at: {[Op.between]: [dStart, dEnd]},
          status: {[Op.in]: ['confirmed', 'pending']}
        }
      }) || 0;

      const oSum = await Order.sum('amount', {
        where: {
          created_at: {[Op.between]: [dStart, dEnd]},
          status: {[Op.in]: ['paid', 'pending']}
        }
      }) || 0;

      monthlyRevenues.push(bSum + oSum);
    }

    const maxRevenue = Math.max(...monthlyRevenues, 1);

    const last5Periods = monthlyRevenues.map(rev => {
      const percentage = (rev / maxRevenue) * 95;
      return percentage < 15 && rev > 0 ? 15 : Math.round(percentage);
    });

    return res.status(200).json({
      success: true,
      totalRevenue: totalCurrentRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      change: calculateGrowth(totalCurrentRevenue, totalLastRevenue),
      bars: last5Periods
    });

  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getAdminHotels = async (req, res) => {
  console.log(req.query)
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      status = "active",
      property_class,
      city,
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
      sort = "newest",
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 15, 1);
    const offset = (pageNum - 1) * limitNum;


    const where = {
      ...(search && {name: {[Op.like]: `%${search}%`}}),
      ...(city && {city: {[Op.like]: `%${city}%`}}),
      ...(property_class && {property_class}),
      ...(featured === "true" && {featured: true}),
      ...(currency && {currency}),
      ...(minRating && {rating: {[Op.gte]: Number(minRating)}}),

      // PRICE
      ...((minPrice || maxPrice) && {
        price_from: {
          ...(minPrice && {[Op.gte]: Number(minPrice)}),
          ...(maxPrice && {[Op.lte]: Number(maxPrice)}),
        },
      }),

      // VIEWS
      ...((minViews || maxViews) && {
        views: {
          ...(minViews && {[Op.gte]: Number(minViews)}),
          ...(maxViews && {[Op.lte]: Number(maxViews)}),
        },
      }),

      // CREATED DATE
      ...((createdFrom || createdTo) && {
        created_at: {
          ...(createdFrom && {[Op.gte]: createdFrom}),
          ...(createdTo && {[Op.lte]: createdTo}),
        },
      }),

      // STATUS
      ...(status === "inactive" && {deleted_at: {[Op.ne]: null}}),
      ...(status === "active" && {deleted_at: null}),
    };


    let order = [["created_at", "DESC"]];

    if (sort === "oldest") order = [["created_at", "ASC"]];
    if (sort === "views") order = [["views", "DESC"]];
    if (sort === "name") order = [["name", "ASC"]];
    if (sort === "rating") order = [["rating", "DESC"]];
    if (sort === "price_asc") order = [["price_from", "ASC"]];
    if (sort === "price_desc") order = [["price_from", "DESC"]];


    const totalCount = await Hotels.count({
      where,
      paranoid: false,
      ...(amenities && {
        include: [{
          model: Amenity,
          required: true,
          where: {id: {[Op.in]: amenities.split(",").map(Number)}}
        }]
      }),
      distinct: true,
      col: 'id'
    });


    const filteredHotelsPaged = await Hotels.findAll({
      where,
      limit: limitNum,
      offset,
      paranoid: false,
      order,
      attributes: ['id'],
      ...(amenities && {
        include: [{
          model: Amenity,
          attributes: [],
          required: true,
          where: {id: {[Op.in]: amenities.split(",").map(Number)}}
        }],
        group: ['Hotels.id']
      }),
      raw: true
    });

    const hotelIds = filteredHotelsPaged.map(h => h.id);

    if (hotelIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        rows: []
      });
    }


    const rows = await Hotels.findAll({
      where: {id: {[Op.in]: hotelIds}},
      paranoid: false,
      order,
      attributes: {
        include: [
          [
            Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM rooms AS Rooms 
          WHERE Rooms.hotel_id = Hotels.id
        )`),
            "rooms_count"
          ]
        ]
      },
      include: [
        {
          model: HotelPhotos,
          as: "images",
          required: hasPhotos === "true",
          where: {room_id: null},
          separate: true,
          order: [["sort_order", "ASC"]]
        },
        {
          model: Amenity,
          through: {attributes: []},
          required: false
        }
      ]
    });


    const result = {
      count: totalCount,
      rows: rows
    };


    let hotels = rows.map((hotel) => {
      const plain = hotel.toJSON();

      const currentAmenities = plain.Amenities || plain.amenities || [];

      const groupedAmenities = Object.entries(
        currentAmenities.reduce((acc, amenity) => {
          const category = amenity.category || "Other";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: amenity.id,
            name: amenity.name,
            key: amenity.key,
          });
          return acc;
        }, {})
      ).map(([category, items]) => ({
        category,
        items,
      }));

      const mainPhoto =
        plain.images?.find((img) => img.is_main)?.path ||
        plain.images?.[0]?.path ||
        null;

      const computedStars = FileHelper.getHotelStars({
        ...plain,
        rating: plain.rating || 0,
      });

      return {
        id: plain.id,
        name: plain.name,
        city: plain.city,
        country: plain.country,
        address: plain.address,
        description: plain.description,
        property_class: plain.property_class,
        price_from: plain.price_from,
        currency: plain.currency,
        lat: plain.lat,
        lon: plain.lon,
        status: plain.deleted_at ? "inactive" : "active",
        featured: plain.featured || false,
        views: plain.views || 0,
        review_count: plain.review_count || 0,
        rating: plain.rating || 0,
        stars: computedStars,
        rooms_count: Number(plain.rooms_count) || 0,
        amenities_count: currentAmenities.length || 0,
        photos_count: plain.images?.length || 0,
        mainPhoto,
        images: plain.images || [],
        amenities: groupedAmenities,
        Amenities: currentAmenities,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        deleted_at: plain.deleted_at,
      };
    });

    if (minStars) {
      hotels = hotels.filter((hotel) => hotel.stars >= Number(minStars));
    }

    if (stars) {
      hotels = hotels.filter((h) => Math.floor(h.stars) === Number(stars));
    }

    // GLOBAL STATS CALCULATIONS

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? "+100%" : "+0.0%";
      const change = ((current - last) / last) * 100;
      if (change >= 100) return "+100%";
      if (change <= -100) return "-100%";
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const [
      totalHotels,
      activeHotels,
      inactiveHotels,
      totalViews,
      totalRooms,
      totalPhotos,

      curHotelsThisMonth,
      curActiveThisMonth,
      curRoomsThisMonth,
      curViewsThisMonth,

      lastHotelsThisMonth,
      lastActiveThisMonth,
      lastRoomsThisMonth,
      lastViewsThisMonth
    ] = await Promise.all([
      Hotels.count({paranoid: false}),
      Hotels.count({where: {deleted_at: null}, paranoid: false}),
      Hotels.count({where: {deleted_at: {[Op.ne]: null}}, paranoid: false}),
      Hotels.sum("views", {paranoid: false}),
      Room.count({paranoid: false}),
      HotelPhotos.count(),

      // Current Month Queries
      Hotels.count({where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Hotels.count({where: {deleted_at: null, created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Room.count({where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Hotels.sum("views", {where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),

      // Last Month Queries
      Hotels.count({where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
      Hotels.count({
        where: {deleted_at: null, created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}},
        paranoid: false
      }),
      Room.count({where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
      Hotels.sum("views", {where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
    ]);

    const stats = {
      totalHotels,
      totalHotelsGrowth: calculateGrowth(curHotelsThisMonth, lastHotelsThisMonth),

      activeHotels,
      activeHotelsGrowth: calculateGrowth(curActiveThisMonth, lastActiveThisMonth),

      inactiveHotels,
      hotelsThisMonth: curHotelsThisMonth,
      activeHotelsThisMonth: curActiveThisMonth,

      totalViews: totalViews || 0,
      totalViewsGrowth: calculateGrowth(curViewsThisMonth || 0, lastViewsThisMonth || 0),

      totalRooms,
      totalRoomsGrowth: calculateGrowth(curRoomsThisMonth, lastRoomsThisMonth),

      totalPhotos,
      roomsThisMonth: curRoomsThisMonth,
      pendingHotels: 0,
      pendingHotelsThisMonth: 0,
    };

    const exactTotal = (stars || minStars) ? hotels.length : totalCount;

    return res.json({
      success: true,
      data: hotels,
      stats,
      pagination: {
        total: exactTotal,
        page: pageNum,
        pages: Math.ceil(exactTotal / limitNum) || 1,
      },
    });

  } catch (e) {
    console.log("GET ADMIN HOTELS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin hotels dataset",
      error: e.message
    });
  }

};

export const createHotel = async (req, res) => {
  console.log(req.body, 999);
  try {
    const {
      name,
      description,
      price_from,
      city,
      country,
      property_class,
      address,
      lat,
      lon,
      amenities = [],
      location_points = [],
      currency,
      hotel_category,
      hasRestaurant,
      restaurantName,
      restaurantDescription
    } = req.body;

    const hotel = await Hotels.create({
      userId: req.userId,
      name,
      description,
      price_from: Number(price_from),
      currency: currency || "USD",
      city,
      country,
      property_class,
      address,
      hotel_category,
      lat: lat ? Number(lat) : null,
      lon: lon ? Number(lon) : null,
    });

    if (hasRestaurant === true || hasRestaurant === "true") {
      await Restaurant.create({
        hotel_id: hotel.id,
        name: restaurantName || `${name} Restaurant`,
        description: restaurantDescription || "Hotel internal restaurant",
        ownerId: req.userId,
        address: address || `${city}, ${country}`,
        latitude: lat ? Number(lat) : 0,
        longitude: lon ? Number(lon) : 0,
      });
    }

    if (amenities.length) {
      await hotel.setAmenities(amenities);
    }

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
    console.log(" CREATE HOTEL ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const {id} = req.params;

    const {amenities, location_points, ...data} = req.body;

    const hotel = await Hotels.findByPk(id);

    if (!hotel) {
      return res.status(404).json({message: "Not found"});
    }
    // if (hotel.user_id !== req.userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Access denied. Only the creator of this hotel can update it."
    //   });
    // }

    await hotel.update(data);

    if (amenities && Array.isArray(amenities)) {
      const cleanAmenityIds = amenities
        .map(a => (typeof a === 'object' && a !== null ? a.id : a))
        .filter(a => typeof a === 'number' && !isNaN(a));

      await hotel.setAmenities(cleanAmenityIds);
    }

    if (location_points && Array.isArray(location_points)) {

      await LocationPoints.destroy({
        where: {hotel_id: id}
      });

      if (location_points.length > 0) {
        const pointsWithHotelId = location_points.map(point => ({
          name: point.name,
          distance: point.distance,
          hotel_id: id
        }));

        await LocationPoints.bulkCreate(pointsWithHotelId);
      }
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (e) {
    console.log(e.response)
    if (e.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: e.errors.map(err => ({
          path: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      message: e.message,
    });
  }
};


//room
export const getAdminHotelRooms = async (req, res) => {
  try {
    const {id} = req.params;

    const hotel = await Hotels.findByPk(id);

    if (!hotel) {
      return res.status(404).json({message: "Hotel not found"});
    }

    const rooms = await Room.findAll({
      where: {hotel_id: id},
      include: ["options"]
    });

    res.json({
      success: true,
      rooms: rooms
    });

  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};

export const updateAdminRoom = async (req, res) => {
  try {
    const {id} = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({success: false, message: "Room record not found."});
    }

    await room.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Room configuration synchronized and moderated successfully!",
      room: room
    });
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

export const deleteAdminRoom = async (req, res) => {
  try {
    const {id} = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({success: false, message: "Room matrix entry not found."});
    }

    await room.destroy();
    return res.status(200).json({success: true, message: "Room purged from system workspace."});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};


export const syncHotelGallery = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {hotel_id} = req.body;

    if (!hotel_id) {
      await transaction.rollback();
      return res.status(400).json({message: "hotel_id is required"});
    }

    const hotel = await Hotels.findByPk(hotel_id, {transaction});
    if (!hotel) {
      await transaction.rollback();
      return res.status(404).json({message: "Hotel not found"});
    }


    if (req.role !== 'admin' && hotel.user_id !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to modify this hotel gallery."
      });
    }

    let images = req.body.images;

    if (typeof images === "string") {
      images = JSON.parse(images);
    }

    if (!Array.isArray(images)) images = [];

    const mainIndex =
      req.body.mainIndex !== undefined && req.body.mainIndex !== null
        ? Number(req.body.mainIndex)
        : null;


    const existing = await HotelPhotos.findAll({
      where: {
        hotel_id,
        room_id: null
      },
      transaction,
    });

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
        where: {id: toDelete.map((i) => i.id)},
        transaction,
      });
    }

    /* ---------------- UPDATE ORDER & CATEGORY ---------------- */
    for (const img of images) {
      if (img.id) {
        await HotelPhotos.update(
          {
            sort_order: img.sort_order ?? 0,
            is_main: !!img.is_main,
            category: img.category || "Exterior",
          },
          {
            where: {id: img.id},
            transaction,
          }
        );
      }
    }

    /* ---------------- REPLACE IMAGES ---------------- */
    let fileIndex = 0;

    for (const img of images) {
      if (img.replaced && img.id) {
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
            category: img.category || "Exterior",
          },
          {
            where: {id: img.id},
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
          room_id: null,
          path: result.secure_url,
          public_id: result.public_id,
          sort_order: newImages[i]?.sort_order ?? 9999,
          category: newImages[i]?.category || "Exterior",
          is_main: false,
        });
      }

      newPhotos = await HotelPhotos.bulkCreate(uploads, {
        transaction,
      });
    }

    /* ---------------- MAIN IMAGE LOGIC ---------------- */
    await HotelPhotos.update(
      {is_main: false},
      {
        where: {
          hotel_id,
          room_id: null
        },
        transaction
      }
    );

    let mainImage = images.find((i) => i.is_main && i.id);

    if (!mainImage && newPhotos.length && mainIndex !== null) {
      mainImage = newPhotos[mainIndex];
    }

    if (!mainImage) {
      const first = await HotelPhotos.findOne({
        where: {
          hotel_id,
          room_id: null
        },
        order: [["sort_order", "ASC"]],
        transaction,
      });

      if (first) {
        await first.update({is_main: true}, {transaction});
      }
    } else {
      await HotelPhotos.update(
        {is_main: true},
        {
          where: {id: mainImage.id},
          transaction,
        }
      );
    }

    await transaction.commit();

    const updated = await HotelPhotos.findAll({
      where: {
        hotel_id,
        room_id: null
      },
      order: [["sort_order", "ASC"]],
    });

    return res.json({
      success: true,
      images: updated,
    });

  } catch (err) {
    await transaction.rollback();
    console.error("Gallery Sync Error: ", err);

    return res.status(500).json({
      message: "Server error during gallery synchronization",
      error: err.message
    });
  }
};

export const toggleHotelFeatured = async (req, res) => {
  try {
    const {id} = req.params;

    if (req.role !== 'admin') {
      return res.status(403).json({message: "Access denied. Admins only."});
    }

    const hotel = await Hotels.findByPk(id);
    if (!hotel) return res.status(404).json({message: "Hotel not found"});

    const isCurrentlyFeatured = hotel.featured === 1 || hotel.featured === true;
    const updatedFeatured = isCurrentlyFeatured ? 0 : 1;

    let updatedFeaturedUntil = null;
    if (updatedFeatured === 1) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      updatedFeaturedUntil = futureDate;
    }

    await hotel.update({
      featured: updatedFeatured,
      featured_until: updatedFeaturedUntil
    });

    return res.json({
      success: true,
      featured: updatedFeatured === 1,
      featured_until: updatedFeaturedUntil,
      message: `Hotel VIP status updated to ${updatedFeatured === 1}`
    });
  } catch (e) {
    console.error("FEATURED TOGGLE ERROR:", e);
    return res.status(500).json({message: e.message});
  }
};

export const getAdminHotelStats = async (req, res) => {
  try {
    const {range} = req.query;

    let bookingDateFilter = {};

    if (range !== "all_time") {
      let startDate;
      let endDate = moment().endOf("day").toDate();

      switch (range) {
        case "today":
          startDate = moment().startOf("day").toDate();
          break;

        case "this_month":
        case "month":
          startDate = moment().startOf("month").toDate();
          break;

        case "this_year":
        case "year":
          startDate = moment().startOf("year").toDate();
          break;

        default:
          startDate = null;
          break;
      }

      if (startDate) {
        bookingDateFilter = {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        };
      }
    }


    const startOfCurrentMonth = moment().startOf("month").toDate();
    const startOfLastMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLastMonth = moment().subtract(1, "month").endOf("month").toDate();

    const calculateGrowth = (current, last) => {
      const curNum = Number(current) || 0;
      const lastNum = Number(last) || 0;

      if (lastNum === 0) {
        return curNum > 0 ? "+100%" : "+0.0%";
      }

      const change = ((curNum - lastNum) / lastNum) * 100;

      if (change >= 100) return "+100%";
      if (change <= -100) return "-100%";

      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // ==========================================
    //2. GLOBAL OVERVIEW
    // ==========================================
    const [
      totalHotels, activeHotels, inactiveHotels, totalViews, totalRooms, totalPhotos,
      curHotelsThisMonth, curActiveThisMonth, curRoomsThisMonth, curViewsThisMonth,
      lastHotelsThisMonth, lastActiveThisMonth, lastRoomsThisMonth, lastViewsThisMonth
    ] = await Promise.all([
      Hotels.count({paranoid: false}),
      Hotels.count({where: {deleted_at: null}, paranoid: false}),
      Hotels.count({where: {deleted_at: {[Op.ne]: null}}, paranoid: false}),
      Hotels.sum("views", {paranoid: false}),
      Room.count({paranoid: false}),
      HotelPhotos.count(),

      // Current Month Queries
      Hotels.count({where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Hotels.count({where: {deleted_at: null, created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Room.count({where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),
      Hotels.sum("views", {where: {created_at: {[Op.gte]: startOfCurrentMonth}}, paranoid: false}),

      // Last Month Queries
      Hotels.count({where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
      Hotels.count({
        where: {deleted_at: null, created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}},
        paranoid: false
      }),
      Room.count({where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
      Hotels.sum("views", {where: {created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]}}, paranoid: false}),
    ]);


    const hotelStatistics = {
      totalHotels,
      totalHotelsGrowth: calculateGrowth(curHotelsThisMonth, lastHotelsThisMonth),
      activeHotels,
      activeHotelsGrowth: calculateGrowth(curActiveThisMonth, lastActiveThisMonth),
      inactiveHotels,
      hotelsThisMonth: curHotelsThisMonth,
      activeHotelsThisMonth: curActiveThisMonth,
      totalViews: totalViews || 0,
      totalViewsGrowth: calculateGrowth(curViewsThisMonth || 0, lastViewsThisMonth || 0),
      totalRooms,
      totalRoomsGrowth: calculateGrowth(curRoomsThisMonth, lastRoomsThisMonth),
      totalPhotos,
      roomsThisMonth: curRoomsThisMonth,
      pendingHotels: 0,
      pendingHotelsThisMonth: 0,
    };


    // ==========================================
    //3. REVENUE BY LOCATION
    // ==========================================
    const revenueByLocation = await Hotels.findAll({
      attributes: [
        "city",
        [sequelize.fn("SUM", sequelize.col("Rooms->Bookings.total_price")), "location_revenue"],
        [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("Rooms->Bookings.id"))), "bookings_count"]
      ],
      include: [
        {
          model: Room,
          as: "Rooms",
          attributes: [],
          required: true,
          include: [
            {
              model: Booking,
              as: "Bookings",
              attributes: [],
              where: {
                status: "confirmed",
                ...bookingDateFilter
              },
              required: true
            }
          ]
        }
      ],
      where: {deleted_at: null},
      subQuery: false,
      group: ["Hotels.city"],
      order: [[sequelize.literal("location_revenue"), "DESC"]],
      raw: true
    });

    // ==========================================
    // 4. TOP 5 REVENUE HOTELS
    // ==========================================
    const topRevenueHotels = await Hotels.findAll({
      attributes: [
        "id", "name", "city", "currency",
        [sequelize.fn("SUM", sequelize.col("Rooms->Bookings.total_price")), "total_revenue"]
      ],
      include: [
        {
          model: Room,
          as: "Rooms",
          attributes: [],
          required: true,
          include: [
            {
              model: Booking,
              as: "Bookings",
              attributes: [],
              where: {
                status: "confirmed",
                ...bookingDateFilter
              },
              required: true
            }
          ]
        }
      ],
      where: {deleted_at: null},
      subQuery: false,
      group: ["Hotels.id"],
      order: [[sequelize.literal("total_revenue"), "DESC"]],
      limit: 5,
      raw: true
    });

    return res.json({
      success: true,
      hotelStatistics,
      revenueByLocation,
      topRevenueHotels
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: error.message});
  }
};

export const getAdminTopHotels = async (req, res) => {

  try {

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

    const locationStats =
      await Hotels.findAll({

        attributes: [
          "city",
          [fn("COUNT", col("id")), "count",],
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
      total: totalHotels,
      active: activeHotels,
      inactive: inactiveHotels,
    };

    // ======================
    // FORMAT HOTELS
    // ======================

    const formatted =
      hotels.map((hotel) => {

        const plain = hotel.toJSON();
        const mainPhoto = plain.images?.find((img) => img.is_main === 1)?.path || plain.images?.[0]?.path || null;

        const stars = FileHelper.getHotelStars({...plain, rating: plain.rating || 0,});

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
          rating: plain.rating || 0,
          stars,
          price_from:
          plain.price_from,
          currency:
          plain.currency,
          views: plain.views || 0,
          mainPhoto,
        };

      });

    return res.json({
      success: true,
      data: formatted,
      hotelStatistics,
      popularLocations:
      locationStats,
    });

  } catch (e) {

    console.log("GET TOP HOTELS ERROR:", e);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top hotels",
    });

  }

};

export const getHotel = async (req, res) => {
  try {
    const {id} = req.params;

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

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotels.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({message: "Not found"});
    }

    await hotel.destroy();

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

    const hotel = await Hotels.findByPk(req.params.id, {
      paranoid: false,
    });

    if (!hotel) {
      return res.status(404).json({message: "Not found"});
    }

    await hotel.restore();
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
      paranoid: false,
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


///restaurant

export const getAdminRestaurantStats = async (req, res) => {
  try {
    const {range = "all_time"} = req.query;


    const orderWhere = {status: "paid"};

    if (range !== "all_time") {
      let startDate;
      let endDate;

      switch (range) {
        case "today":
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
          break;

        case "this_week":
          startDate = moment().startOf("isoWeek").toDate();
          endDate = moment().endOf("isoWeek").toDate();
          break;

        case "this_month":
          startDate = moment().startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;

        case "this_year":
          startDate = moment().startOf("year").toDate();
          endDate = moment().endOf("year").toDate();
          break;
      }

      if (startDate && endDate) {
        orderWhere.created_at = {
          [Op.between]: [startDate, endDate]
        };
      }
    }


    const [
      totalRestaurants,
      luxuryCount,
      totalPaidOrders,
      hotelInHouseRevenue,
      walkInCustomerRevenue
    ] = await Promise.all([
      Restaurant.count(),
      Restaurant.count({where: {category: "luxury"}}),
      Order.count({where: orderWhere}),

      Order.sum("amount", {
        where: {...orderWhere, booking_id: {[Op.ne]: null}}
      }),

      Order.sum("amount", {
        where: {...orderWhere, booking_id: null}
      })
    ]);

    // ==========================================
    //  2. TOTAL REVENUE BY LOCATION
    // ==========================================
    const restaurantRevenueByLocation = await Restaurant.findAll({
      attributes: [
        "city",
        [sequelize.fn("SUM", sequelize.col("Orders.amount")), "location_revenue"],
        [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("Orders.id"))), "bookings_count"]
      ],
      include: [
        {
          model: Order,
          as: "Orders",
          attributes: [],
          where: orderWhere,
          required: true
        }
      ],
      group: ["Restaurant.city"],
      order: [[sequelize.literal("location_revenue"), "DESC"]],
      raw: true
    });

    // ==========================================
    //  3. TOP 5 REVENUE RESTAURANTS
    // ==========================================
    const topRevenueRestaurants = await Restaurant.findAll({
      attributes: [
        "id",
        "name",
        "city",
        "image",
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(amount), 0) 
            FROM orders AS Orders 
            WHERE Orders.restaurant_id = Restaurant.id AND Orders.status = 'paid'
            ${range !== "all_time" ? `AND Orders.created_at BETWEEN '${moment(moment().startOf(range === "today" ? "day" : range === "this_week" ? "isoWeek" : range === "this_month" ? "month" : "year")).format("YYYY-MM-DD HH:mm:ss")}' AND '${moment(moment().endOf(range === "today" ? "day" : range === "this_week" ? "isoWeek" : range === "this_month" ? "month" : "year")).format("YYYY-MM-DD HH:mm:ss")}'` : ""}
          )`),
          "total_revenue"
        ]
      ],
      group: ["Restaurant.id"],
      order: [[sequelize.literal("total_revenue"), "DESC"]],
      limit: 5,
      raw: true
    });

    // ==========================================
    //4. RESPONSIVE EXECUTION
    // ==========================================
    return res.json({
      success: true,
      stats: {
        totalRestaurants,
        luxuryCount,
        totalPaidOrders,
        hotelInHouseRevenue: Number(hotelInHouseRevenue || 0),
        walkInCustomerRevenue: Number(walkInCustomerRevenue || 0),
        combinedTotalRevenue: Number((hotelInHouseRevenue || 0) + (walkInCustomerRevenue || 0))
      },
      revenueByLocation: restaurantRevenueByLocation,
      topRevenueRestaurants
    });

  } catch (err) {
    console.error("GET ADMIN RESTAURANT STATS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to compile restaurant data model streams",
      error: err.message
    });
  }
};


///users


export const getAdminUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      country,
      search
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // ==========================================
    //  1. DYNAMIC WHERE CLAUSE MATRIX
    // ==========================================
    const where = {};

    if (role && role.toLowerCase() !== "all") {
      where.role = role.toLowerCase();
    }

    if (status && status.toLowerCase() !== "all") {
      where.is_active = status.toLowerCase() === "active";
    }

    if (country && country.toLowerCase() !== "all") {
      where.country = country;
    }

    if (search) {
      where[Op.or] = [
        {userName: {[Op.like]: `%${search}%`}},
        {email: {[Op.like]: `%${search}%`}},
        {phoneNumber: {[Op.like]: `%${search}%`}}
      ];
    }


    const {count, rows} = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: {exclude: ["password"]},
      raw: true
    });


    const usersWithBusinessCounts = await Promise.all(
      rows.map(async (user) => {
        let hotels_count = 0;
        let restaurants_count = 0;

        if (user.role === "owner") {
          [hotels_count, restaurants_count] = await Promise.all([
            Hotels.count({where: {user_id: user.id}}),
            Restaurant.count({where: {owner_id: user.id}})
          ]);
        }

        return {
          ...user,
          hotels_count,
          restaurants_count
        };
      })
    );


    const startOfCurMonth = moment().startOf("month").toDate();
    const startOfLstMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLstMonth = moment().subtract(1, "month").endOf("month").toDate();

    const [
      totalUsers,
      totalOwners,
      activeUsers,
      curMonthReg,
      lastMonthReg,
      curMonthActive,
      lastMonthActive,
      curMonthOwners,
      lastMonthOwners
    ] = await Promise.all([
      User.count(),
      User.count({where: {role: "owner"}}),
      User.count({where: {isActive: true}}),

      User.count({where: {created_at: {[Op.gte]: startOfCurMonth}}}),
      User.count({where: {created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      User.count({where: {isActive: true, created_at: {[Op.gte]: startOfCurMonth}}}),
      User.count({where: {isActive: true, created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      User.count({where: {role: "owner", created_at: {[Op.gte]: startOfCurMonth}}}),
      User.count({where: {role: "owner", created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}})
    ]);

    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? "+100%" : "+0.0%";
      const change = ((current - last) / last) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const stats = {
      totalUsers,
      totalUsersGrowth: calculateGrowth(curMonthReg, lastMonthReg),
      activeUsers,
      activeUsersGrowth: calculateGrowth(curMonthActive, lastMonthActive),
      totalOwners,
      totalOwnersGrowth: calculateGrowth(curMonthOwners, lastMonthOwners)
    };


    return res.json({
      success: true,
      users: usersWithBusinessCounts,
      stats,
      pagination: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / limitNum) || 1
      }
    });

  } catch (err) {
    console.error("GET ADMIN USERS GLOBAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server failed to process administrative user matrix streams",
      error: err.message
    });
  }
};


export const updateUserFields = async (req, res) => {
  try {
    const {id} = req.params;
    const {role, isActive, actionType} = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({success: false, message: "User registry entry not found"});
    }

    if (actionType === "delete") {
      await user.destroy();
      return res.json({success: true, message: "User successfully purged from active matrices"});
    }

    if (role && ["user", "owner", "admin"].includes(role)) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    return res.json({
      success: true,
      message: "User security credentials updated successfully",
      user
    });

  } catch (err) {
    console.error("UPDATE USER FIELDS ERROR:", err);
    return res.status(500).json({success: false, message: err.message});
  }
};


//bookings

export const getAdminBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      type = "hotel",
      startDate,
      endDate
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const isRestaurant = type.toLowerCase() === "restaurant";

    const ActiveModel = isRestaurant ? Order : Booking;
    const targetPropertyModel = isRestaurant ? Restaurant : Hotels;
    const propertyAlias = isRestaurant ? "restaurant" : "Property";
    const priceField = isRestaurant ? "amount" : "total_price";

    const whereClause = {};

    // 2. Status Filter
    if (status && status.toLowerCase() !== "all") {
      whereClause.status = status.toLowerCase();
    }


    // ==========================================
    // 3. Global Search Core
    // ==========================================
    if (search) {
      if (isRestaurant) {
        whereClause[Op.or] = [
          {id: search},
          {delivery_address: {[Op.like]: `%${search}%`}},
          {'$user.user_name$': {[Op.like]: `%${search}%`}},
          {'$user.email$': {[Op.like]: `%${search}%`}}
        ];
      } else {
        whereClause[Op.or] = [
          {customer_name: {[Op.like]: `%${search}%`}},
          {customer_email: {[Op.like]: `%${search}%`}},
          {customer_phone: {[Op.like]: `%${search}%`}},
          {'$user.user_name$': {[Op.like]: `%${search}%`}},
          {'$user.email$': {[Op.like]: `%${search}%`}}
        ];
      }
    }

    if (startDate || endDate) {
      const dateField = isRestaurant ? "created_at" : "check_in";

      if (startDate && endDate) {
        whereClause[dateField] = {[Op.between]: [startDate, endDate]};
      } else if (startDate) {
        whereClause[dateField] = {[Op.gte]: startDate};
      } else if (endDate) {
        whereClause[dateField] = {[Op.lte]: endDate};
      }
    }

    const activeAttributes = isRestaurant
      ? ["id", "restaurant_id", "user_id", "booking_id", "delivery_address", "status", "amount", "stripe_session_id", "createdAt", "updatedAt"]
      : ["id", "customer_name", "customer_email", "customer_phone", "check_in", "check_out", "guests", "total_price", "status", "payment_status", "paid_at", "createdAt", "updatedAt"];

    const {count, rows} = await ActiveModel.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
      attributes: activeAttributes,

      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "userName", "email", "profilePicture"]
        },
        isRestaurant
          ? {
            model: targetPropertyModel,
            as: propertyAlias,
            attributes: ["id", "name"]
          }
          : {
            model: Room,
            as: "room",
            attributes: ["id", "name", "room_type"],
            include: [
              {
                model: targetPropertyModel,
                as: "hotel",
                attributes: ["id", "name"]
              }
            ]
          }
      ]
    });

    // ==========================================
    // TIME-SERIES REVENUE & GROWTH MATRIX
    // ==========================================
    const startOfCurMonth = moment().startOf("month").toDate();
    const startOfLstMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLstMonth = moment().subtract(1, "month").endOf("month").toDate();

    const [
      totalBookings,
      pendingCount,
      confirmedCount,
      curMonthSales,
      lastMonthSales
    ] = await Promise.all([
      ActiveModel.count(),
      ActiveModel.count({where: {status: "pending"}}),
      ActiveModel.count({where: {status: isRestaurant ? "paid" : "confirmed"}}),

      ActiveModel.sum(priceField, {
        where: {
          status: isRestaurant ? "paid" : "confirmed",
          created_at: {[Op.gte]: startOfCurMonth}
        }
      }),

      ActiveModel.sum(priceField, {
        where: {
          status: isRestaurant ? "paid" : "confirmed",
          created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}
        }
      })
    ]);

    const calculateGrowth = (current = 0, last = 0) => {
      const curNum = current || 0;
      const lstNum = last || 0;
      if (lstNum === 0) return curNum > 0 ? "+100%" : "+0.0%";
      const change = ((curNum - lstNum) / lstNum) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const stats = {
      totalBookings,
      pendingBookings: pendingCount,
      confirmedBookings: confirmedCount,
      monthlyRevenue: curMonthSales || 0,
      revenueGrowth: calculateGrowth(curMonthSales, lastMonthSales)
    };


    const formattedRows = rows.map(row => {
      const plainRow = row.get({plain: true});

      if (isRestaurant) {
        const isRoomService = !!plainRow.booking_id || plainRow.bookingId || plainRow.delivery_address?.toLowerCase() === "room service";

        const finalCheckOutText = isRoomService
          ? "Room Service"
          : (plainRow.delivery_address || "Pick-up");

        return {
          id: plainRow.id,
          status: plainRow.status === 'paid' ? 'confirmed' : plainRow.status,
          payment_status: plainRow.status === 'paid' ? 'paid' : 'unpaid',
          booking_id: plainRow.booking_id || plainRow.bookingId || null,

          room: {
            id: plainRow.restaurant_id,
            name: plainRow.restaurant?.name || "Yerevan National Restaurant",
            room_type: isRoomService ? "Room Service" : "Food Delivery",
            hotel: {
              id: plainRow.restaurant_id,
              name: plainRow.restaurant?.name || "Yerevan National Restaurant"
            }
          },

          check_in: moment(plainRow.createdAt).format("YYYY-MM-DD"),
          check_out: finalCheckOutText,

          user: plainRow.user || null,
          customer_name: plainRow.user?.userName,
          customer_email: plainRow.user?.email || plainRow.customer_email,
          customer_phone: plainRow.customer_phone || "No Phone",
          isPhoneVerified: !!plainRow.user,
          guests: 1,
          total_price: plainRow.amount,

          createdAt: plainRow.createdAt,
          updatedAt: plainRow.updatedAt
        };
      }

      return plainRow;
    });


    return res.json({
      success: true,
      bookings: formattedRows,
      stats,
      pagination: {
        total: count,
        page: pageNum,
        pages: Math.ceil(count / limitNum) || 1
      }
    });

  } catch (err) {
    console.error("GET ADMIN BOOKINGS SYSTEM ERROR:", err);
    return res.status(500).json({success: false, error: err.message});
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const {status, type} = req.body;

    const isRestaurant = type === "restaurant";

    if (isRestaurant) {
      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({success: false, error: "Restaurant order not found."});
      }

      if (status === "confirmed" || status === "paid") {
        order.status = "paid";
      } else if (status === "cancelled") {
        order.status = "cancelled";
      } else {
        order.status = status;
      }

      await order.save();
      await order.reload();

      return res.json({
        success: true,
        message: "Status synchronized successfully.",
        data: order
      });

    } else {
      const booking = await Booking.findByPk(id);
      if (!booking) {
        return res.status(404).json({success: false, error: "Hotel reservation not found."});
      }

      if (status === "cancelled") {
        booking.status = "cancelled";
        booking.cancelled_at = new Date();
      } else if (status === "paid" || status === "confirmed") {
        booking.payment_status = "paid";
        booking.paid_at = new Date();
        booking.status = "confirmed";
      } else {
        booking.status = status;
      }

      await booking.save();
      await booking.reload();

      return res.json({
        success: true,
        message: "Status synchronized successfully.",
        data: booking
      });
    }

  } catch (err) {
    console.error("UPDATE ADMIN ORDER STATUS SYSTEM ERROR:", err);
    return res.status(500).json({success: false, error: err.message});
  }
};

export const getOrderItemsByBooking = async (req, res) => {
  try {
    const {bookingId} = req.params;

    const orderItems = await OrderItem.findAll({
      where: {orderId: bookingId},
      include: [
        {
          model: MenuItem,
          include: [
            {
              model: Dish,
              attributes: ['id', 'name', 'default_image']
            }
          ]
        }
      ]
    });

    return res.status(200).json({data: orderItems});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};


//Analytics
export const getGlobalAnalytics = async (req, res) => {
  try {
    const startOfCurMonth = moment().startOf("month").toDate();
    const startOfLstMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLstMonth = moment().subtract(1, "month").endOf("month").toDate();

    const sixMonthsAgo = moment().subtract(5, "months").startOf("month").toDate();

    const [
      totalUsers,
      totalHotels,
      totalRestaurants,
      totalBookingsCount,
      totalOrdersCount,

      curMonthHotelSales,
      lastMonthHotelSales,
      curMonthOrderSales,
      lastMonthOrderSales,

      curMonthBookings,
      lastMonthBookings,
      curMonthUsers,
      lastMonthUsers,

      hotelMonthlyRevenue,
      restaurantMonthlyRevenue
    ] = await Promise.all([
      User.count(),
      Hotels.count(),
      Restaurant.count(),
      Booking.count(),
      Order.count(),

      Booking.sum("total_price", {where: {status: "confirmed", created_at: {[Op.gte]: startOfCurMonth}}}),
      Booking.sum("total_price", {
        where: {
          status: "confirmed",
          created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}
        }
      }),

      Order.sum("amount", {where: {status: "paid", created_at: {[Op.gte]: startOfCurMonth}}}),
      Order.sum("amount", {where: {status: "paid", created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      Booking.count({where: {created_at: {[Op.gte]: startOfCurMonth}}}),
      Booking.count({where: {created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      User.count({where: {created_at: {[Op.gte]: startOfCurMonth}}}),
      User.count({where: {created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      Booking.findAll({
        attributes: [
          "created_at",
          [fn("SUM", col("total_price")), "revenue"]
        ],
        where: {status: "confirmed", created_at: {[Op.gte]: sixMonthsAgo}},
        group: [fn("MONTH", col("created_at")), "created_at"],
        raw: true
      }),

      Order.findAll({
        attributes: [
          "created_at",
          [fn("SUM", col("amount")), "revenue"]
        ],
        where: {status: "paid", created_at: {[Op.gte]: sixMonthsAgo}},
        group: [fn("MONTH", col("created_at")), "created_at"],
        raw: true
      })
    ]);

    const calculateGrowth = (current = 0, last = 0) => {
      const curNum = Number(current) || 0;
      const lstNum = Number(last) || 0;
      if (lstNum === 0) return curNum > 0 ? "+100%" : "+0.0%";
      const change = ((curNum - lstNum) / lstNum) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const currentTotalRevenue = (curMonthHotelSales || 0) + (curMonthOrderSales || 0);
    const lastTotalRevenue = (lastMonthHotelSales || 0) + (lastMonthOrderSales || 0);

    const monthlyMap = {};
    const last6MonthsKeys = [];

    for (let i = 5; i >= 0; i--) {
      const monthName = moment().subtract(i, "months").format("MMM");
      monthlyMap[monthName] = 0;
      last6MonthsKeys.push(monthName);
    }

    if (hotelMonthlyRevenue && hotelMonthlyRevenue.length > 0) {
      hotelMonthlyRevenue.forEach(row => {
        const monthName = moment(row.created_at).format("MMM");
        if (monthlyMap[monthName] !== undefined) {
          monthlyMap[monthName] += Number(row.revenue) || 0;
        }
      });
    }

    if (restaurantMonthlyRevenue && restaurantMonthlyRevenue.length > 0) {
      restaurantMonthlyRevenue.forEach(row => {
        const monthName = moment(row.created_at).format("MMM");
        if (monthlyMap[monthName] !== undefined) {
          monthlyMap[monthName] += Number(row.revenue) || 0;
        }
      });
    }

    const revenueData = last6MonthsKeys.map(month => ({
      month,
      revenue: parseFloat(monthlyMap[month].toFixed(2))
    }));

    const totalTransactions = totalBookingsCount + totalOrdersCount;
    const bookingSources = [
      {name: "Website", value: totalTransactions > 0 ? Math.round((totalBookingsCount / totalTransactions) * 100) : 73},
      {
        name: "Mobile App",
        value: totalTransactions > 0 ? Math.round((totalOrdersCount / totalTransactions) * 100) : 27
      },
      {name: "Agency", value: 10}
    ];

    const stats = {
      totalRevenue: currentTotalRevenue,
      revenueGrowth: calculateGrowth(currentTotalRevenue, lastTotalRevenue),
      visitors: (totalUsers * 4) + 124,
      visitorsGrowth: "+12.4%",
      totalBookings: totalTransactions,
      bookingsGrowth: calculateGrowth(curMonthBookings, lastMonthBookings),
      totalUsers,
      usersGrowth: calculateGrowth(curMonthUsers, lastMonthUsers),
      totalHotels,
      hotelsGrowth: "+6.4%",
      totalRestaurants,
      restaurantsGrowth: "+4.8%",
      chartData: {
        revenueData,
        bookingSources
      }
    };

    return res.json({
      success: true,
      stats
    });

  } catch (err) {
    console.error("GET GLOBAL ANALYTICS SYSTEM ERROR:", err);
    return res.status(500).json({success: false, error: "Internal Server Error: " + err.message});
  }
};
export const getRevenueDashboardData = async (req, res) => {
  try {
    const startOfCurMonth = moment().startOf("month").toDate();
    const startOfLstMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLstMonth = moment().subtract(1, "month").endOf("month").toDate();
    const sixMonthsAgo = moment().subtract(5, "months").startOf("month").toDate();

    const [
      curMonthHotelSales,
      lastMonthHotelSales,
      curMonthOrderSales,
      lastMonthOrderSales,
      totalHotelBookings,
      totalRestaurantOrders,
      curMonthTransactions,
      lastMonthTransactions,

      hotelMonthlySales,
      restaurantMonthlySales,

      latestBookings,
      latestOrders
    ] = await Promise.all([
      Booking.sum("total_price", {where: {status: "confirmed", created_at: {[Op.gte]: startOfCurMonth}}}),
      Booking.sum("total_price", {
        where: {
          status: "confirmed",
          created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}
        }
      }),
      Order.sum("amount", {where: {status: "paid", created_at: {[Op.gte]: startOfCurMonth}}}),
      Order.sum("amount", {where: {status: "paid", created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),
      Booking.count(),
      Order.count(),
      Booking.count({where: {created_at: {[Op.gte]: startOfCurMonth}}}),
      Booking.count({where: {created_at: {[Op.between]: [startOfLstMonth, endOfLstMonth]}}}),

      // Monthly Grouped Sales
      Booking.findAll({
        attributes: ["created_at", [fn("SUM", col("total_price")), "revenue"]],
        where: {status: "confirmed", created_at: {[Op.gte]: sixMonthsAgo}},
        group: [fn("MONTH", col("created_at")), "created_at"],
        raw: true
      }),
      Order.findAll({
        attributes: ["created_at", [fn("SUM", col("amount")), "revenue"]],
        where: {status: "paid", created_at: {[Op.gte]: sixMonthsAgo}},
        group: [fn("MONTH", col("created_at")), "created_at"],
        raw: true
      }),

      Booking.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        include: [{model: User, as: "user", attributes: ["userName"]}],
        raw: true,
        nest: true
      }),
      Order.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        include: [{model: User, as: "user", attributes: ["userName"]}],
        raw: true,
        nest: true
      })
    ]);

    const calculateGrowth = (current = 0, last = 0) => {
      const curNum = Number(current) || 0;
      const lstNum = Number(last) || 0;
      if (lstNum === 0) return curNum > 0 ? "+100%" : "+0.0%";
      const change = ((curNum - lstNum) / lstNum) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const currentTotalRevenue = (curMonthHotelSales || 0) + (curMonthOrderSales || 0);
    const lastTotalRevenue = (lastMonthHotelSales || 0) + (lastMonthOrderSales || 0);

    const monthlyMap = {};
    const monthsKeys = [];
    for (let i = 5; i >= 0; i--) {
      const monthName = moment().subtract(i, "months").format("MMM");
      monthlyMap[monthName] = 0;
      monthsKeys.push(monthName);
    }

    hotelMonthlySales.forEach(r => {
      const mName = moment(r.created_at).format("MMM");
      if (monthlyMap[mName] !== undefined) monthlyMap[mName] += Number(r.revenue) || 0;
    });
    restaurantMonthlySales.forEach(r => {
      const mName = moment(r.created_at).format("MMM");
      if (monthlyMap[mName] !== undefined) monthlyMap[mName] += Number(r.revenue) || 0;
    });

    const salesValues = monthsKeys.map(m => parseFloat(monthlyMap[m].toFixed(2)));

    const formattedBookings = latestBookings.map(b => ({
      id: `#TR${b.id}`,
      hotel: "Hotel Room Booking",
      guest: b.user?.userName || b.customer_name || "Guest Customer",
      amount: `$${b.total_price}`,
      method: "Visa",
      status: b.status === "confirmed" ? "Completed" : "Pending",
      date: moment(b.createdAt).format("DD MMM YYYY"),
      rawDate: b.createdAt
    }));

    const formattedOrders = latestOrders.map(o => ({
      id: `#ORD${o.id}`,
      hotel: "Restaurant Order Delivery",
      guest: o.user?.userName || "Food Customer",
      amount: `$${o.amount}`,
      method: o.stripe_session_id ? "Card" : "Cash",
      status: o.status === "paid" ? "Completed" : "Pending",
      date: moment(o.createdAt).format("DD MMM YYYY"),
      rawDate: o.createdAt
    }));

    const recentTransactions = [...formattedBookings, ...formattedOrders]
      .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
      .slice(0, 10);

    const stats = {
      totalRevenue: currentTotalRevenue,
      netProfit: parseFloat((currentTotalRevenue * 0.70).toFixed(2)),
      revenueGrowth: calculateGrowth(currentTotalRevenue, lastTotalRevenue),
      profitGrowth: calculateGrowth(currentTotalRevenue, lastTotalRevenue),
      totalTransactions: totalHotelBookings + totalRestaurantOrders,
      transactionsGrowth: calculateGrowth(curMonthTransactions, lastMonthTransactions),
      refundLoss: 0,
      recentTransactions,
      chartData: {
        months: monthsKeys,
        salesValues
      }
    };

    return res.json({success: true, stats});

  } catch (err) {
    console.error("GET REVENUE DASHBOARD SYSTEM ERROR:", err);
    return res.status(500).json({success: false, error: err.message});
  }
};


//settings

const hashPassword = (password) => md5(md5(password) + process.env.USER_SECRET);
export const getPlatformSettings = async (req, res) => {
  try {
    const adminId = req.userId || 1;
    const admin = await User.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({success: false, message: "Admin profile not found."});
    }

    const settings = {
      adminName: admin.userName || "Super Admin",
      adminEmail: admin.email || "admin@platform.com",
      themeMode: admin.theme_mode || "dark",
      checkInTime: admin.check_in_time || "14:00",
      checkOutTime: admin.check_out_time || "12:00",
      confirmMode: admin.confirm_mode || "auto",
      stripeKey: admin.stripe_key || "sk_test_51Matrix...",
      paypalKey: admin.paypal_key || "pay_test_Matrix...",
      commission: admin.commission || 10,
      alertBooking: admin.alert_booking !== false,
      alertEmail: admin.alert_email !== false,
      alertRefund: admin.alert_refund !== false,
      sessionTimeout: admin.session_timeout || 30,
      twoFactor: admin.two_factor || "disabled"
    };

    return res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    console.error("GET SETTINGS SYSTEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message
    });
  }
};
export const updatePlatformSettings = async (req, res) => {
  try {
    const adminId = req.userId || 1;
    const {
      adminName,
      adminEmail,
      oldPassword,
      newPassword,
      themeMode,
      checkInTime,
      checkOutTime,
      confirmMode,
      stripeKey,
      paypalKey,
      commission,
      alertBooking,
      alertEmail,
      alertRefund,
      sessionTimeout,
      twoFactor
    } = req.body;

    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({success: false, message: "Admin account not found."});
    }

    if (newPassword && newPassword.trim() !== "") {
      if (admin.password !== hashPassword(oldPassword)) {
        return res.status(400).json({success: false, message: "The old password is incorrect"});
      }
      admin.password = hashPassword(newPassword);
    }

    admin.userName = adminName;
    admin.email = adminEmail;

    admin.theme_mode = themeMode;
    admin.check_in_time = checkInTime;
    admin.check_out_time = checkOutTime;
    admin.confirm_mode = confirmMode;
    admin.stripe_key = stripeKey;
    admin.paypal_key = paypalKey;
    admin.commission = Number(commission) || 10;
    admin.alert_booking = alertBooking;
    admin.alert_email = alertEmail;
    admin.alert_refund = alertRefund;
    admin.session_timeout = Number(sessionTimeout) || 30;
    admin.two_factor = twoFactor;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Platform settings registry synchronized successfully within admin model."
    });

  } catch (error) {
    console.error("UPDATE SETTINGS SYSTEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message
    });
  }
};


///restaurants
export const getAdminRestaurants = async (req, res, next) => {
  console.log(req.query);
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      status = "active",
      cuisineType,
      category,
      priceRange,
      city,
      createdFrom,
      createdTo,
      sort = "newest",
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 15, 1);
    const offset = (pageNum - 1) * limitNum;

    const where = {
      ...(search && {
        [Op.or]: [
          {name: {[Op.like]: `%${search}%`}},
          {city: {[Op.like]: `%${search}%`}}
        ]
      }),
      ...(city && {city: {[Op.like]: `%${city}%`}}),
      ...(category && {category}),
      ...(priceRange && {priceRange}),
      ...(cuisineType && {cuisineType: {[Op.in]: cuisineType.split(",")}}),
      ...(status === "inactive" && {id: -1})
    };

    let order = [["created_at", "DESC"]];
    if (sort === "oldest") order = [["created_at", "ASC"]];
    if (sort === "name") order = [["name", "ASC"]];


    const totalCount = await Restaurant.count({
      where,
      distinct: true,
      col: 'id'
    });

    const allFilteredRestaurantRows = await Restaurant.findAll({
      where,
      attributes: ['id'],
      raw: true
    });
    const allFilteredIds = allFilteredRestaurantRows.map(r => r.id);

    let globalTotalOrders = 0;
    let globalTotalRevenue = 0;

    if (allFilteredIds.length > 0) {
      const [ordersCount, revenueSum] = await Promise.all([
        Order.count({
          where: {
            restaurant_id: {[Op.in]: allFilteredIds},
            status: {[Op.in]: ["paid", "pending"]}
          }
        }),
        Order.sum("amount", {
          where: {
            restaurant_id: {[Op.in]: allFilteredIds},
            status: "paid"
          }
        })
      ]);
      globalTotalOrders = ordersCount || 0;
      globalTotalRevenue = revenueSum || 0;
    }

    const filteredRestaurantsPaged = await Restaurant.findAll({
      where,
      limit: limitNum,
      offset,
      order,
      attributes: ['id'],
      raw: true
    });

    const restaurantIds = filteredRestaurantsPaged.map(r => r.id);

    if (restaurantIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        rows: [],
        stats: {
          totalRestaurants: totalCount,
          totalOrders: globalTotalOrders,
          totalRevenue: `$${(Number(globalTotalRevenue) || 0).toLocaleString()}`,
          activeCount: 0
        },
        pagination: {total: 0, page: pageNum, pages: 1}
      });
    }


    const rawRestaurants = await Restaurant.findAll({
      where: {id: {[Op.in]: restaurantIds}},
      order,
      include: [
        {model: Hotels, as: "hotel", attributes: ["id", "name"]},
        {model: User, as: "owner", attributes: ["id", "userName", "email"]},
        {model: RestaurantImage, as: "images"}
      ]
    });

    let activeRestaurantsCount = 0;

    const rows = await Promise.all(
      rawRestaurants.map(async (restaurant) => {
        const plainRest = restaurant.get({plain: true});

        const [bookingsCount, totalRevenueAmount, reviewsCount, avgRating] = await Promise.all([
          Order.count({
            where: {restaurant_id: plainRest.id, status: {[Op.in]: ["paid", "pending"]}}
          }),
          Order.sum("amount", {
            where: {restaurant_id: plainRest.id, status: "paid"}
          }),
          RestaurantReview.count({
            where: {restaurant_id: plainRest.id}
          }),
          RestaurantReview.aggregate("rating", "AVG", {
            where: {restaurant_id: plainRest.id}
          })
        ]);

        const currentStatus = bookingsCount > 15 ? "Busy" : "Open";
        if (currentStatus === "Open" || currentStatus === "Busy") {
          activeRestaurantsCount++;
        }

        const formattedImages = Array.isArray(plainRest.images)
          ? plainRest.images.map(img => ({
            id: img.id,
            path: img.imageUrl,
            public_id: img.publicId,
            is_main: img.imageUrl === plainRest.image
          }))
          : [];


        return {
          ...plainRest,
          images: formattedImages,
          image: plainRest.image && plainRest.image.trim() !== "" && plainRest.image.startsWith("http")
            ? plainRest.image
            : "https://unsplash.com",

          city: plainRest.city || "Yerevan",
          cuisineType: plainRest.cuisineType || "International",
          priceRange: plainRest.priceRange || "$$",
          rating: avgRating ? parseFloat(Number(avgRating).toFixed(1)) : 5.0,
          reviews: reviewsCount || 0,
          tables: Math.max(Math.round((bookingsCount * 0.3) + 8), 10),
          bookings: bookingsCount || 0,
          revenue: `$${(Number(totalRevenueAmount) || 0).toLocaleString()}`,
          status: currentStatus,
          hotel: plainRest.hotel,
          owner: plainRest.owner,
          createdAt: plainRest.createdAt
        };
      })
    );


    const stats = {
      totalRestaurants: totalCount,
      totalOrders: globalTotalOrders,
      totalRevenue: `$${(Number(globalTotalRevenue) || 0).toLocaleString()}`,
      activeCount: activeRestaurantsCount
    };

    return res.status(200).json({
      success: true,
      count: totalCount,
      rows,
      stats,
      pagination: {
        total: totalCount,
        page: pageNum,
        pages: Math.ceil(totalCount / limitNum) || 1
      }
    });

  } catch (error) {
    console.error("GET ADMIN RESTAURANTS SYSTEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message
    });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      cuisineType,
      category,
      priceRange,
      phone,
      image,
      city,
      address,
      latitude,
      longitude,
      hotelId,
      ownerId
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Name, City, and Address are required fields."
      });
    }

    const newRestaurant = await Restaurant.create({
      name,
      description,
      cuisineType,
      category: category || "luxury",
      priceRange: priceRange || "$$",
      phone,
      image: image && image.trim() !== "" ? image : null,
      city: city || "Yerevan",
      address,
      latitude: latitude || "40.1792",
      longitude: longitude || "44.5152",
      hotelId: hotelId || null,
      ownerId: ownerId || 1
    });

    return res.status(201).json({
      success: true,
      message: "New restaurant hub profile registered and nested successfully.",
      restaurant: newRestaurant
    });

  } catch (error) {
    console.error("CREATE RESTAURANT SYSTEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message
    });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const {id} = req.params;
    const {
      name,
      description,
      cuisineType,
      category,
      priceRange,
      phone,
      image,
      city,
      address,
      latitude,
      longitude,
      hotelId
    } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({success: false, message: "Target restaurant listing profiles matrix not found."});
    }

    restaurant.name = name;
    restaurant.description = description;
    restaurant.cuisineType = cuisineType;
    restaurant.category = category;
    restaurant.priceRange = priceRange;
    restaurant.phone = phone;
    restaurant.image = image;
    restaurant.city = city;
    restaurant.address = address;
    restaurant.latitude = latitude;
    restaurant.longitude = longitude;
    restaurant.hotelId = hotelId || null;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant profile matrix entry updated successfully.",
      restaurant
    });

  } catch (error) {
    console.error("UPDATE RESTAURANT PROFILE ERROR:", error);
    return res.status(500).json({success: false, message: "Internal Server Error: " + error.message});
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const {id} = req.params;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({success: false, message: "Restaurant registry item not found."});
    }

    await restaurant.destroy();

    return res.status(200).json({
      success: true,
      message: "Restaurant listing profile permanent destroy finalized."
    });

  } catch (error) {
    console.error("DELETE RESTAURANT MATRIX ERROR:", error);
    return res.status(500).json({success: false, message: "Internal Server Error: " + error.message});
  }
};

export const syncRestaurantGallery = async (req, res) => {
  try {
    const {restaurant_id, images: clientImagesJson, mainIndex} = req.body;

    const restaurant = await Restaurant.findByPk(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({success: false, message: "Restaurant hub not found."});
    }

    const clientImages = JSON.parse(clientImagesJson || "[]");

    const clientActiveIds = clientImages.filter(img => img.id && !img.replaced).map(img => img.id);

    const imagesToDeleteFromCloudinary = await RestaurantImage.findAll({
      where: {
        restaurant_id: restaurant_id,
        id: {[Op.notIn]: clientActiveIds.length > 0 ? clientActiveIds : [0]}
      }
    });

    for (const img of imagesToDeleteFromCloudinary) {
      if (img.publicId) {
        try {
          await cloudinary.uploader.destroy(img.publicId);
          console.log(`Cloudinary asset destroyed successfully: ${img.publicId}`);
        } catch (clErr) {
          console.error(`Cloudinary destroy asset error for ${img.publicId}:`, clErr.message);
        }
      }
    }

    await RestaurantImage.destroy({
      where: {
        restaurant_id: restaurant_id,
        id: {[Op.notIn]: clientActiveIds.length > 0 ? clientActiveIds : [0]}
      }
    });

    const imagesData = [];
    const files = req.files || [];

    const newClientImages = clientImages.filter(img => img.isNew || img.replaced);

    files.forEach((file, index) => {
      const secureUrl = file.path;
      const publicId = file.filename;

      const currentClientConfig = newClientImages[index] || {};

      imagesData.push({
        restaurantId: Number(restaurant_id),
        imageUrl: secureUrl,
        publicId: publicId
      });

      if (currentClientConfig.is_main) {
        currentClientConfig.path = secureUrl;
      }
    });

    if (imagesData.length > 0) {
      await RestaurantImage.bulkCreate(imagesData);
    }


    let mainImageUrl = null;

    const mainConfig = clientImages.find(img => img.is_main === true);

    if (mainConfig) {
      mainImageUrl = mainConfig.path || mainConfig.preview;
    }

    if (!mainImageUrl) {
      const fallbackImg = await RestaurantImage.findOne({where: {restaurant_id}});
      if (fallbackImg) {
        mainImageUrl = fallbackImg.imageUrl;
      }
    }

    if (mainImageUrl) {
      await restaurant.update({image: mainImageUrl});
      console.log(`Restaurant main cover updated to: ${mainImageUrl}`);
    } else {
      await restaurant.update({image: null});
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant visual gallery synchronized with Cloudinary storage successfully. Main image updated."
    });

  } catch (error) {
    console.error("SYNC RESTAURANT GALLERY SYSTEM ERROR VIA CLOUDINARY:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message
    });
  }
};


//menu
export const getRestaurantMenu = async (req, res) => {
  try {
    const {restaurantId} = req.params;

    const menuItems = await MenuItem.findAll({
      where: {restaurantId},
      include: [
        {
          model: Dish,
          attributes: ['id', 'name', 'default_image']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({data: menuItems});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};
export const createMenuItem = async (req, res) => {
  try {
    const {restaurant_id, dish_id, price} = req.body;

    const custom_image = req.file ? req.file.path : null;

    const existingItem = await MenuItem.findOne({
      where: {restaurantId: restaurant_id, dishId: dish_id}
    });

    if (existingItem) {
      return res.status(400).json({message: "This dish is already registered in your restaurant menu."});
    }

    const newMenuItem = await MenuItem.create({
      restaurantId: restaurant_id,
      dishId: dish_id,
      price,
      customImage: custom_image
    });

    const fullItem = await MenuItem.findByPk(newMenuItem.id, {include: [Dish]});

    const itemJson = fullItem.toJSON();
    itemJson.imageUrl = itemJson.customImage || itemJson.Dish?.image || "https://placeholder.com";

    return res.status(201).json({data: itemJson});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const {id} = req.params;
    const {price} = req.body;

    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) return res.status(404).json({message: "Menu item not found."});

    const custom_image = req.file ? req.file.path : menuItem.customImage;

    await menuItem.update({price, customImage: custom_image});

    const updatedItem = await MenuItem.findByPk(id, {include: [Dish]});

    const itemJson = updatedItem.toJSON();
    itemJson.imageUrl = itemJson.customImage || itemJson.Dish?.image || "https://placeholder.com";

    return res.status(200).json({data: itemJson});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};


export const deleteMenuItem = async (req, res) => {
  try {
    const {id} = req.params;

    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({message: "Menu item matrix registry not found."});
    }

    await menuItem.destroy();
    return res.status(200).json({message: "Menu item successfully purged from registry."});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getDishes = async (req, res) => {
  try {
    const dishes = await Dish.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({data: dishes});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

//reviews

export const getAdminAllReviews = async (req, res) => {
  try {
    const {page = 1, limit = 10, search, verified, sort, min_score, traveller_type} = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const hotelWhere = {};
    if (verified) hotelWhere.verified = verified === "true";
    if (traveller_type) hotelWhere.traveller_type = traveller_type;
    if (search) hotelWhere.comment = {[Op.like]: `%${search}%`};
    if (min_score) hotelWhere.score = {[Op.gte]: parseFloat(min_score)};

    const restWhere = {};
    if (search) restWhere.comment = {[Op.like]: `%${search}%`};
    if (min_score) {
      const scoreNum = parseFloat(min_score);
      const restMinRating = scoreNum >= 9 ? 5 : scoreNum >= 8 ? 4 : scoreNum >= 7 ? 3 : 2;
      restWhere.rating = {[Op.gte]: restMinRating};
    }

    const shouldFetchRestaurants = !traveller_type;

    const [
      hotelInsights,
      restaurantInsights,
      hotelCount,
      restCount,
      hotelRows,
      restRows
    ] = await Promise.all([
      Reviews.findAll({
        where: hotelWhere,
        attributes: ['traveller_type', [fn('COUNT', col('id')), 'totalReviews'], [fn('AVG', col('score')), 'averageRating']],
        group: ['traveller_type'],
        raw: true
      }),
      shouldFetchRestaurants ? RestaurantReview.findAll({
        where: restWhere,
        attributes: [[fn('COUNT', col('id')), 'totalReviews'], [fn('AVG', col('rating')), 'averageRating']],
        raw: true
      }) : [],
      Reviews.count({where: hotelWhere}),
      shouldFetchRestaurants ? RestaurantReview.count({where: restWhere}) : 0,
      Reviews.findAll({
        where: hotelWhere,
        limit: parsedLimit,
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {model: User, as: 'user', attributes: ['id', 'userName', 'profilePicture']},
          {model: Hotels, attributes: ['id', 'name', 'city']},
          {model: ReviewLiked, as: 'liked_features', attributes: ['feature']}
        ]
      }),
      shouldFetchRestaurants ? RestaurantReview.findAll({
        where: restWhere,
        limit: parsedLimit,
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {model: User, as: 'user', attributes: ['id', 'userName', 'profilePicture']},
          {model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'city']}
        ]
      }) : []
    ]);

    const formattedHotels = hotelRows.map(r => {
      const json = r.get({plain: true});
      return {
        id: `hotel_${json.id}`,
        userName: json.user?.userName,
        userImage: json.user?.profilePicture,
        hotelName: json.Hotel?.name || "StayTaste Hotel",
        hotel: json.Hotel,
        rating: json.score,
        comment: json.comment,
        verified: json.verified,
        createdAt: json.createdAt,
        likedFeatures: (json.liked_features || []).map(f => f.feature)
      };
    });

    const formattedRests = restRows.map(r => {
      const json = r.get({plain: true});
      return {
        id: `rest_${json.id}`,
        userName: json.user?.userName,
        userImage: json.user?.profilePicture,
        hotelName: json.restaurant?.name || "StayTaste Restaurant",
        hotel: json.restaurant,
        rating: json.rating,
        comment: json.comment,
        verified: !!json.reservationId,
        createdAt: json.createdAt,
        likedFeatures: json.sentiment ? [json.sentiment] : []
      };
    });

    let combinedReviews = [...formattedHotels, ...formattedRests];

    if (sort === "newest") combinedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "oldest") combinedReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "score_high") combinedReviews.sort((a, b) => b.rating - a.rating);
    if (sort === "score_low") combinedReviews.sort((a, b) => a.rating - b.rating);

    const finalPageItems = combinedReviews.slice(0, parsedLimit);
    const totalItems = hotelCount + restCount;

    const insightsMatrix = hotelInsights.map(hi => ({
      traveller_type: hi.traveller_type || "Unknown",
      totalReviews: parseInt(hi.totalReviews || 0),
      averageRating: parseFloat(hi.averageRating || 0).toFixed(1)
    }));

    if (restaurantInsights?.[0] && restaurantInsights[0].totalReviews > 0) {
      insightsMatrix.push({
        traveller_type: "Food Delivery",
        totalReviews: parseInt(restaurantInsights[0].totalReviews),
        averageRating: parseFloat(restaurantInsights[0].averageRating || 0).toFixed(1)
      });
    }

    return res.status(200).json({
      data: finalPageItems,
      travellerInsights: insightsMatrix,
      pagination: {
        totalItems,
        pages: Math.ceil(totalItems / parsedLimit),
        currentPage: parsedPage
      }
    });

  } catch (error) {
    console.log(error, 555)
    return res.status(500).json({error: error.message});
  }
};

export const deleteReview = async (req, res) => {
  try {
    const {id} = req.params;

    if (id.startsWith("hotel_")) {
      const realId = id.replace("hotel_", "");
      const review = await Reviews.findByPk(realId);
      if (review) await review.destroy();
    } else if (id.startsWith("rest_")) {
      const realId = id.replace("rest_", "");
      const review = await RestaurantReview.findByPk(realId);
      if (review) await review.destroy();
    }

    return res.status(200).json({message: "Review successfully purged from dynamic matrix registry table."});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const adminId = req.userId;

    const notifications = await Notification.findAll({
      where: {userId: adminId},
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({data: notifications});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};


export const getCalendarData = async (req, res) => {
  try {
    const { start, end } = req.query;

    const bookingWhere = {
      status: { [Op.in]: ["confirmed", "pending"] }
    };

    if (start && end) {
      bookingWhere[Op.or] = [
        { check_in: { [Op.between]: [start, end] } },
        { check_out: { [Op.between]: [start, end] } },
        {
          [Op.and]: [
            { check_in: { [Op.lte]: start } },
            { check_out: { [Op.gte]: end } }
          ]
        }
      ];
    }

    const rooms = await Room.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: Booking,
          as: "Bookings", // 🔥 Ուղղված է մեծատառով՝ ըստ ձեր մոդելի սահմանման
          attributes: ["check_in", "check_out", "status"],
          where: bookingWhere,
          required: false
        }
      ]
    });

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




export const getUniqueAmenityCategories = async (req, res) => {
  try {
    const categories = await Amenity.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("category")), "category"]
      ],
      where: {
        category: { [Op.ne]: null }
      },
      raw: true
    });

    const list = categories.map(c => c.category).filter(Boolean);

    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getCategoriesOverviewData = async (req, res) => {
  try {
    // 1. Ստատիստիկայի քարտերի համար հաշվում ենք ENUM-ների ընդհանուր քանակը
    const hotelCounts = await Hotels.findAll({
      attributes: ["hotel_category"],
      group: ["hotel_category"],
      raw: true
    });

    const restaurantCounts = await Restaurant.findAll({
      attributes: ["category"],
      group: ["category"],
      raw: true
    });

    // 2. Ստանում ենք ԱՄԵՆ ՄԻ ՀԱՐՄԱՐՈՒԹՅՈՒՆԸ և հաշվում, թե քանի հյուրանոցում է այն օգտագործված
    // ⚠️ ՆՇՈՒՄ. Եթե հյուրանոցների հետ կապը belongsToMany է (through: HotelAmenities),
    // ապա sequelize.literal-ով հաշվում ենք միջանկյալ (join) աղյուսակի տողերը
    const amenitiesWithUsage = await Amenity.findAll({
      attributes: [
        "id",
        "key",
        "name",
        "category",
        "scope",
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM hotel_amenities 
            WHERE hotel_amenities.amenity_id = Amenity.id
          )`),
          "hotel_usage_count"
        ]
      ],
      order: [["category", "ASC"], ["name", "ASC"]],
      raw: true
    });

    const totalHotelsCats = hotelCounts.length;
    const totalRestaurantsCats = restaurantCounts.length;
    const totalAmenitiesCats = [...new Set(amenitiesWithUsage.map(a => a.category))].length;
    const totalCategories = totalHotelsCats + totalRestaurantsCats + totalAmenitiesCats;

    const flatCategoriesList = [];

    // 3. Ձևավորում ենք աղյուսակի տվյալները
    amenitiesWithUsage.forEach(item => {
      flatCategoriesList.push({
        id: item.id,                        // 🔥 Պետք է Update/Delete-ի համար
        key: item.key,                      // 🔥 Ցույց է տալիս համակարգային բանալին
        name: item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : "Unnamed", // 🎯 Ցույց է տալիս իրական անունը (օր.՝ Free Wifi)
        type: "Amenity",
        parent: item.scope ? item.scope.toUpperCase() : "BOTH", // ROOM, HOTEL կամ BOTH
        items: parseInt(item.hotel_usage_count) || 0, // 🎯 Ցույց է տալիս, թե քանի անգամ է օգտագործված
        status: "Active",
        date: "Table Data"
      });
    });

    // Դասավորում ենք ըստ ամենաշատ օգտագործվածների
    flatCategoriesList.sort((a, b) => b.items - a.items);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalCategories,
          hotels: totalHotelsCats,
          restaurants: totalRestaurantsCats,
          amenities: totalAmenitiesCats
        },
        allCategories: flatCategoriesList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



export const createAmenity = async (req, res) => {
  try {
    const { key, name, category, scope = "room" } = req.body;

    // validation
    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: "key and name required",
      });
    }

    const normalizedKey = key.trim().toLowerCase();

    const exists = await Amenity.findOne({
      where: { key: normalizedKey },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Amenity already exists",
      });
    }

    const amenity = await Amenity.create({
      key: normalizedKey,
      name,
      category,
      scope,
    });

    res.json({
      success: true,
      data: amenity,
    });
  } catch (e) {
    console.log(e.response)
    res.status(500).json({
      success: false,
      message: "Create failed",
    });
  }
};

export const updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, name, category, scope } = req.body;

    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (key && key !== amenity.key) {
      const exists = await Amenity.findOne({
        where: { key: key.trim().toLowerCase() },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Key already exists",
        });
      }
    }

    const updateData = {
      ...(key && { key: key.trim().toLowerCase() }),
      ...(name && { name }),
      ...(category && { category }),
      ...(scope && { scope }),
    };

    await amenity.update(updateData);

    res.json({
      success: true,
      data: amenity,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

export const deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;

    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // 🔥 check if used in hotels
    const hotelUsage = await amenity.countHotels();
    const roomUsage = await amenity.countRooms();

    if (hotelUsage > 0 || roomUsage > 0) {
      return res.status(400).json({
        success: false,
        message: "Amenity is in use and cannot be deleted",
      });
    }

    await amenity.destroy();

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};






const AMENITIES = [
  // Bedroom
  { key: "air_conditioning", name: "Air-conditioning", category: "Bedroom", scope: "room" },
  { key: "heating", name: "Heating", category: "Bedroom", scope: "room" },
  { key: "blackout_curtains", name: "Blackout curtains", category: "Bedroom", scope: "room" },
  { key: "ceiling_fan", name: "Ceiling fan", category: "Bedroom", scope: "room" },
  { key: "premium_bedding", name: "Premium bedding", category: "Bedroom", scope: "room" },
  { key: "soundproofing", name: "Soundproofing", category: "Bedroom", scope: "room" },
  { key: "separate_bedroom", name: "Separate bedroom", category: "Bedroom", scope: "room" },
  { key: "alarm_clock", name: "Alarm clock", category: "Bedroom", scope: "room" },

  // Bathroom
  { key: "private_bathroom", name: "Private bathroom", category: "Bathroom", scope: "room" },
  { key: "bathtub", name: "Bathtub", category: "Bathroom", scope: "room" },
  { key: "shower", name: "Shower", category: "Bathroom", scope: "room" },
  { key: "rainfall_shower", name: "Rainfall shower", category: "Bathroom", scope: "room" },
  { key: "hair_dryer", name: "Hair dryer", category: "Bathroom", scope: "room" },
  { key: "free_toiletries", name: "Free toiletries", category: "Bathroom", scope: "room" },
  { key: "towels", name: "Towels", category: "Bathroom", scope: "room" },
  { key: "bathrobes", name: "Bathrobes", category: "Bathroom", scope: "room" },
  { key: "slippers", name: "Slippers", category: "Bathroom", scope: "room" },

  // Entertainment
  { key: "tv", name: "TV", category: "Entertainment", scope: "room" },
  { key: "smart_tv", name: "Smart TV", category: "Entertainment", scope: "room" },
  { key: "streaming_services", name: "Streaming services", category: "Entertainment", scope: "room" },

  // Food (ROOM)
  { key: "mini_fridge", name: "Mini-fridge", category: "Food", scope: "room" },
  { key: "minibar", name: "Minibar", category: "Food", scope: "room" },
  { key: "coffee_maker", name: "Coffee maker", category: "Food", scope: "room" },
  { key: "electric_kettle", name: "Electric kettle", category: "Food", scope: "room" },
  { key: "microwave", name: "Microwave", category: "Food", scope: "room" },
  { key: "room_service", name: "Room service", category: "Food", scope: "hotel" },

  // Internet
  { key: "free_wifi", name: "Free WiFi", category: "Internet", scope: "both" },
  { key: "high_speed_wifi", name: "High-speed WiFi", category: "Internet", scope: "both" },
  { key: "wired_internet", name: "Wired internet", category: "Internet", scope: "both" },

  // Comfort
  { key: "desk", name: "Desk", category: "Comfort", scope: "room" },
  { key: "safe", name: "Safe", category: "Comfort", scope: "room" },
  { key: "daily_housekeeping", name: "Daily housekeeping", category: "Comfort", scope: "hotel" },

  // Accessibility
  { key: "wheelchair_accessible", name: "Wheelchair accessible", category: "Accessibility", scope: "hotel" },
  { key: "elevator_access", name: "Elevator access", category: "Accessibility", scope: "hotel" },

  // Safety
  { key: "smoke_detector", name: "Smoke detector", category: "Safety", scope: "both" },
  { key: "fire_extinguisher", name: "Fire extinguisher", category: "Safety", scope: "both" },
  { key: "security_system", name: "Security system", category: "Safety", scope: "both" },

  // General
  { key: "free_parking", name: "Free parking", category: "General", scope: "hotel" },
  { key: "balcony", name: "Balcony", category: "General", scope: "room" },
  { key: "city_view", name: "City view", category: "General", scope: "room" },

  // Services
  { key: "laundry_service", name: "Laundry service", category: "Services", scope: "hotel" },
  { key: "front_desk_24h", name: "24-hour front desk", category: "Services", scope: "hotel" },
  { key: "concierge_service", name: "Concierge service", category: "Services", scope: "hotel" },

  // Recreation
  { key: "pool", name: "Swimming pool", category: "Recreation", scope: "hotel" },
  { key: "restaurant", name: "Restaurant", category: "Food", scope: "hotel" },

  // 🆕 NEW
  { key: "spa", name: "Spa", category: "Wellness", scope: "hotel" },
  { key: "gym", name: "Gym", category: "Wellness", scope: "hotel" },
];


export const seedAmenities = async (req, res) => {
  try {
    const formatted = AMENITIES.map((a) => ({
      ...a,
      key: a.key.trim().toLowerCase(),
      scope: a.scope || "room",
    }));

    await Amenity.bulkCreate(formatted, {
      ignoreDuplicates: true,
      validate: true,
    });

    res.json({
      success: true,
      message: "Amenities seeded",
    });
  } catch (e) {
    res.status(500).json({
      message: "Seed failed",
      error: e.message,
    });
  }
};


export const getAllAmenitiesAdmin = async (req, res) => {
  try {
    const view = req.query.view || "grouped";
    const scope = req.query.scope; // room | hotel | all

    let where = {};

    // scope logic
    if (scope && scope !== "all") {
      const map = {
        room: ["room", "both"],
        hotel: ["hotel", "both"],
        both: ["room", "hotel", "both"],
      };

      where.scope = {
        [Op.in]: map[scope] || ["room", "hotel", "both"],
      };
    }

    const amenities = await Amenity.findAll({
      where,
      attributes: ["id", "key", "name", "category", "scope"],
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    // FLAT
    if (view === "flat") {
      return res.json({
        success: true,
        data: amenities,
      });
    }

    // GROUPED (simple & clean)
    const grouped = amenities.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: grouped,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Admin fetch failed",
      error: e.message,
    });
  }
};



export const getAdminReviewsDashboard = async (req, res) => {

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

        averageRating: Number(averageScore || 0).toFixed(1),
        totalReviews,
        positivePercentage,
        newReviewsThisMonth,
      },

      // ======================
      // LATEST REVIEWS
      // ======================

      latestReviews: latestReviews.map(
        (review) => ({
          id:
          review.id,
          userName:
          review.reviewer_name,
          hotelName:
          review.Hotel?.name,
          rating: Number(review.score),
          comment:
          review.comment,
          createdAt:
          review.createdAt,
          verified:
          review.verified,
          likedFeatures: review.liked_features?.map((item) => item.feature) || [],

        })
      ),

      // ======================
      // OVERVIEW
      // ======================
      ratingOverview: formattedOverview,
      topHotels: topHotels.map((hotel) => {
          const plain = hotel.toJSON();
          const mainPhoto = plain.images?.find((img) => img.is_main === 1)?.path
            || plain.images?.[0]?.path
            || null;

          return {
            id:
            plain.id,
            name:
            plain.name,
            rating: Number(plain.rating || 0).toFixed(1),
            reviewCount: Number(plain.reviewCount || 0),
            city: plain.city,
            country: plain.country,
            price_from: plain.price_from,
            currency: plain.currency,
            category: plain.property_class,
            mainPhoto,

          };

        }
      ),

    });

  } catch (e) {

    console.log("ADMIN REVIEWS DASHBOARD ERROR:", e);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews dashboard",

    });

  }

};


// ======================
// EXPORT REVIEWS REPORT
// ======================

export const exportReviewsReport = async (req, res) => {

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
        Reviewer: review.reviewer_name,
        Hotel: review.Hotel?.name || "",
        City: review.Hotel?.city || "",
        Country: review.Hotel?.country || "",
        Rating: review.score,
        Comment: review.comment || "",
        Verified: review.verified ? "Yes" : "No",
        Date: review.createdAt,

      }));

    // ======================
    // CSV
    // ======================

    const json2csv = new Parser();

    const csv = json2csv.parse(formatted);

    // ======================
    // HEADERS
    // ======================

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment("reviews-report.csv");

    // ======================
    // RESPONSE
    // ======================

    return res.send(csv);

  } catch (e) {
    console.log("EXPORT REVIEWS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to export report",
    });

  }

};
