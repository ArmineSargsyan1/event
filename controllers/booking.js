import RoomOption from "../models/RoomOption.js";
import Booking from "../models/Booking.js";
import FileHelper from "../services/Utils.js";
import {Op,} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "../models/Room.js";
import {RoomExtra} from "../models/index.js";
import dayjs from "dayjs";
import Hotels from "../models/Hotels.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Stripe from "stripe";
import BookingExtra from "../models/BookingExtra.js";
import Socket from "../services/Socket.js";



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const isRoomAvailable = async (room_id, check_in, check_out) => {
  const existing = await Booking.findOne({
    where: {
      room_id,
      status: "confirmed",
      [Op.or]: [
        {
          check_in: {
            [Op.lt]: check_out,
          },
          check_out: {
            [Op.gt]: check_in,
          },
        },
      ],
    },
  });

  return !existing;
};


export const calculateBookingPrice = (
  ratePlan,
  check_in,
  check_out
) => {
  const start = new Date(check_in);
  const end = new Date(check_out);

  const nights =
    Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (nights <= 0) throw new Error("Invalid dates");

  let pricePerNight = ratePlan.price;

  const now = new Date(check_in);

  if (
    ratePlan.season_start &&
    ratePlan.season_end
  ) {
    const startSeason = new Date(ratePlan.season_start);
    const endSeason = new Date(ratePlan.season_end);

    if (now >= startSeason && now <= endSeason) {
      pricePerNight += ratePlan.price_modifier;
    }
  }

  const total = pricePerNight * nights;

  return {
    nights,
    pricePerNight,
    total,
  };
};



export const createDraftBooking = async (req, res) => {
  console.log(req.body,8888)
  try {
    const {
      room_id,
      rate_plan_id,
      check_in,
      check_out,
      guests,
      rooms,
    } = req.body;

    const booking = await Booking.create({
      user_id: 1,
      // req.user.id,
      room_id,
      rate_plan_id,
      check_in,
      check_out,
      guests,
      rooms,
      status: "draft",
    });

    return res.status(201).json({
      booking_id: booking.id,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};




export const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;

    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        user_id: userId,
      },
      include: [
        {
          model: Room,
          as: "room",
          include: [
            { model: Hotels,
              as: "hotel",
              include: [
                {
                  model: HotelPhotos,
                  as: "images",
                  where: { is_main: true },
                  required: false,
                }
              ]
            }
          ]
        },
        {
          model: BookingExtra,
          as: "bookedExtras"
        }
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    let cancellationDeadline = null;

    if (booking.snapshot_cancellation_policy === "free") {
      const cancelDays = booking.snapshot_free_cancel_days;
      const cancelTime = booking.snapshot_cancel_time || "23:59";

      const [hours, minutes] = cancelTime.split(":");
      cancellationDeadline = dayjs(booking.check_in)
        .subtract(cancelDays || 0, "day")
        .hour(parseInt(hours || 0))
        .minute(parseInt(minutes || 0))
        .second(0)
        .format("YYYY-MM-DD HH:mm:ss");
    }


    const hotelImage =
      booking.room.hotel.images?.find(i => i.is_main)?.path ||
      booking.room.hotel.images?.[0]?.path ||
      null;

    const cleanBooking = {
      id: booking.id,
      createdAt: booking.createdAt,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      status: booking.status,
      paymentStatus: booking.payment_status,
      paidAt: booking.paid_at,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      cancellationDeadline: cancellationDeadline,
      refundAmount: booking.refund_amount,

      room: booking.room ? {
        id: booking.room.id,
        name: booking.room.name,
        roomType: booking.room.roomType,
        bedType: booking.room.bedType,
        size: booking.room.size,
        images: hotelImage,

        hotel: booking.room.hotel ? {
          name: booking.room.hotel.name,
          address: booking.room.hotel.address,
          phone: booking.room.hotel.phone,
          email: booking.room.hotel.email,
        } : null
      } : null,

      option: {
        id: booking.option_id,
        name: booking.snapshot_option_name,
        mealPlan: booking.snapshot_meal_plan,
        cancellationType: booking.snapshot_cancellation_policy,
      },

      extras: booking.bookedExtras ? booking.bookedExtras.map(e => ({
        id: e.id,
        name: e.name,
        price: Number(e.price || 0)
      })) : []
    };



    return res.json({
      success: true,
      data: cleanBooking
    });

  } catch (error) {
    console.error("Fetch booking details error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// export const getBookingDetails = async (req, res) => {
//   try {
//     const bookingId = req.params.id;
//     const userId = req.userId || 1; // req.user.id
//
//     const booking = await Booking.findOne({
//       where: {
//         id: bookingId,
//         user_id: userId,
//       },
//       include: [
//         {
//           model: Room,
//           as: "room",
//           include: [
//             { model: Hotels, as: "hotel" }
//           ]
//         },
//         {
//           model: RoomOption,
//           as: "option"
//         },
//       ],
//     });
//
//     // ❌ Եթե ամրագրումը չկա
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }
//
//     // ⏳ Չեղարկման վերջնաժամկետի (Deadline) դինամիկ հաշվարկ
//     let cancellationDeadline = null;
//
//     if (booking.option && booking.option.cancellation_type === "free") {
//       const cancelDays = booking.option.free_cancel_days || 0;
//       const cancelTime = booking.option.cancel_time || "23:59";
//       const [hours, minutes] = cancelTime.split(":");
//
//       cancellationDeadline = dayjs(booking.check_in)
//         .subtract(cancelDays, "day")
//         .hour(parseInt(hours))
//         .minute(parseInt(minutes))
//         .second(0)
//         .format("YYYY-MM-DD HH:mm:ss");
//     }
//
//     // ✨ ՄԱՔՐՈՒՄ ԵՎ ՓՈԽԱԿԵՐՊՈՒՄ CAMELCASE-Ի (Ուղղված տարբերակ)
//     const cleanBooking = {
//       id: booking.id,
//       createdAt: booking.createdAt,
//       checkIn: booking.check_in,
//       checkOut: booking.check_out,
//       guests: booking.guests,
//       totalPrice: booking.total_price,
//       status: booking.status,
//       paymentStatus: booking.payment_status,
//       paidAt: booking.paid_at,
//       customerName: booking.customer_name,
//       customerPhone: booking.customer_phone,
//       cancellationDeadline: cancellationDeadline,
//
//       // 🛏️ Սենյակի և հյուրանոցի տվյալները
//       room: booking.room ? {
//         id: booking.room.id,
//         name: booking.room.name,
//         roomType: booking.room.roomType,
//         bedType: booking.room.bedType,
//         size: booking.room.size,
//         images: booking.room.images || ["https://unsplash.com"],
//
//         // 🏨 Հյուրանոցի տվյալները
//         hotel: booking.room.hotel ? {
//           name: booking.room.hotel.name,
//           address: booking.room.hotel.address,
//           phone: booking.room.hotel.phone,
//           email: booking.room.hotel.email,
//         } : null
//       } : null,
//
//       // 🏷️ Տարիֆի (Plan) տվյալները՝ ՏԵՂԱՓՈԽՎԱԾ Է ՃԻՇՏ ՏԵՂԸ (Room-ից դուրս)
//       option: booking.option ? {
//         id: booking.option.id,
//         name: booking.option.name,
//         mealPlan: booking.option.meal_plan,
//         cancellationType: booking.option.cancellation_type,
//       } : null
//     }; // 👈 Կարևոր. Այս փակագիծը բացակայում էր
//
//     // 🎯 Վերադարձնում ենք ճիշտ պատասխանը
//     return res.json({
//       success: true,
//       data: cleanBooking
//     });
//
//   } catch (error) {
//     console.error("⛔ Fetch booking details error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



// export const getBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findOne({
//       where: {
//         id: req.params.id,
//         user_id: 1
//         // req.user.id,
//       },
//     });
//
//     if (!booking) {
//       return res.status(404).json({
//         message: "Booking not found",
//       });
//     }
//
//     return res.json(booking);
//
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };


export const createBooking = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {
    const {
      room_id,
      rate_plan_id,
      check_in,
      check_out,
      guests,
      customer_name,
      customer_email,
      customer_phone,
      selected_extras
    } = req.body;


    const user_id = req.userId;

    const expires_at = new Date(Date.now() + 15 * 60 * 1000);

    const room = await Room.findByPk(room_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!room) {
      await transaction.rollback();
      return res.status(404).json({ message: "Room not found" });
    }


    if (room.max_guests && guests > room.max_guests) {
      await transaction.rollback();
      return res.status(400).json({ message: "Too many guests" });
    }


    await Booking.update(
      { status: "expired" },
      {
        where: {
          status: "pending",
          expires_at: { [Op.lt]: new Date() },
        },
        transaction,
      }
    );


    const conflict = await Booking.findOne({
      where: {
        room_id,
        check_in: { [Op.lt]: check_out },
        check_out: { [Op.gt]: check_in },

        [Op.or]: [
          { status: "confirmed" },
          {
            [Op.and]: [
              { status: "pending" },
              {
                [Op.or]: [
                  { expires_at: null },
                  { expires_at: { [Op.gt]: new Date() } }
                ]
              }
            ]
          }
        ]
      },
      transaction,
      lock: transaction.LOCK.UPDATE, //2user dont
    });

    if (conflict) {
      await transaction.rollback();
      return res.status(409).json({ message: "Room already booked for these dates" });
    }


    if (conflict) {
      await transaction.rollback();
      return res.status(409).json({ message: "Room already booked" });
    }

    console.log("RATE PLAN ID =", rate_plan_id);
    const ratePlan = await RoomOption.findOne({
      where: {
        id: rate_plan_id,
        status: "active",
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    console.log("RATE PLAN =", ratePlan);

    if (!ratePlan) {
      await transaction.rollback();
      return res.status(404).json({ message: "Rate plan not found" });
    }

    const priceData = FileHelper.calculateBookingPrice(
      ratePlan,
      check_in,
      check_out,
      guests
    );

    let finalTotalPrice = Number(priceData.total);

    let extras = [];
    if (selected_extras && Array.isArray(selected_extras) && selected_extras.length > 0) {
      extras = await RoomExtra.findAll({
        where: {
          id: { [Op.in]: selected_extras }
        },
        transaction
      });

      const extrasSum = extras.reduce((sum, item) => sum + Number(item.price || 0), 0);
      finalTotalPrice += extrasSum;
    }

    const booking = await Booking.create(
      {
        user_id,
        room_id,
        option_id: rate_plan_id,

        snapshot_option_name: ratePlan.name,
        snapshot_meal_plan: ratePlan.meal_plan,
        snapshot_cancellation_policy: ratePlan.cancellation_type,
        snapshot_free_cancel_days: ratePlan.free_cancel_days,
        snapshot_cancel_time: ratePlan.cancel_time,

        customer_name,
        customer_email,
        customer_phone,
        check_in,
        check_out,
        guests,
        total_price: finalTotalPrice,
        status: "pending",
        payment_status: "pending",
        expires_at,
        lock_token: crypto.randomUUID(),
      },
      { transaction }
    );


    if (extras.length > 0) {
      const snapshotPayloads = extras.map(item => ({
        booking_id: booking.id,
        extra_id: item.id,
        name: item.name,
        price: Number(item.price || 0),
      }));

      await BookingExtra.bulkCreate(snapshotPayloads, { transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      booking_id: booking.id,
      booking,
    });

  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Booking creation failed",
    });
  }
};


export const getSuccessToken = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res.status(200).json({
        success: true,
        message: "Payment is still processing by Stripe Webhook. Retrying...",
        token: null
      });
    }

    return res.json({
      success: true,
      token: booking.success_token,
    });

  } catch (error) {
    console.error(" Success token route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getBookingConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      !booking.success_token ||
      booking.success_token !== token ||
      new Date(booking.success_token_expires) < new Date()
    ) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    return res.json({
      id: booking.id,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      status: booking.status,
      paymentStatus: booking.payment_status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: RoomOption, as: "option" }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking already cancelled" });
    }
    if (booking.status === "expired") {
      return res.status(400).json({ success: false, message: "Expired booking cannot be cancelled" });
    }

    const optionSnapshotForRefund = {
      cancellation_type: booking.snapshot_cancellation_policy,
      free_cancel_days: booking.snapshot_free_cancel_days,
      cancel_time: booking.snapshot_cancel_time,
    };

    const refund = FileHelper.calculateRefund(optionSnapshotForRefund, booking.check_in, new Date());
    const refundPercent = refund?.refundPercent ?? 0;
    const refundAmount = (booking.total_price * refundPercent) / 100;

    if (booking.payment_status === "paid" && refundAmount > 0) {
      const paymentIntentId = booking.stripe_session_id;

      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        return res.status(400).json({
          success: false,
          message: "Cannot automate refund: A valid Stripe Payment Intent ID (pi_...) was not found in the record."
        });
      }

      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer'
      });
    }

    let paymentStatus = booking.payment_status;
    if (booking.payment_status === "paid") {
      paymentStatus = refundAmount > 0 ? "refunded" : "paid";
    }

    booking.status = "cancelled";
    booking.cancelled_at = new Date();
    booking.refund_amount = refundAmount;
    booking.payment_status = paymentStatus;

    await booking.save();

    try {
      if (Socket && Socket.io) {
        await Socket.emit(
          `user_${booking.user_id}`,
          {
            bookingId: booking.id,
            status: booking.status,
            refundAmount: refundAmount,
            message: `Your booking #${booking.id} has been successfully cancelled.`
          },
          'booking_cancelled'
        );
        console.log(`📡 Real-time cancellation socket event sent to User: ${booking.user_id}`);
      } else {
        console.warn("⚠️ Socket class or Socket.io is not initialized yet.");
      }
    } catch (socketErr) {
      console.error("⚠️ Socket emit failed, but DB changes are safe:", socketErr.message);
    }

    return res.json({
      success: true,
      message: "Booking cancelled and refund processed successfully",
      refund,
      refundAmount,
      booking,
    });

  } catch (e) {
    console.error("Stripe/DB Refund Error:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Automatic cancellation failed",
    });
  }
};


// export const cancelBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//
//     const booking = await Booking.findByPk(bookingId, {
//       include: [{ model: RoomOption, as: "option" }],
//     });
//
//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }
//
//     if (booking.user_id !== req.userId) {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }
//     if (booking.status === "cancelled") {
//       return res.status(400).json({ success: false, message: "Booking already cancelled" });
//     }
//     if (booking.status === "expired") {
//       return res.status(400).json({ success: false, message: "Expired booking cannot be cancelled" });
//     }
//
//
//     const optionSnapshotForRefund = {
//       cancellation_type: booking.snapshot_cancellation_policy,
//       free_cancel_days: booking.snapshot_free_cancel_days,
//       cancel_time: booking.snapshot_cancel_time,
//     };
//
//     const refund = FileHelper.calculateRefund(optionSnapshotForRefund, booking.check_in, new Date());
//     const refundPercent = refund?.refundPercent ?? 0;
//     const refundAmount = (booking.total_price * refundPercent) / 100;
//
//     if (booking.payment_status === "paid" && refundAmount > 0) {
//
//       const paymentIntentId = booking.stripe_session_id;
//
//       if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot automate refund: A valid Stripe Payment Intent ID (pi_...) was not found in the record."
//         });
//       }
//
//       await stripe.refunds.create({
//         payment_intent: paymentIntentId,
//         amount: Math.round(refundAmount * 100),
//         reason: 'requested_by_customer'
//       });
//     }
//
//     let paymentStatus = booking.payment_status;
//     if (booking.payment_status === "paid") {
//       paymentStatus = refundAmount > 0 ? "refunded" : "paid";
//     }
//
//     booking.status = "cancelled";
//     booking.cancelled_at = new Date();
//     booking.refund_amount = refundAmount;
//     booking.payment_status = paymentStatus;
//
//     await booking.save();
//
//     return res.json({
//       success: true,
//       message: "Booking cancelled and refund processed successfully",
//       refund,
//       refundAmount,
//       booking,
//     });
//
//   } catch (e) {
//     console.error("Stripe/DB Refund Error:", e);
//     return res.status(500).json({
//       success: false,
//       message: e.message || "Automatic cancellation failed",
//     });
//   }
// };



export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Room,
          as: "room",
        },
        {
          model: BookingExtra,
          as: "bookedExtras"
        }
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const cleanBooking = {
      id: booking.id,
      createdAt: booking.createdAt,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      status: booking.status,
      paymentStatus: booking.payment_status,
      paidAt: booking.paid_at,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      refundAmount: booking.refund_amount,

      room: booking.room ? {
        id: booking.room.id,
        name: booking.room.name,
        roomType: booking.room.roomType,
        bedType: booking.room.bedType,
        size: booking.room.size,
      } : null,

      option: {
        id: booking.option_id,
        name: booking.snapshot_option_name,
        mealPlan: booking.snapshot_meal_plan,
        cancellationType: booking.snapshot_cancellation_policy,
      },

      extras: booking.bookedExtras ? booking.bookedExtras.map(e => ({
        id: e.id,
        name: e.name,
        price: Number(e.price || 0)
      })) : []
    };

    return res.status(200).json({
      success: true,
      booking: cleanBooking,
    });

  } catch (error) {
    console.error("⛔ Fetch booking by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};






export const getMyBookings = async (req, res) => {
  try {
    const userId = req.userId || 1;

    const {
      page = 1,
      limit = 10,
      status,
      type,
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {
      user_id: userId,
    };

    const now = new Date();
    const todayDate = dayjs().format("YYYY-MM-DD");

    if (status === "cancelled") {
      where.status = "cancelled";
    } else if (status === "expired") {
      where[Op.or] = [
        { status: "expired" },
        { status: "pending", expires_at: { [Op.lte]: now } }
      ];
    } else {
      if (status) {
        if (status === "pending") {
          where.status = "pending";
          where.expires_at = { [Op.gt]: now };
        } else {
          where.status = status;
        }
      }

      if (type === "upcoming") {
        where.check_out = { [Op.gte]: todayDate };

        if (!status) {
          where[Op.not] = [
            { status: "pending", expires_at: { [Op.lte]: now } }
          ];
        }
      }

      if (type === "past") {
        delete where.status;

        where[Op.or] = [
          { check_out: { [Op.lt]: todayDate } },
          { status: { [Op.in]: ["cancelled", "expired"] } }
        ];
      }
    }

    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Room, as: "room" },
        { model: BookingExtra, as: "bookedExtras" }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["check_in", "DESC"]],
    });

    const cleanRows = rows.map((booking) => {
      let cancellationDeadline = null;

      if (booking.snapshot_cancellation_policy === "free") {
        const cancelDays = booking.snapshot_free_cancel_days || 0;
        const cancelTime = booking.snapshot_cancel_time || "23:59";

        const [hours, minutes] = cancelTime.split(":");
        cancellationDeadline = dayjs(booking.check_in)
          .subtract(cancelDays, "day")
          .hour(parseInt(hours || 0))
          .minute(parseInt(minutes || 0))
          .second(0)
          .format("YYYY-MM-DD HH:mm:ss");
      }

      return {
        id: booking.id,
        hotelId: booking.room?.hotel_id || null,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        guests: booking.guests,
        totalPrice: booking.total_price,
        status: booking.status,
        paymentStatus: booking.payment_status,
        createdAt: booking.createdAt,
        paidAt: booking.paid_at,
        cancelledAt: booking.cancelled_at,
        expiresAt: booking.expires_at,
        cancellationDeadline: cancellationDeadline,
        room: booking.room ? {
          id: booking.room.id,
          name: booking.room.name,
          roomType: booking.room.roomType,
          bedType: booking.room.bedType,
          size: booking.room.size,
        } : null,
        option: {
          id: booking.option_id,
          name: booking.snapshot_option_name,
          cancellationType: booking.snapshot_cancellation_policy,
          mealPlan: booking.snapshot_meal_plan,
        },
        extras: booking.bookedExtras ? booking.bookedExtras.map(e => ({
          id: e.id,
          name: e.name,
          price: Number(e.price || 0)
        })) : []
      };
    });

    return res.json({
      success: true,
      data: cleanRows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });

  } catch (e) {
    console.error(" Fetch bookings error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};
