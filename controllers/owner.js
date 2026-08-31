import Users from "../models/User.js";
import {col, fn, Model as OrderrItem, Op, Sequelize} from "sequelize";
import Socket from "../services/Socket.js";
import {ReviewLiked, ReviewReplies} from "../models/index.js";
import Hotels from "../models/Hotels.js";
import Restaurant from "../models/Restaurant.js";
import Notification from "../models/Notification.js";
import Booking from "../models/Booking.js";
import Reservation from "../models/Reservation.js";
import Order from "../models/Order.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Amenity from "../models/Amenity.js";
import RoomOption from "../models/RoomOption.js";
import RoomExtra from "../models/RoomExtra.js";
import Reviews from "../models/Reviews.js";
import LocationPoint from "../models/LocationPoint.js";
import sequelize from "../clients/db.sequelize.mysql.js";
import {cloudinary} from "../middlewares/upload.js";
import moment from "moment";
import RoomAmenity from "../models/RoomAmenities.js";
import MenuItem from "../models/MenuItem.js";
import Dish from "../models/Dish.js";
import RestaurantReview from "../models/RestaurantReview.js";
import RestaurantImage from "../models/RestaurantImage.js";
import OrderItem from "../models/OrderItem.js";
import Post from "../models/Post.js";
import md5 from "md5";


const hashPassword = (password) => md5(md5(password) + process.env.USER_SECRET);

export default {


  async getOwnerNotifications(req, res) {
    try {
      const ownerId = req.userId;

      const notifications = await Notification.findAll({
        where: {userId: ownerId},
        limit: 20,
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({data: notifications});
    } catch (error) {
      return res.status(500).json({error: error.message});
    }
  },

  async markNotificationAsRead (req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.userId;

      const notification = await Notification.findOne({
        where: { id, userId: ownerId }
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification context log not found." });
      }

      notification.isRead = true;
      await notification.save();

      return res.json({ success: true, message: "Notification synchronized as read." });
    } catch (e) {
      next(e);
    }
  },

  async clearAllOwnerNotifications (req, res, next) {
    try {
      const ownerId = req.userId;

      await Notification.update(
        { isRead: true },
        { where: { userId: ownerId, isRead: false } }
      );

      return res.json({ success: true, message: "All property notification logs successfully cleared." });
    } catch (e) {
      next(e);
    }
  },



  async getOwnerDashboardStats(req, res) {
    try {
      const now = new Date();
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized token context."});
      }

      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const hotel = await Hotels.findOne({where: {user_id: ownerId, deleted_at: null}});
      const restaurant = await Restaurant.findOne({where: {owner_id: ownerId}});

      let businessType = "hotel";
      let businessName = "My Property Hub";

      if (hotel && restaurant) {
        businessType = "both";
        businessName = hotel.name;
      } else if (restaurant) {
        businessType = "restaurant";
        businessName = restaurant.name;
      } else if (hotel) {
        businessType = "hotel";
        businessName = hotel.name;
      }



      const curHotelBookings = hotel ? await Booking.count({
        include: [{
          model: Room,
          as: 'room',
          where: {hotel_id: hotel.id}
        }],
        where: {
          created_at: {[Op.gte]: startOfCurrentMonth},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const curReservations = restaurant ? await Reservation.count({
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.gte]: startOfCurrentMonth},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const curFoodOrders = restaurant ? await Order.count({
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.gte]: startOfCurrentMonth},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const totalOrders = curHotelBookings + curReservations + curFoodOrders;

      const curHotelRev = hotel ? await Booking.sum('total_price', {
        include: [{
          model: Room,
          as: 'room',
          attributes: [],
          where: {hotel_id: hotel.id}
        }],
        where: {
          created_at: {[Op.gte]: startOfCurrentMonth},
          status: {[Op.in]: ['confirmed', 'pending']}
        }
      }) || 0 : 0;


      const curFoodRev = restaurant ? await Order.sum('amount', {
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.gte]: startOfCurrentMonth},
          status: {[Op.in]: ['paid', 'pending']}
        }
      }) || 0 : 0;

      const totalRevenue = curHotelRev + curFoodRev;


      const lastHotelBookings = hotel ? await Booking.count({
        include: [{
          model: Room,
          as: 'room',
          where: {hotel_id: hotel.id}
        }],
        where: {
          created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const lastReservations = restaurant ? await Reservation.count({
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const lastFoodOrders = restaurant ? await Order.count({
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
          status: {[Op.ne]: 'cancelled'}
        }
      }) : 0;

      const lastMonthOrders = lastHotelBookings + lastReservations + lastFoodOrders;


      const lastHotelRev = hotel ? await Booking.sum('total_price', {
        include: [{
          model: Room,
          as: 'room',
          attributes: [],
          where: {hotel_id: hotel.id}
        }],
        where: {
          created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
          status: {[Op.in]: ['confirmed', 'pending']}
        }
      }) || 0 : 0;


      const lastFoodRev = restaurant ? await Order.sum('amount', {
        where: {
          restaurant_id: restaurant.id,
          created_at: {[Op.between]: [startOfLastMonth, endOfLastMonth]},
          status: {[Op.in]: ['paid', 'pending']}
        }
      }) || 0 : 0;

      const lastMonthTotalRevenue = lastHotelRev + lastFoodRev;

      const calculateGrowth = (current, last) => {
        if (last === 0) return current > 0 ? "+100%" : "+0.0%";
        let change = ((current - last) / last) * 100;
        if (change >= 100) return "+100%";
        if (change <= -100) return "-100%";
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };

      const ownerStats = [
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
        }
      ];

      return res.status(200).json({
        success: true,
        businessName: businessName,
        businessType: businessType,
        data: ownerStats
      });

    } catch (error) {
      console.error("OWNER DASHBOARD STATS MASTER ERROR:", error);
      return res.status(500).json({success: false, message: error.message});
    }
  },


  async getOwnerBookingChartData(req, res) {
    try {
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized owner context."});
      }

      const hotel = await Hotels.findOne({where: {user_id: ownerId}});

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

      if (!hotel) {
        const formattedEmptyData = daysOrder.map(day => defaultData[day]);
        return res.status(200).json({success: true, data: formattedEmptyData});
      }

      const rawData = await Booking.findAll({
        include: [{
          model: Room,
          as: 'room',
          attributes: [],
          where: {hotel_id: hotel.id}
        }],
        where: {
          status: {[Op.ne]: 'cancelled'}
        },
        attributes: [
          [fn('DATE_FORMAT', col('Booking.created_at'), '%a'), 'name'],
          [fn('COUNT', col('Booking.id')), 'bookings'],
          [fn('SUM', col('Booking.total_price')), 'revenue']
        ],
        group: [fn('DATE_FORMAT', col('Booking.created_at'), '%a')],
        raw: true
      });

      rawData.forEach(row => {
        if (defaultData[row.name]) {
          defaultData[row.name].bookings = parseInt(row.bookings, 10) || 0;
          defaultData[row.name].revenue = parseFloat(row.revenue) || 0;
        }
      });

      const formattedChartData = daysOrder.map(day => defaultData[day]);

      return res.status(200).json({success: true, data: formattedChartData});

    } catch (error) {
      console.error("GET OWNER BOOKING CHART DATA ERROR:", error);
      return res.status(500).json({error: error.message});
    }
  },


  async getOwnerOrderChartData(req, res) {
    try {
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized owner context."});
      }

      const restaurant = await Restaurant.findOne({where: {owner_id: ownerId}});

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

      if (!restaurant) {
        const formattedEmptyData = daysOrder.map(day => defaultData[day]);
        return res.status(200).json(formattedEmptyData);
      }

      const rawData = await Order.findAll({
        where: {
          restaurant_id: restaurant.id,
          status: {[Sequelize.Op.ne]: 'cancelled'}
        },
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%a'), 'name'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'orders'],
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'revenue']
        ],
        group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%a')],
        raw: true
      });

      rawData.forEach(row => {
        if (defaultData[row.name]) {
          defaultData[row.name].orders = parseInt(row.orders, 10) || 0;
          defaultData[row.name].revenue = parseFloat(row.revenue) || 0;
        }
      });

      const formattedChartData = daysOrder.map(day => defaultData[day]);

      return res.status(200).json(formattedChartData);

    } catch (error) {
      console.error("GET OWNER ORDER CHART DATA ERROR:", error);
      return res.status(500).json({error: error.message});
    }
  },


  async getOwnerServicesChartData(req, res) {
    try {
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized owner context."});
      }

      const hotel = await Hotels.findOne({where: {user_id: ownerId}});
      const restaurant = await Restaurant.findOne({where: {owner_id: ownerId}});

      if (!hotel && !restaurant) {
        return res.status(200).json({
          success: true,
          data: [{name: "No Data", value: 1}]
        });
      }

      if (hotel && !restaurant) {
        const roomStats = await Booking.findAll({
          include: [{
            model: Room,
            as: 'room',
            attributes: []
          }],
          where: {status: 'confirmed'},
          attributes: [
            [col('room.room_type'), 'room_type'],
            [fn('COUNT', col('Booking.id')), 'count']
          ],
          group: [col('room.room_type')],
          raw: true
        });

        const chartData = roomStats.map(row => ({
          name: row.room_type || "Standard Stay",
          value: parseInt(row.count, 10) || 0
        }));

        return res.status(200).json({
          success: true,
          data: chartData.length > 0 ? chartData : [
            {name: "Standard Rooms", value: 1},
            {name: "Deluxe Suites", value: 0}
          ]
        });
      }

      if (!hotel && restaurant) {
        const orderStats = await Order.findAll({
          where: {restaurantId: restaurant.id},
          attributes: [
            ['status', 'order_status'],
            [fn('COUNT', col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        const chartData = orderStats.map(row => ({
          name: row.order_status === 'paid' ? "Paid Orders" : "Pending Orders",
          value: parseInt(row.count, 10) || 0
        }));

        return res.status(200).json({
          success: true,
          data: chartData.length > 0 ? chartData : [
            {name: "Food Orders", value: 1}
          ]
        });
      }

      const totalBookings = await Booking.count({
        include: [{model: Room, as: 'room', attributes: [], where: {hotel_id: hotel.id}}],
        where: {status: 'confirmed'}
      });

      const totalOrders = await Order.count({
        where: {restaurantId: restaurant.id, status: 'paid'}
      });

      if (totalBookings === 0 && totalOrders === 0) {
        return res.status(200).json({
          success: true,
          data: [
            {name: "Stays", value: 1},
            {name: "Food", value: 1}
          ]
        });
      }

      return res.status(200).json({
        success: true,
        data: [
          {name: "Stays", value: totalBookings},
          {name: "Food", value: totalOrders}
        ]
      });

    } catch (error) {
      console.error("GET OWNER ADAPTIVE DONUT DATA ERROR:", error);
      return res.status(500).json({success: false, error: error.message});
    }
  },


  async getOwnerRecentTransactions(req, res) {
    try {
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized owner context."});
      }

      const hotel = await Hotels.findOne({where: {user_id: ownerId, deleted_at: null}});
      const restaurant = await Restaurant.findOne({where: {owner_id: ownerId}});

      if (!hotel && !restaurant) {
        return res.status(200).json({success: true, data: []});
      }

      let recentActivities = [];

      if (hotel) {
        const hotelBookings = await Booking.findAll({
          include: [
            {
              model: Room,
              as: 'room',
              attributes: [],
              where: {hotel_id: hotel.id}
            },
            {
              model: User,
              as: 'user',
              attributes: ['email'],
              required: false
            }
          ],
          order: [['created_at', 'DESC']],
          limit: 3,
          raw: true,
          nest: true
        });

        hotelBookings.forEach(b => {
          recentActivities.push({
            id: `booking-${b.id}`,
            title: b.customer_name || b.user?.email || "Guest Stay",
            image: "https://unsplash.com",
            detail: `Room reservation`,
            type: "Stay",
            status: b.status || "pending",
            price: `$${parseFloat(b.total_price || 0).toLocaleString()}`,
            createdAt: b.created_at
          });
        });
      }

      if (restaurant) {
        const restaurantOrders = await Order.findAll({
          where: {restaurantId: restaurant.id},
          include: [{
            model: User,
            as: 'user',
            attributes: ['email'],
            required: false
          }],
          order: [['created_at', 'DESC']],
          limit: 3,
          raw: true,
          nest: true
        });

        restaurantOrders.forEach(o => {
          recentActivities.push({
            id: `order-${o.id}`,
            title: o.customer_name || o.user?.email || "Food Customer",
            image: "https://unsplash.com",
            detail: `Menu item checkout`,
            type: "Food",
            status: o.status || "pending",
            price: `$${parseFloat(o.amount || 0).toLocaleString()}`,
            createdAt: o.created_at
          });
        });
      }

      recentActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const finalFeed = recentActivities.slice(0, 6);

      return res.status(200).json({
        success: true,
        data: finalFeed
      });

    } catch (error) {
      console.error("CRITICAL OWNER ACTIVITIES RESOLVER ERROR:", error);
      return res.status(500).json({success: false, message: error.message});
    }
  },



  //hotels

  async getOwnerPropertyDetails(req, res, next) {
    const ownerId = req.userId;

    try {
      if (!ownerId) {
        return res.status(401).json({success: false, message: "Unauthorized workspace owner context."});
      }

      const hotel = await Hotels.scope("withReviewStats").findOne({
        where: {
          userId: ownerId,
          deleted_at: null
        },
        include: [
          {
            model: HotelPhotos,
            as: "images",
            where: {room_id: null},
            required: false
          },
          {model: Amenity, as: "Amenities"},
          {model: LocationPoint},
          {
            model: Restaurant,
            as: "restaurants",
            attributes: ['id', 'name', 'cuisine_type', 'price_range', 'image', 'description']
          }
        ],
      });

      if (!hotel) {
        return res.status(200).json({
          success: false,
          message: "No registered property assets connected to this partner entity.",
          data: null
        });
      }

      const hotelId = hotel.id;

      if (hotel.images && hotel.images.length > 0) {
        hotel.images = [...hotel.images].sort((a, b) => {
          const orderA = a.sort_order !== undefined ? Number(a.sort_order) : 0;
          const orderB = b.sort_order !== undefined ? Number(b.sort_order) : 0;
          return orderA - orderB;
        });
      }

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
          where: {review_id: {[Op.in]: reviewIds}},
          attributes: ['feature', [fn('COUNT', col('id')), 'count']],
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

      const rooms = await Room.unscoped().findAll({
        where: {
          hotel_id: hotelId
        },
        paranoid: false,
        include: [
          {
            model: HotelPhotos,
            as: "images",
            attributes: ['id', 'path', 'category', 'sort_order', 'is_main'],
            order: [['sort_order', 'ASC']]
          },
          {model: Amenity, as: "amenities", through: {attributes: []}},
          {model: RoomOption, as: "options"},
          {model: RoomExtra, as: "extras"}
        ]
      });


      const formattedRooms = [];

      for (const r of rooms) {
        const options = r.options || [];

        const mappedOptions = options.map(o => {
          let finalPrice = parseFloat(o.price || 0);
          const today = moment().startOf('day');

          if (o.price_modifier && o.season_start && o.season_end) {
            const start = moment(o.season_start, "YYYY-MM-DD");
            const end = moment(o.season_end, "YYYY-MM-DD");
            if (today.isBetween(start, end, 'day', '[]')) {
              finalPrice += parseFloat(o.price_modifier);
            }
          }

          if (o.discount_start && o.discount_end) {
            const dStart = moment(o.discount_start);
            const dEnd = moment(o.discount_end);
            if (today.isBetween(dStart, dEnd, 'day', '[]')) {
              finalPrice = finalPrice * 0.90;
            }
          }

          return {
            id: o.id,
            name: o.name,
            basePrice: o.price,
            calculatedPrice: Math.round(finalPrice),
            price_modifier: o.price_modifier || 0,
            season_start: o.season_start || "",
            season_end: o.season_end || "",
            discount_start: o.discount_start || "",
            discount_end: o.discount_end || "",
            mealPlan: o.meal_plan,
            cancellationType: o.cancellation_type,
            freeCancelDays: o.free_cancel_days,
            payLater: o.pay_later,
            prepaymentRequired: o.prepayment_required,
            status: o.status
          };
        });

        let lowestPrice = mappedOptions.length > 0
          ? Math.min(...mappedOptions.map(o => o.calculatedPrice))
          : 0;

        const formattedExtras = (r.extras || []).map(e => ({
          id: e.id,
          name: e.name,
          price: e.price,
          type: e.type
        }));

        const formattedAmenities = (r.amenities || []).map(a => ({
          id: a.id,
          key: a.key,
          name: a.name,
          category: a.category
        }));


        const rawRoomImages = r.images || [];

        const hasDefinedMainPhoto = rawRoomImages.some(img => img.is_main === true || img.is_main === 1);

        const sortedRawImages = [...rawRoomImages].sort((a, b) => {
          const orderA = a.sort_order !== undefined ? Number(a.sort_order) : 0;
          const orderB = b.sort_order !== undefined ? Number(b.sort_order) : 0;
          return orderA - orderB;
        });

        const formattedImages = sortedRawImages.map((img, idx) => {
          const determineIsMain = hasDefinedMainPhoto
            ? !!img.is_main
            : idx === 0;

          const realCategory = img.category || img.getDataValue?.('category') || "Bedrooms";

          return {
            id: img.id,
            src: img.path || img.src || "",
            category: realCategory,
            isMain: determineIsMain,
            sort_order: img.sort_order !== undefined ? Number(img.sort_order) : idx
          };
        });


        formattedRooms.push({
          id: r.id,
          name: r.name,
          roomType: r.roomType,
          size: r.size,
          bedType: r.bed_type,
          maxGuests: r.max_guests,
          status: r.status,
          lowestPrice: lowestPrice,
          images: formattedImages,
          extras: formattedExtras,
          ratePlans: mappedOptions,
          amenities: formattedAmenities
        });
      }


      return res.status(200).json({
        success: true,
        data: {
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          address: hotel.address,
          description: hotel.description || "Welcome to your digital asset workspace.",
          propertyClass: hotel.property_class,
          hotelCategory: hotel.hotel_category,
          lat: hotel.lat,
          lon: hotel.lon,
          views: hotel.views || 0,
          currency: hotel.currency || "USD",
          featured: hotel.featured,
          images: (hotel.images || []).map(img => ({
            id: img.id,
            src: img.path,
            category: img.category,
            isMain: img.is_main
          })),
          amenities: hotel.Amenities || [],
          locationPoints: hotel.LocationPoints || hotel.location_points || [],
          restaurant: hotel.restaurants || null,

          reviewStats: {
            total: Number(hotel.getDataValue("dynamic_review_count") || 0),
            avgScore: Number(hotel.getDataValue("dynamic_rating") || 0),
            ...featureCounts
          },
          inventory: formattedRooms
        }
      });

    } catch (e) {
      console.error("👑 CRITICAL HOTELS MODEL MASTER RESOLVER ERROR:", e.message);
      return res.status(500).json({success: false, error: e.message});
    }
  },


  async getOwnerAmenities(req, res) {
    try {
      const view = req.query.view || "grouped";
      const scope = req.query.type || req.query.scope;

      let where = {};

      if (scope && scope !== "all") {
        const map = {
          room: ["room", "both"],
          roomOnly: ["room"],
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

      if (view === "flat") {
        return res.json({
          success: true,
          data: amenities,
        });
      }

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
      console.error(" OWNER FETCH AMENITIES ERROR:", e);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch amenities for owner",
        error: e.message,
      });
    }
  },


  async updateHotel(req, res) {
    console.log(req.body);
    try {
      const {id} = req.params;

      const {
        amenities,
        location_points,
        hasRestaurant,
        restaurantName,
        restaurantDescription,
        ...hotelData
      } = req.body;

      const hotel = await Hotels.findByPk(id);

      if (!hotel) {
        return res.status(404).json({success: false, message: "Not found"});
      }

      if (hotel.user_id !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only the owner of this hotel can update it."
        });
      }

      await hotel.update(hotelData);

      if (hasRestaurant === true || hasRestaurant === "true") {
        const existingRestaurant = await Restaurant.findOne({where: {hotel_id: hotel.id}});

        if (existingRestaurant) {
          await existingRestaurant.update({
            name: restaurantName || `${hotel.name} Restaurant`,
            description: restaurantDescription || "Hotel internal restaurant"
          });
        } else {
          await Restaurant.create({
            hotel_id: hotel.id,
            name: restaurantName || `${hotel.name} Restaurant`,
            description: restaurantDescription || "Hotel internal restaurant",
            owner_id: req.userId,
            address: hotel.address || `${hotel.city}, ${hotel.country}`,
            latitude: hotel.lat ? Number(hotel.lat) : 0,
            longitude: hotel.lon ? Number(hotel.lon) : 0,
          });
        }
      }

      if (amenities && Array.isArray(amenities)) {
        const cleanAmenityIds = amenities
          .map(a => (typeof a === 'object' && a !== null ? a.id : a))
          .filter(a => typeof a === 'number' && !isNaN(a));

        await hotel.setAmenities(cleanAmenityIds);
      }

      if (location_points && Array.isArray(location_points)) {
        await LocationPoint.destroy({
          where: {hotel_id: id}
        });

        if (location_points.length > 0) {
          const pointsWithHotelId = location_points.map(point => ({
            name: point.name,
            distance: point.distance,
            hotel_id: id
          }));

          await LocationPoint.bulkCreate(pointsWithHotelId);
        }
      }

      return res.json({
        success: true,
        data: hotel,
      });
    } catch (e) {
      if (e.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          errors: e.errors.map(err => ({
            path: err.path,
            message: err.message
          }))
        });
      }

      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },


  async syncHotelGallery(req, res) {
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

      if (hotel.user_id !== req.userId) {
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

      /* ---------------- MAIN IMAGE ---------------- */
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
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error("Gallery Sync Error: ", err);

      return res.status(500).json({
        message: "Server error during gallery synchronization",
        error: err.message
      });
    }
  },


  async addRoomRatePlan(req, res) {
    try {
      const ownerId = req.userId;
      const {room_id, price, price_modifier, season_start, season_end, discount_start, discount_end} = req.body;

      if (!room_id) {
        return res.status(400).json({success: false, message: "room_id parameter is required."});
      }

      const room = await Room.findByPk(room_id, {
        include: [{model: Hotels, as: "hotel"}]
      });

      if (!room || !room.hotel || room.hotel.user_id !== ownerId) {
        console.log(" SCOPE SECURITY BLOCK: Room not found or owner mismatch!");
        return res.status(403).json({success: false, message: "Access denied."});
      }

      let ratePlan = await RoomOption.findOne({
        where: {room_id: Number(room_id)}
      });

      const rateData = {
        room_id: Number(room_id),
        price: Number(price) || 0,
        price_modifier: price_modifier ? Number(price_modifier) : 0,
        season_start: season_start && season_start !== "" ? season_start : null,
        season_end: season_end && season_end !== "" ? season_end : null,
        discount_start: discount_start && discount_start !== "" ? discount_start : null,
        discount_end: discount_end && discount_end !== "" ? discount_end : null,
        status: "active"
      };

      if (ratePlan) {
        const updateResult = await RoomOption.update(rateData, {
          where: {room_id: Number(room_id)}
        });
      } else {
        rateData.name = "Standard Rate";
        await RoomOption.create(rateData);
      }

      const freshPlan = await RoomOption.findOne({where: {room_id: Number(room_id)}});

      return res.status(200).json({
        success: true,
        message: "Synchronized",
        data: freshPlan
      });

    } catch (error) {
      console.error(" ADD ROOM RATE PLAN BACKEND ERROR:", error);
      return res.status(500).json({success: false, message: error.message});
    }
  },



  async getOwnerRooms (req, res) {
    try {
      const ownerId = req.userId;

      const myHotel = await Hotels.findOne({
        where: {
          user_id: ownerId
        }
      });

      if (!myHotel) {
        return res.status(200).json({
          success: true,
          rooms: []
        });
      }

      const rooms = await Room.findAll({
        where: {
          hotel_id: myHotel.id,
          deleted_at: null
        },
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        rooms
      });

    } catch (error) {
      console.error(" GET OWNER ROOMS CRITICAL ERROR:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },


  async createOwnerRoom(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const ownerId = req.userId;
      const {
        hotel_id,
        name,
        room_type,
        size,
        bed_type,
        max_guests,
        status,
        mainPhotoName,
        amenities: serializedAmenities,
        options: serializedOptions,
        extras: serializedExtras
      } = req.body;

      if (!hotel_id || !name || !size) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Missing core parameters: hotel_id, name, and size are required."
        });
      }


      const hotel = await Hotels.findByPk(hotel_id, {transaction});
      if (!hotel || hotel.user_id !== ownerId) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only create rooms for your own hotel properties."
        });
      }

      const newRoom = await Room.create({
        hotel_id: Number(hotel_id),
        name,
        roomType: room_type,
        size: Number(size),
        bed_type: bed_type || "King Size",
        max_guests: Number(max_guests) || 2,
        status: status || "active"
      }, {transaction});

      const roomId = newRoom.id;

      const clientOptions = serializedOptions ? JSON.parse(serializedOptions) : [];

      if (clientOptions.length === 0) {
        await RoomOption.create({
          room_id: roomId,
          name: "Standard Rate",
          price: 0,
          meal_plan: "none",
          cancellation_type: "free",
          free_cancel_days: 1,
          cancel_time: "23:59",
          status: "active"
        }, {transaction});
      } else {
        const optionRows = clientOptions.map(opt => ({
          room_id: roomId,
          name: opt.name || "Standard Rate",
          price: Number(opt.price) || 0,
          meal_plan: opt.meal_plan || "none", // none, breakfast, all_inclusive...
          cancellation_type: opt.cancellation_type || "free", // free, non_refundable...
          free_cancel_days: Number(opt.freeCancelDays) || 1,
          cancel_time: opt.cancel_time || "23:59",
          pay_later: opt.pay_later === true || opt.pay_later === 'true',
          prepayment_required: opt.prepayment_required !== false,
          status: opt.status || "active"
        }));

        await RoomOption.bulkCreate(optionRows, {transaction});
      }

      // ==========================================================
      //  5. (ROOM_EXTRAS)
      // ==========================================================
      const clientExtras = serializedExtras ? JSON.parse(serializedExtras) : [];
      if (clientExtras.length > 0) {
        const extraRows = clientExtras.map(ext => ({
          room_id: roomId,
          name: ext.name,
          price: Number(ext.price) || 0,
          type: ext.type || "service" // service, food, comfort
        }));

        await RoomExtra.bulkCreate(extraRows, {transaction});
      }

      // ==========================================================
      // 6.(ROOM_AMENITIES PIVOT)
      // ==========================================================
      const clientAmenities = serializedAmenities ? JSON.parse(serializedAmenities) : [];
      if (clientAmenities.length > 0) {
        const amenityRows = clientAmenities.map(amenityId => ({
          room_id: roomId,
          amenity_id: Number(amenityId)
        }));

        await RoomAmenity.bulkCreate(amenityRows, {transaction});
      }

      const files = req.files || [];

      if (files.length > 0) {
        const photoRows = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          const result = await cloudinary.uploader.upload(file.path, {
            folder: "rooms",
            quality: "auto",
            fetch_format: "auto",
          });

          const isThisFileMain = mainPhotoName
            ? file.originalname === mainPhotoName
            : i === 0;

          photoRows.push({
            hotel_id: Number(hotel_id),
            room_id: roomId,
            path: result.secure_url,
            public_id: result.public_id,
            sort_order: i,
            category: "Bedrooms",
            is_main: isThisFileMain
          });
        }

        await HotelPhotos.bulkCreate(photoRows, {transaction});
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Room asset pool with core variables deployed successfully.",
        room_id: roomId
      });

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error(" CREATE OWNER ROOM TRANSACTION MASTER ERROR:", error);
      return res.status(500).json({success: false, message: "Transaction failed", error: error.message});
    }
  },


  async updateOwnerRoom(req, res) {
    const transaction = await sequelize.transaction();
    const id = parseInt(req.params.id || req.body.id, 10);

    try {
      const ownerId = req.userId;

      const {
        hotel_id,
        name,
        room_type,
        size,
        bed_type,
        max_guests,
        status,
        amenities: serializedAmenities,
        options: serializedOptions,
        extras: serializedExtras,
        roomImagesMap,
        mainPhotoIndex
      } = req.body;

      const targetMainIndex = mainPhotoIndex ? Number(mainPhotoIndex) : 0;

      const room = await Room.findByPk(id, {
        include: [{model: Hotels, as: "hotel"}],
        transaction
      });

      if (room?.hotel) {
        console.log(`Hotel Owner ID (DB): ${room.hotel.user_id} (${typeof room.hotel.user_id})`);
        console.log(`Current User ID (Token): ${ownerId} (${typeof ownerId})`);
      }

      if (!room || !room.hotel || Number(room.hotel.user_id) !== Number(ownerId)) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Access denied or room asset missing."
        });
      }


      await room.update({
        name: name || room.name,
        roomType: room_type || room.roomType,
        size: size ? Number(size) : room.size,
        bed_type: bed_type || room.bed_type,
        max_guests: max_guests ? Number(max_guests) : room.max_guests,
        status: status || room.status
      }, {transaction});

      if (serializedOptions) {
        const clientOptions = JSON.parse(serializedOptions);
        const incomingIds = clientOptions
          .filter(opt => opt.id && opt.status !== "inactive")
          .map(opt => opt.id);

        const deleteWhere = {
          room_id: id,
          name: { [Op.notIn]: ["Standard Rate", "Standard Room"] }
        };

        if (incomingIds.length > 0) {
          deleteWhere.id = { [Op.notIn]: incomingIds };
        }

        await RoomOption.destroy({ where: deleteWhere, transaction });

        for (const opt of clientOptions) {
          if (opt.status === "inactive") continue;

          const optionData = {
            room_id: Number(id),
            name: opt.name || "Standard Rate",
            price: Number(opt.price) || 0,
            meal_plan: opt.meal_plan || "none",
            cancellation_type: opt.cancellation_type || "free",
            free_cancel_days: Number(opt.freeCancelDays || opt.free_cancel_days) || 1,
            cancel_time: opt.cancel_time || "23:59",
            pay_later: opt.pay_later === true || opt.pay_later === 'true',
            prepayment_required: opt.prepayment_required !== false,
            status: "active"
          };

          if (opt.id) {
            const currentDbOpt = await RoomOption.findByPk(opt.id, {transaction});
            if (currentDbOpt && (currentDbOpt.name === "Standard Rate" || currentDbOpt.name === "Standard Room")) {
              optionData.name = currentDbOpt.name;
            }
            await RoomOption.update(optionData, {where: {id: opt.id, room_id: id}, transaction});
          } else {
            if (opt.name === "Standard Rate" || opt.name === "Standard Room") {
              optionData.name = `${opt.name} - New`;
            }
            await RoomOption.create(optionData, {transaction});
          }
        }

        const planCount = await RoomOption.count({
          where: { room_id: id },
          transaction
        });

        if (planCount === 0) {
          await RoomOption.create({
            room_id: Number(id),
            name: "Standard Rate",
            price: 100,
            meal_plan: "none",
            cancellation_type: "free",
            status: "active"
          }, { transaction });
          console.log(` [Guard] Re-created missing base Standard Rate for room ${id}`);
        }
      }


      if (serializedExtras) {
        const clientExtras = JSON.parse(serializedExtras);
        const activeExtraIds = [];

        for (const ext of clientExtras) {
          const extraData = {
            room_id: Number(id),
            name: ext.name,
            price: Number(ext.price) || 0,
            type: ext.type || "service"
          };
          if (ext.id) {
            await RoomExtra.update(extraData, {where: {id: ext.id, room_id: id}, transaction});
            activeExtraIds.push(ext.id);
          } else {
            const newExt = await RoomExtra.create(extraData, {transaction});
            activeExtraIds.push(newExt.id);
          }
        }

        const deleteWhere = { room_id: id };

        if (activeExtraIds.length > 0) {
          deleteWhere.id = { [Op.notIn]: activeExtraIds };
        }
        await RoomExtra.destroy({ where: deleteWhere, transaction });
      }


      if (serializedAmenities) {
        const clientAmenities = JSON.parse(serializedAmenities);
        await RoomAmenity.destroy({where: {room_id: id}, transaction});
        if (clientAmenities.length > 0) {
          const amenityRows = clientAmenities.map(amenityId => ({room_id: id, amenity_id: Number(amenityId)}));
          await RoomAmenity.bulkCreate(amenityRows, {transaction});
        }
      }


      let virtualGalleryCursor = 0;
      const files = req.files || [];

      if (roomImagesMap) {
        const clientImages = JSON.parse(roomImagesMap);
        const keepImageIds = [];

        await HotelPhotos.update({is_main: false}, {where: {room_id: id}, transaction});

        for (const img of clientImages) {
          if (img.id && !img.replaced) {
            const isThisMain = virtualGalleryCursor === targetMainIndex;

            const photoInstance = await HotelPhotos.findByPk(img.id, {transaction});

            if (photoInstance) {
              photoInstance.is_main = isThisMain;

              photoInstance.sort_order = img.sort_order !== undefined ? Number(img.sort_order) : virtualGalleryCursor;

              if (img.category) {
                photoInstance.category = img.category;
              }

              await photoInstance.save({transaction});
            }

            keepImageIds.push(img.id);
            virtualGalleryCursor++;
          }
        }

        await HotelPhotos.destroy({
          where: {room_id: id, id: {[Op.notIn]: keepImageIds}},
          transaction
        });
      }

      if (files.length > 0) {
        const photoRows = [];
        const clientImages = roomImagesMap ? JSON.parse(roomImagesMap) : [];
        const incomingFileBlueprints = clientImages.filter(img => img.isNew || img.replaced);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "rooms",
            quality: "auto",
            fetch_format: "auto",
          });

          const isThisNewFileMain = virtualGalleryCursor === targetMainIndex;
          const targetBlueprint = incomingFileBlueprints[i];

          photoRows.push({
            hotel_id: Number(hotel_id || room.hotel_id),
            room_id: id,
            path: result.secure_url,
            public_id: result.public_id,
            sort_order: targetBlueprint && targetBlueprint.sort_order !== undefined ? Number(targetBlueprint.sort_order) : virtualGalleryCursor,
            category: targetBlueprint && targetBlueprint.category ? targetBlueprint.category : "Bedrooms",
            is_main: isThisNewFileMain
          });

          virtualGalleryCursor++;
        }

        await HotelPhotos.bulkCreate(photoRows, {transaction});
      }


      await transaction.commit();
      return res.status(200).json({success: true, message: "Room asset blueprint matrix updated persistently."});

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error(" UPDATE OWNER ROOM MATRIX ERROR:", error);
      return res.status(500).json({success: false, message: "Update transaction failed", error: error.message});
    }
  },


  async deleteOwnerRoom(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const ownerId = req.userId;
      const {id} = req.params;

      const room = await Room.unscoped().findByPk(id, {
        paranoid: false,
        include: [{model: Hotels, as: "hotel"}],
        transaction
      });

      if (!room || !room.hotel || room.hotel.user_id !== ownerId) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Access denied or room asset missing from your partner profile domain."
        });
      }

      await room.update({status: "archived"}, {transaction});
      await room.destroy({transaction});

      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: "Room asset successfully moved to secure archives. "
      });

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error(" DELETE OWNER ROOM ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Archiving transaction execution failed.",
        error: error.message
      });
    }
  },


  async restoreOwnerRoom(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const ownerId = req.userId;
      const {id} = req.params;

      const room = await Room.unscoped().findByPk(id, {
        paranoid: false,
        include: [{model: Hotels, as: "hotel", paranoid: false}],
        transaction
      });

      if (!room || !room.hotel || Number(room.hotel.user_id) !== Number(ownerId)) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Access denied or room asset missing from your partner profile domain."
        });
      }


      await room.restore({transaction});

      await room.update({
        status: "active"
      }, {transaction});

      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: "Room asset successfully restored to active inventory feed. "
      });

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error("RESTORE OWNER ROOM ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Restoration transaction execution failed.",
        error: error.message
      });
    }
  },


  async getOwnerRestaurantDetails(req, res) {
    try {
      const ownerId = req.userId;

      const restaurant = await Restaurant.findOne({
        where: {ownerId: ownerId},
        include: [
          {
            model: MenuItem,
            as: "menuItems",
            include: [
              {
                model: Dish,
                attributes: ['id', 'name', 'default_image']
              }
            ]
          },
          {
            model: RestaurantImage,
            as: "images",
            attributes: ["id", "imageUrl", "publicId"]
          }
        ],
        order: [[{model: MenuItem, as: "menuItems"}, 'created_at', 'DESC']]
      });

      if (!restaurant) {
        return res.status(200).json({
          success: true,
          message: "No registered dining blueprints deployed yet.",
          data: null
        });
      }


      const reviewStats = await RestaurantReview.findOne({
        where: {restaurantId: restaurant.id},
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "totalReviews"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal("CASE WHEN sentiment = 'positive' OR rating >= 4 THEN 1 END")
            ),
            "totalLikes"
          ],
          [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"]
        ],
        raw: true
      });

      const restaurantJson = restaurant.toJSON();


      let finalImagesArray = [];

      if (restaurantJson.image) {
        finalImagesArray.push({
          id: null,
          imageUrl: restaurantJson.image,
          publicId: "main_cover",
          is_main: true,
          sort_order: 0
        });
      }

      if (Array.isArray(restaurantJson.images)) {
        restaurantJson.images.forEach((img, idx) => {
          finalImagesArray.push({
            ...img,
            is_main: false,
            sort_order: restaurantJson.image ? idx + 1 : idx
          });
        });
      }

      restaurantJson.images = finalImagesArray;


      const mappedMenuItems = (restaurantJson.menuItems || []).map((item) => {
        const finalImage = item.customImage || item.Dish?.default_image || item.Dish?.image || "https://placeholder.com";
        return {
          ...item,
          customImage: finalImage
        };
      });

      restaurantJson.reviewStats = {
        totalReviews: Number(reviewStats?.totalReviews) || 0,
        totalLikes: Number(reviewStats?.totalLikes) || 0,
        avgRating: reviewStats?.avgRating ? parseFloat(reviewStats.avgRating).toFixed(1) : "0.0"
      };

      restaurantJson.menuItems = mappedMenuItems;
      restaurantJson.menus = mappedMenuItems;

      return res.status(200).json({
        success: true,
        data: restaurantJson
      });

    } catch (error) {
      console.error(" GET OWNER RESTAURANT ERROR:", error);
      return res.status(500).json({success: false, message: "Internal server error."});
    }
  },


  async upsertOwnerRestaurant(req, res) {
    try {
      const ownerId = req.userId;
      const {
        name,
        cuisineType,
        priceRange,
        category,
        phone,
        city,
        address,
        description,
        latitude,
        longitude,
        images: clientImagesJson
      } = req.body;

      const hotel = await Hotels.findOne({where: {user_id: ownerId, deleted_at: null}});

      const [restaurant, created] = await Restaurant.findOrCreate({
        where: {ownerId: ownerId},
        defaults: {
          hotelId: hotel ? hotel.id : null,
          ownerId: ownerId,
          name: name || "Hotel Elite Dining Facility",
          cuisineType: cuisineType || "International",
          priceRange: priceRange || "$$",
          category: category || "luxury",
          phone: phone || "",
          city: city || "Yerevan",
          address: address || "Default Operational Street",
          description: description || "",
          latitude: latitude ? parseFloat(latitude) : 40.1776,
          longitude: longitude ? parseFloat(longitude) : 44.5126
        }
      });

      if (!created) {
        await restaurant.update({
          name: name || restaurant.name,
          cuisineType: cuisineType || restaurant.cuisineType,
          priceRange: priceRange || restaurant.priceRange,
          category: category || restaurant.category,
          phone: phone || restaurant.phone,
          city: city || restaurant.city,
          address: address || restaurant.address,
          description: description || restaurant.description,
          latitude: latitude ? parseFloat(latitude) : restaurant.latitude,
          longitude: longitude ? parseFloat(longitude) : restaurant.longitude
        });
      }

      const restaurant_id = restaurant.id;
      const clientImages = JSON.parse(clientImagesJson || "[]");

      let mainImgIndex = clientImages.findIndex(img => img.is_main === true);
      if (mainImgIndex === -1 && clientImages.length > 0) {
        mainImgIndex = 0;
      }


      const allClientActiveIds = clientImages.filter(img => img.id && !img.replaced).map(img => img.id);

      const imagesToDeleteFromCloudinary = await RestaurantImage.findAll({
        where: {
          restaurant_id: restaurant_id,
          id: {[Op.notIn]: allClientActiveIds.length > 0 ? allClientActiveIds : [0]}
        }
      });

      for (const img of imagesToDeleteFromCloudinary) {
        if (img.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
            console.log(`Cloudinary asset destroyed: ${img.publicId}`);
          } catch (clErr) {
            console.error(`Cloudinary destroy error:`, clErr.message);
          }
        }
      }

      const galleryActiveIds = clientImages
        .filter((img, idx) => img.id && !img.replaced && idx !== mainImgIndex)
        .map(img => img.id);

      await RestaurantImage.destroy({
        where: {
          restaurant_id: restaurant_id,
          id: {[Op.notIn]: galleryActiveIds.length > 0 ? galleryActiveIds : [0]}
        }
      });


      const galleryImagesData = [];
      const files = req.files || [];
      const newClientImages = clientImages.filter(img => img.isNew || img.replaced);

      let mainImageUrl = null;

      files.forEach((file, index) => {
        const secureUrl = file.path;
        const publicId = file.filename;

        const currentClientConfig = newClientImages[index] || {};
        const isThisFileMain = clientImages.some((img, idx) => idx === mainImgIndex && img.preview === currentClientConfig.preview);

        if (isThisFileMain) {
          mainImageUrl = secureUrl;
        } else {
          galleryImagesData.push({
            restaurantId: Number(restaurant_id),
            imageUrl: secureUrl,
            publicId: publicId
          });
        }
      });

      if (galleryImagesData.length > 0) {
        await RestaurantImage.bulkCreate(galleryImagesData);
      }


      if (!mainImageUrl && clientImages.length > 0) {
        const mainConfig = clientImages[mainImgIndex];
        if (mainConfig) {
          mainImageUrl = mainConfig.preview;
        }
      }

      if (!mainImageUrl) {
        const fallbackImg = await RestaurantImage.findOne({where: {restaurant_id}});
        if (fallbackImg) {
          mainImageUrl = fallbackImg.imageUrl;
          await fallbackImg.destroy(); // Ջնջում ենք պատկերասրահից, քանի որ դարձավ գլխավոր
        }
      }

      if (mainImageUrl) {
        await restaurant.update({image: mainImageUrl});
      } else {
        await restaurant.update({image: null});
      }

      return res.status(200).json({
        success: true,
        message: "Restaurant profile matrix and split gallery synced persistently! ",
        data: restaurant
      });

    } catch (error) {
      console.error("SYSTEM ERROR IN UPSERT OWNER RESTAURANT GALLERY:", error);
      return res.status(500).json({success: false, message: "Internal Server Error"});
    }
  },


  async getGlobalDishesList(req, res) {
    try {
      const dishes = await Dish.findAll({
        attributes: ["id", "name", "default_image"],
        order: [["name", "ASC"]]
      });

      return res.status(200).json({
        success: true,
        data: dishes
      });
    } catch (error) {
      console.error("GET GLOBAL DISHES ERROR:", error);
      return res.status(500).json({success: false, message: "Internal server error."});
    }
  },


  async createMenuItem(req, res) {
    try {
      const ownerId = req.userId;
      const {restaurant_id, dish_id, price} = req.body;

      const restaurant = await Restaurant.findOne({
        where: {id: restaurant_id, ownerId: ownerId}
      });

      if (!restaurant) {
        return res.status(403).json({message: "Access denied or restaurant infrastructure missing from your domain."});
      }

      const existingItem = await MenuItem.findOne({
        where: {restaurantId: restaurant_id, dishId: dish_id}
      });

      if (existingItem) {
        return res.status(400).json({message: "This dish is already registered in your restaurant menu blueprint."});
      }

      const custom_image = req.file ? req.file.path : null;

      const newMenuItem = await MenuItem.create({
        restaurantId: restaurant_id,
        dishId: dish_id,
        price: price ? parseFloat(price) : 0,
        customImage: custom_image
      });

      const fullItem = await MenuItem.findByPk(newMenuItem.id, {
        include: [{model: Dish}]
      });

      const itemJson = fullItem.toJSON();
      itemJson.imageUrl = itemJson.customImage || itemJson.Dish?.image || itemJson.Dish?.default_image || "https://placeholder.com";

      return res.status(201).json({
        success: true,
        message: "New culinary item deployed successfully.",
        data: itemJson
      });

    } catch (error) {
      console.error("CREATE OWNER MENU ITEM ERROR:", error);
      return res.status(500).json({error: error.message});
    }
  },


  async ownerUpdateMenuItem(req, res) {
    try {
      const ownerId = req.userId;
      const {id} = req.params;
      const {restaurant_id, price} = req.body;

      const menuItem = await MenuItem.findByPk(id, {
        include: [{
          model: Restaurant,
          as: "Restaurant",
          include: [{model: Hotels, as: "hotel"}]
        }]
      });

      if (!menuItem || menuItem.restaurantId !== Number(restaurant_id) || menuItem.Restaurant?.hotel?.user_id !== ownerId) {
        return res.status(403).json({message: "Access denied or menu item blueprint missing from your domain."});
      }

      const custom_image = req.file ? req.file.path : menuItem.customImage;

      await menuItem.update({
        price: price ? parseFloat(price) : menuItem.price,
        customImage: custom_image
      });

      const fullItem = await MenuItem.findByPk(id, {
        include: [{model: Dish}]
      });

      const itemJson = fullItem.toJSON();
      itemJson.imageUrl = itemJson.customImage || itemJson.Dish?.image || itemJson.Dish?.default_image || "https://placeholder.com";

      return res.status(200).json({
        success: true,
        message: "Menu item matrix updated persistently.",
        data: itemJson
      });

    } catch (error) {
      console.error(" UPDATE OWNER MENU ITEM ERROR:", error);
      return res.status(500).json({error: error.message});
    }
  },


  async deleteMenuItem(req, res) {
    try {
      const ownerId = req.userId;
      const {id} = req.params;

      const menuItem = await MenuItem.findByPk(id, {
        include: [{
          model: Restaurant,
          as: "Restaurant",
          include: [{model: Hotels, as: "hotel"}]
        }]
      });

      if (!menuItem) {
        return res.status(404).json({success: false, message: "Menu item matrix registry not found."});
      }

      if (!menuItem.Restaurant?.hotel || menuItem.Restaurant.hotel.user_id !== ownerId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You cannot purge assets from another partner profile domain."
        });
      }

      await menuItem.destroy();

      return res.status(200).json({
        success: true,
        message: "Menu item successfully purged from active registry."
      });

    } catch (error) {
      console.error("🔥 PURGE OWNER MENU ITEM ERROR:", error);
      return res.status(500).json({success: false, error: error.message});
    }
  },





  async getOwnerBookings(req, res) {
    try {
      const ownerId = req.userId;

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

      // =============================================================
      //  1. SCOPE SECURITY & DYNAMIC PROPERTY BINDING
      // =============================================================
      const myHotel = await Hotels.findOne({where: {user_id: ownerId, deleted_at: null}});
      const myRestaurant = await Restaurant.findOne({where: {ownerId: ownerId}});

      if (isRestaurant && !myRestaurant) {
        return res.status(200).json({
          success: true,
          bookings: [],
          stats: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            checkInsToday: 0,
            checkOutsToday: 0,
            inHouseGuests: 0,
            monthlyRevenue: 0,
            revenueGrowth: "+0.0%"
          },
          pagination: {total: 0, page: pageNum, pages: 1}
        });
      }
      if (!isRestaurant && !myHotel) {
        return res.status(200).json({
          success: true,
          bookings: [],
          stats: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            checkInsToday: 0,
            checkOutsToday: 0,
            inHouseGuests: 0,
            monthlyRevenue: 0,
            revenueGrowth: "+0.0%"
          },
          pagination: {total: 0, page: pageNum, pages: 1}
        });
      }

      const whereClause = {};

      if (isRestaurant) {
        whereClause.restaurant_id = myRestaurant.id;
      } else {
      }


      if (status && status.toLowerCase() !== "all") {
        whereClause.status = status.toLowerCase();
      }

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
            {id: search},
            {customer_name: {[Op.like]: `%${search}%`}},
            {customer_email: {[Op.like]: `%${search}%`}},
            {customer_phone: {[Op.like]: `%${search}%`}},
            {'$user.user_name$': {[Op.like]: `%${search}%`}}
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
        ? ["id", "restaurant_id", "user_id", "booking_id", "delivery_address", "status", "amount", "createdAt", "updatedAt"]
        : ["id", "customer_name", "customer_email", "customer_phone", "check_in", "check_out", "guests", "total_price", "status", "payment_status", "paid_at", "createdAt", "updatedAt"];

      const includeConfig = [
        {
          model: User,
          as: "user",
          attributes: ["id", "userName", "email", "profilePicture"]
        }
      ];

      if (isRestaurant) {
        includeConfig.push({
          model: targetPropertyModel,
          as: propertyAlias,
          attributes: ["id", "name"]
        });
      } else {
        includeConfig.push({
          model: Room,
          as: "room",
          attributes: ["id", "name", "room_type"],
          required: true,
          include: [
            {
              model: targetPropertyModel,
              as: "hotel",
              attributes: ["id", "name"],
              required: true,
              where: {id: myHotel.id}
            }
          ]
        });
      }

      const {count, rows} = await ActiveModel.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset,
        order: [["createdAt", "DESC"]],
        distinct: true,
        subQuery: false,
        attributes: activeAttributes,
        include: includeConfig
      });


      const todayStr = moment().format("YYYY-MM-DD");
      const startOfCurMonth = moment().startOf("month").toDate();
      const startOfLstMonth = moment().subtract(1, "month").startOf("month").toDate();
      const endOfLstMonth = moment().subtract(1, "month").endOf("month").toDate();

      const statsWhere = { ...whereClause };
      delete statsWhere.status;

      const sumWhere = { ...statsWhere };
      if (sumWhere[Op.or]) {
        delete sumWhere[Op.or];
      }

      if (!isRestaurant && myHotel) {
        const myRooms = await Room.findAll({
          where: { hotel_id: myHotel.id },
          attributes: ["id"],
          raw: true
        });
        const myRoomIds = myRooms.map(r => r.id);
        const targetRoomIds = myRoomIds.length > 0 ? { [Op.in]: myRoomIds } : [];

        statsWhere.room_id = targetRoomIds;
        sumWhere.room_id = targetRoomIds;
      }

      const [
        totalBookings,
        pendingCount,
        confirmedCount,
        checkInsToday,
        checkOutsToday,
        inHouseGuests,
        curMonthSales,
        lastMonthSales
      ] = await Promise.all([
        ActiveModel.count({ where: statsWhere, include: includeConfig }),
        ActiveModel.count({ where: { ...statsWhere, status: "pending" }, include: includeConfig }),
        ActiveModel.count({ where: { ...statsWhere, status: isRestaurant ? "paid" : "confirmed" }, include: includeConfig }),

        (!isRestaurant && myHotel)
          ? Booking.count({ where: { ...statsWhere, check_in: todayStr, status: { [Op.ne]: "cancelled" } }, include: includeConfig })
          : 0,

        (!isRestaurant && myHotel)
          ? Booking.count({ where: { ...statsWhere, check_out: todayStr, status: "confirmed" }, include: includeConfig })
          : 0,

        (!isRestaurant && myHotel)
          ? Booking.count({
            where: {
              ...statsWhere,
              status: "confirmed",
              check_in: { [Op.lte]: todayStr },
              check_out: { [Op.gt]: todayStr }
            },
            include: includeConfig
          })
          : 0,

        ActiveModel.sum(priceField, { where: { ...sumWhere, status: isRestaurant ? "paid" : "confirmed", createdAt: { [Op.gte]: startOfCurMonth } } }),
        ActiveModel.sum(priceField, { where: { ...sumWhere, status: isRestaurant ? "paid" : "confirmed", createdAt: { [Op.between]: [startOfLstMonth, endOfLstMonth] } } })
      ]);

      const calculateGrowth = (current = 0, last = 0) => {
        const curNum = current || 0;
        const lstNum = last || 0;
        if (lstNum === 0) return curNum > 0 ? "+100.0%" : "+0.0%";
        let change = ((curNum - lstNum) / lstNum) * 100;
        change = Math.max(-100, Math.min(100, change));
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };

      const stats = {
        totalBookings,
        pendingBookings: pendingCount,
        confirmedBookings: confirmedCount,
        checkInsToday: checkInsToday || 0,
        checkOutsToday: checkOutsToday || 0,
        inHouseGuests: inHouseGuests || 0,
        monthlyRevenue: curMonthSales || 0,
        revenueGrowth: calculateGrowth(curMonthSales, lastMonthSales)
      };

      const formattedRows = rows.map(row => {
        const plainRow = row.get({ plain: true });

        if (isRestaurant) {
          const hasBookingId = plainRow.booking_id !== null && plainRow.booking_id !== undefined;
          const isRoomService = hasBookingId || plainRow.delivery_address?.toLowerCase() === "room service";

          let finalCheckOutText = plainRow.delivery_address || "Pick-up";
          if (isRoomService && hasBookingId) {
            finalCheckOutText = `Room Service (Booking #${plainRow.booking_id})`;
          } else if (isRoomService) {
            finalCheckOutText = "Room Service";
          }

          const finalRoomObject = hasBookingId
            ? {
              id: plainRow.restaurant_id,
              name: plainRow.restaurant?.name || "Yerevan National Restaurant",
              room_type: "Room Service",
              hotel: {
                id: plainRow.restaurant_id,
                name: plainRow.restaurant?.name || "Yerevan National Restaurant"
              }
            }
            : null;

          return {
            id: plainRow.id,
            status: plainRow.status === 'paid' ? 'confirmed' : plainRow.status,
            payment_status: plainRow.status === 'paid' ? 'paid' : 'unpaid',
            booking_id: plainRow.booking_id || null,

            room: finalRoomObject,
            address: !finalRoomObject ? (plainRow.delivery_address || "Pick-up") : null,
            check_in: moment(plainRow.createdAt).format("YYYY-MM-DD"),
            check_out: finalCheckOutText,
            user: plainRow.user || null,
            customer_name: plainRow.user?.userName || plainRow.customer_name || "App User",
            customer_email: plainRow.user?.email || plainRow.customer_email,
            customer_phone: plainRow.customer_phone || "No Phone",
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
        },
        permissions: {
          hasHotel: !!myHotel,
          hasRestaurant: !!myRestaurant
        }
      });
    } catch (err) {
      console.error(" GET OWNER BOOKINGS CRITICAL SYSTEM ERROR:", err);
      return res.status(500).json({success: false, error: err.message});
    }
  },



  async updateOwnerOrderStatus (req, res) {
    try {
      const ownerId = req.userId;
      const { id } = req.params;
      const { status, type } = req.body;

      const isRestaurant = type === "restaurant";

      const myHotel = await Hotels.findOne({ where: { user_id: ownerId, deleted_at: null } });
      const myRestaurant = await Restaurant.findOne({ where: { ownerId: ownerId } });

      if (isRestaurant) {
        const order = await Order.findByPk(id);

        if (!order || !myRestaurant || order.restaurant_id !== myRestaurant.id) {
          return res.status(403).json({ success: false, error: "Access denied or restaurant order missing." });
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
          message: "Restaurant order status synchronized securely.",
          data: order
        });

      } else {
        const booking = await Booking.findByPk(id, {
          include: [
            {
              model: Room,
              as: "room",
              required: true,
              include: [
                {
                  model: Hotels,
                  as: "hotel",
                  required: true
                }
              ]
            }
          ]
        });

        if (!booking || !myHotel || booking.room?.hotel?.id !== myHotel.id) {
          return res.status(403).json({ success: false, error: "Access denied or hotel reservation missing." });
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
          message: "Hotel reservation status synchronized securely.",
          data: booking
        });
      }

    } catch (err) {
      console.error(" UPDATE OWNER ORDER STATUS SYSTEM ERROR:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },


  async getOwnerOrderItemsByBooking (req, res){
    try {
      const ownerId = req.userId;
      const { bookingId } = req.params;

      const myRestaurant = await Restaurant.findOne({ where: { ownerId: ownerId } });
      const parentOrder = await Order.findByPk(bookingId);

      if (!parentOrder || !myRestaurant || parentOrder.restaurant_id !== myRestaurant.id) {
        return res.status(403).json({
          success: false,
          error: "Access denied or restaurant order blueprints missing from your domain."
        });
      }

      const orderItems = await OrderItem.findAll({
        where: { order_id: bookingId },
        include: [
          {
            model: MenuItem,
            include: [
              {
                model: Dish,
                as: "Dish",
                attributes: ['id', 'name', 'defaultImage']
              }
            ]
          }
        ]
      });

      return res.status(200).json({
        success: true,
        data: orderItems
      });

    } catch (error) {
      console.error(" GET OWNER ORDER ITEMS CRITICAL ERROR:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },




  async   getOwnerReviews (req, res, next) {
    try {
      const ownerId = req.userId;
      const {
        type = "hotel",
        page = 1,
        limit = 2,
        search,
        min_score,
        max_score,
        sort = "newest",
      } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const myHotel = await Hotels.findOne({ where: { user_id: ownerId } });
      const myRestaurant = await Restaurant.findOne({ where: { owner_id: ownerId } });

      const permissions = {
        hasHotel: !!myHotel,
        hasRestaurant: !!myRestaurant
      };

      let activeType = type;
      if (!activeType) {
        activeType = permissions.hasHotel ? "hotel" : (permissions.hasRestaurant ? "restaurant" : "hotel");
      }

      const where = {};
      let order = [["created_at", "DESC"]];

      const sortMap = {
        newest: ["created_at", "DESC"],
        oldest: ["created_at", "ASC"],
        score_high: [activeType === "hotel" ? "score" : "rating", "DESC"],
        score_low: [activeType === "hotel" ? "score" : "rating", "ASC"],
      };

      if (sort && sortMap[sort]) {
        order = [sortMap[sort]];
      }

      if (search) {
        where.comment = { [Op.like]: `%${search}%` };
      }


      if (activeType === "hotel") {
        if (!myHotel) {
          return res.json({ success: true, permissions, insights: { totalReviews: 0, averageScore: 0 }, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 1 } });
        }

        where.hotel_id = myHotel.id;

        if (min_score || max_score) {
          where.score = {};
          if (min_score) where.score[Op.gte] = Number(min_score);
          if (max_score) where.score[Op.lte] = Number(max_score);
        }

        const { rows, count } = await Reviews.findAndCountAll({
          where,
          limit: limitNum,
          offset,
          distinct: true,
          order,
          include: [
            { model: User, as: "user", attributes: ["id", "userName", "user_name", "profilePicture", "profile_picture", "email"] },
            { model: ReviewLiked, as: "liked_features", attributes: ["id", "feature"] },
            {
              model: ReviewReplies,
              as: "replies",
              include: [{ model: User, as: "owner", attributes: ["id", "userName", "user_name", "profilePicture", "profile_picture"] }]
            }
          ]
        });

        const averageScore = rows.length > 0
          ? Number((rows.reduce((sum, r) => sum + Number(r.score || 0), 0) / rows.length).toFixed(1))
          : 0;

        return res.json({
          success: true,
          permissions,
          insights: { totalReviews: count, averageScore },
          data: rows.map((review) => {
            const userData = review.user;
            return {
              id: review.id,
              reviewerName: userData?.userName || userData?.user_name || "Anonymous Guest",
              reviewerImage: userData?.profilePicture || userData?.profile_picture || null,
              score: Number(review.score || 0),
              maxScore: 10,
              comment: review.comment,
              verified: review.verified,
              createdAt: review.created_at || review.createdAt,
              likedFeatures: review.liked_features?.map((item) => item.feature) || [],
              replies: review.replies?.map((reply) => ({
                id: reply.id,
                reply: reply.reply,
                isEdited: reply.is_edited,
                createdAt: reply.created_at || reply.createdAt,
                ownerName: reply.owner?.userName || reply.owner?.user_name || "Property Owner"
              })) || []
            };
          }),
          pagination: { total: count, page: pageNum, limit: limitNum, pages: Math.ceil(count / limitNum) }
        });
      }

      if (!myRestaurant) {
        return res.json({ success: true, permissions, insights: { totalReviews: 0, averageScore: 0 }, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 1 } });
      }

      where.restaurant_id = myRestaurant.id;

      if (min_score || max_score) {
        where.rating = {};
        if (min_score) where.rating[Op.gte] = Number(min_score);
        if (max_score) where.rating[Op.lte] = Number(max_score);
      }

      const { rows, count } = await RestaurantReview.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        distinct: true,
        order,
        include: [
          { model: User, as: "user", attributes: ["id", "userName", "user_name", "profilePicture", "profile_picture", "email"] }
        ]
      });

      const reviewIds = rows.map(r => r.id);
      const allReplies = reviewIds.length > 0
        ? await ReviewReplies.findAll({
          where: { review_id: reviewIds },
          include: [{ model: User, as: "owner", attributes: ["id", "userName", "user_name", "profilePicture", "profile_picture"] }]
        })
        : [];

      const averageScore = rows.length > 0
        ? Number((rows.reduce((sum, r) => sum + Number(r.rating || 0), 0) / rows.length).toFixed(1))
        : 0;

      return res.json({
        success: true,
        permissions,
        insights: { totalReviews: count, averageScore },
        data: rows.map((review) => {
          const reviewReplies = allReplies.filter(rep => rep.review_id === review.id);
          const userData = review.user;
          return {
            id: review.id,
            reviewerName: userData?.userName || userData?.user_name || "Anonymous Customer",
            reviewerImage: userData?.profilePicture || userData?.profile_picture || null,
            score: Number(review.rating || 0),
            maxScore: 5,
            comment: review.comment,
            verified: true,
            createdAt: review.created_at || review.createdAt,
            likedFeatures: review.sentiment ? [review.sentiment] : [],
            replies: reviewReplies.map((reply) => ({
              id: reply.id,
              reply: reply.reply,
              isEdited: reply.is_edited,
              createdAt: reply.created_at || reply.createdAt,
              ownerName: reply.owner?.userName || reply.owner?.user_name || "Restaurant Owner"
            }))
          };
        }),
        pagination: { total: count, page: pageNum, limit: limitNum, pages: Math.ceil(count / limitNum) }
      });

    } catch (e) {
      next(e);
    }
  },



  async getOwnerUgcPosts(req, res, next) {
    try {
      const ownerId = req.userId;
      const { type = "hotel", page = 1, limit = 1 } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const where = {};

      if (type === "restaurant") {
        const myRestaurant = await Restaurant.findOne({ where: { owner_id: ownerId } });
        if (!myRestaurant) {
          return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 1 } });
        }
        where.restaurantId = myRestaurant.id;
      } else {
        const myHotel = await Hotels.findOne({ where: { user_id: ownerId } });
        if (!myHotel) {
          return res.json({ success: true, data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 1 } });
        }
        where.hotelId = myHotel.id;
      }

      const { rows: posts, count } = await Post.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "userName", "user_name", "profilePicture", "profile_picture"]
          }
        ],
        distinct: true
      });

      return res.json({
        success: true,
        data: posts.map(post => ({
          id: post.id,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          caption: post.caption,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          createdAt: post.createdAt,
          author: {
            id: post.author?.id,
            userName: post.author?.userName || post.author?.user_name || "Guest Author",
            profilePicture: post.author?.profilePicture || post.author?.profile_picture || null
          }
        })),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
        }
      });

    } catch (e) {
      console.error("GET OWNER UGC POSTS ERROR:", e);
      return res.status(500).json({ success: false, message: "Failed to fetch property asset posts layout feed." });
    }
  },



  async createReviewReply(req, res, next) {
    try {
      const reviewId = req.params.id;
      const ownerId = req.userId;
      const { reply, type = "hotel" } = req.body;

      if (!reply?.trim()) {
        return res.status(400).json({ success: false, message: "Reply body is required" });
      }

      let hasAccess = false;
      let targetReview = null;

      if (type === "hotel") {
        targetReview = await Reviews.findByPk(reviewId);
        if (targetReview) {
          const hotel = await Hotels.findOne({ where: { id: targetReview.hotel_id, user_id: ownerId } });
          if (hotel) hasAccess = true;
        }
      } else {
        targetReview = await RestaurantReview.findByPk(reviewId);
        if (targetReview) {
          const restaurant = await Restaurant.findOne({ where: { id: targetReview.restaurant_id, owner_id: ownerId } });
          if (restaurant) hasAccess = true;
        }
      }

      if (!hasAccess || !targetReview) {
        return res.status(403).json({ success: false, message: "Access denied. Property isolated from your scope." });
      }

      const alreadyExists = await ReviewReplies.findOne({ where: { review_id: reviewId, owner_id: ownerId } });
      if (alreadyExists) {
        return res.status(400).json({ success: false, message: "Reply matrix already exists for this entry." });
      }

      const createdReply = await ReviewReplies.create({
        review_id: reviewId,
        owner_id: ownerId,
        reply: reply.trim()
      });

      try {
        const recipientClientId = targetReview.user_id || targetReview.userId;
        if (recipientClientId) {
          const propertyTypeName = type === "hotel" ? "Hotel Hub Management" : "Restaurant Management";

          const clientNotification = await Notification.create({
            userId: recipientClientId,
            type: "message",
            message: ` Official update: ${propertyTypeName} just responded to your feedback context.`,
            link: type === "hotel" ? `/profile/reviews` : `/profile/restaurant-reviews`,
            isRead: false
          });

          await Socket.emit(`user_${recipientClientId}`, clientNotification, "new_notification");
        }
      } catch (notiErr) {
        console.error("Failed to push client notification payload:", notiErr);
      }

      return res.status(201).json({
        success: true,
        message: "Reply created successfully",
        data: createdReply
      });

    } catch (e) {
      console.error("CREATE REVIEW REPLY ERROR:", e);
      return res.status(500).json({ success: false, message: "Failed to create review reply matrix" });
    }
  },



 async disconnectUgcPost (req, res, next) {
    try {
      const ownerId = req.userId;
      const { id } = req.params;

      const post = await Post.findByPk(id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post asset blueprint missing." });
      }

      let hasAccess = false;

      if (post.hotelId) {
        const hotel = await Hotels.findOne({ where: { id: post.hotelId, user_id: ownerId } });
        if (hotel) {
          post.hotelId = null;
          hasAccess = true;
        }
      } else if (post.restaurantId) {
        const restaurant = await Restaurant.findOne({ where: { id: post.restaurantId, owner_id: ownerId } });
        if (restaurant) {
          post.restaurantId = null;
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Access denied. Action detached from your property boundaries." });
      }

      await post.save();
      return res.json({ success: true, message: "Post unlinked from business layout successfully." });
    } catch (e) {
      console.error("DISCONNECT UGC POST ERROR:", e);
      return res.status(500).json({ success: false, message: "Failed to execute post matrix disconnect asset filter." });
    }
  },



   async getOwnerSettings (req, res)  {
    try {
      const ownerId = req.userId;
      const owner = await User.findByPk(ownerId);

      if (!owner) {
        return res.status(404).json({ success: false, message: "Owner profile not found." });
      }

      const settings = {
        ownerName: owner.userName || "",
        ownerEmail: owner.email || "",
        themeMode: owner.theme_mode || "dark"
      };

      return res.status(200).json({
        success: true,
        settings
      });

    } catch (error) {
      console.error("GET OWNER SETTINGS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error.message
      });
    }
  },



  async updateOwnerSettings (req, res) {
    try {
      const ownerId = req.userId;
      const {
        ownerName,
        ownerEmail,
        oldPassword,
        newPassword
      } = req.body;

      if (!ownerName?.trim() || !ownerEmail?.trim()) {
        return res.status(400).json({ success: false, message: "Name and Email are required fields." });
      }

      const owner = await User.findByPk(ownerId);
      if (!owner) {
        return res.status(404).json({ success: false, message: "Owner profile account not found." });
      }

      if (newPassword && newPassword.trim() !== "") {
        const hashedOld = hashPassword(oldPassword);
        if (owner.password !== hashedOld) {
          return res.status(400).json({ success: false, message: "The old password is incorrect." });
        }
        owner.password = hashPassword(newPassword);
      }

      owner.userName = ownerName.trim();
      owner.email = ownerEmail.trim().toLowerCase();

      await owner.save();

      return res.status(200).json({
        success: true,
        message: "Profile settings registry synchronized successfully within user layout model."
      });

    } catch (error) {
      console.error("UPDATE OWNER SETTINGS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error.message
      });
    }
  },


}
