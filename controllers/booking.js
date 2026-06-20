import RoomOption from "../models/RoomOption.js";
import Booking from "../models/Booking.js";
import FileHelper from "../services/Utils.js";
import {Op, Utils} from "sequelize";
import sequelize from "../clients/db.sequelize.mysql.js";
import Room from "../models/Room.js";


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

  return !existing; // true = available
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

  // 📅 season logic
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

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: {
        id: req.params.id,
        user_id: 1
        // req.user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.json(booking);

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};



export const createBooking = async (req, res) => {
  console.log(req.body, 88888888888);

  const transaction = await sequelize.transaction();

  try {
    console.log("CREATE PAYMENT SESSION");
    const {
      room_id,
      rate_plan_id,
      check_in,
      check_out,
      guests,
      customer_name,
      customer_phone,
    } = req.body;

    // =========================
    // AUTH USER
    // =========================
    const user_id = 1;

    // =========================

    // =========================
    const expires_at = new Date(Date.now() + 15 * 60 * 1000);

    // =========================
    // ROOM
    // =========================
    const room = await Room.findByPk(room_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!room) {
      await transaction.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    // =========================
    // GUEST CHECK
    // =========================
    if (room.max_guests && guests > room.max_guests) {
      await transaction.rollback();
      return res.status(400).json({ message: "Too many guests" });
    }

    // =========================
    // EXPIRE OLD BOOKINGS
    // =========================
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

    // =========================
    // CHECK CONFLICT
    // =========================
    const conflict = await Booking.findOne({
      where: {
        room_id,
        status: { [Op.in]: ["pending", "confirmed"] },
        check_in: { [Op.lt]: check_out },
        check_out: { [Op.gt]: check_in },
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (conflict) {
      await transaction.rollback();
      return res.status(409).json({ message: "Room already booked" });
    }

    // =========================
    // RATE PLAN
    // =========================
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

    // =========================
    // CALCULATE PRICE
    // =========================
    const priceData = FileHelper.calculateBookingPrice(
      ratePlan,
      check_in,
      check_out,
      guests
    );

    // =========================
    // CREATE BOOKING
    // =========================
    const booking = await Booking.create(
      {
        user_id,
        room_id,
        option_id: rate_plan_id,
        customer_name,
        customer_phone,
        check_in,
        check_out,
        guests,
        total_price: priceData.total,
        status: "pending",
        payment_status: "pending",
        expires_at,
        lock_token: crypto.randomUUID(),
      },
      { transaction }
    );

    // =========================
    // COMMIT
    // =========================
    await transaction.commit();

    // =========================
    // RETURN BOOKING ID
    // =========================
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
  const { id } = req.params;

  const booking = await Booking.findByPk(id);

  if (!booking || booking.status !== "confirmed") {
    return res.status(403).json({ message: "Not allowed" });
  }

  return res.json({
    token: booking.success_token,
  });
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


// export const createBooking = async (req, res) => {
//   console.log(req.body,88888888888)
//   const { room_id,
//     rate_plan_id,
//     check_in,
//     check_out,
//     guests,} = req.body
//
//   console.log( room_id,
//     rate_plan_id,
//     check_in,
//     check_out,
//     guests,)
//
//   const transaction =
//     await sequelize.transaction();
//
//   try {
//
//     const {
//       room_id,
//       rate_plan_id,
//       check_in,
//       check_out,
//       guests,
//     } = req.body;
//
//     // =========================
//     // AUTH USER
//     // =========================
//     // const user_id = req.user.id;
//     const user_id = 1;
//
//     // =========================
//     // BOOKING EXPIRES
//     // =========================
//     const expires_at =
//       new Date(
//         Date.now() +
//         15 * 60 * 1000
//       );
//
//     // =========================
//     // ROOM
//     // =========================
//     const room =
//       await Room.findByPk(
//         room_id,
//         {
//           transaction,
//           lock:
//           transaction.LOCK.UPDATE,
//         }
//       );
//
//     if (!room) {
//
//       await transaction.rollback();
//
//       return res.status(404).json({
//         message:
//           "Room not found",
//       });
//     }
//
//     // =========================
//     // GUEST CHECK
//     // =========================
//     if (
//       room.max_guests &&
//       guests > room.max_guests
//     ) {
//
//       await transaction.rollback();
//
//       return res.status(400).json({
//         message:
//           "Too many guests",
//       });
//     }
//
//     // =========================
//     // EXPIRE OLD BOOKINGS
//     // =========================
//     await Booking.update(
//       {
//         status: "expired",
//       },
//
//       {
//         where: {
//
//           status: "pending",
//
//           expires_at: {
//             [Op.lt]: new Date(),
//           },
//         },
//
//         transaction,
//       }
//     );
//
//     // =========================
//     // CHECK CONFLICT
//     // =========================
//     const conflict =
//       await Booking.findOne({
//
//         where: {
//
//           room_id,
//
//           status: {
//             [Op.in]: ["pending", "confirmed",],
//           },
//
//           check_in: {[Op.lt]: check_out,},
//
//           check_out: {[Op.gt]: check_in,
//           },
//
//           [Op.or]: [
//
//             {
//               expires_at: null,
//             },
//
//             {
//               expires_at: {
//                 [Op.gt]:
//                   new Date(),
//               },
//             },
//           ],
//         },
//
//         transaction,
//
//         lock: transaction.LOCK.UPDATE,
//       });
//
//     if (conflict) {
//
//       await transaction.rollback();
//
//       return res.status(409).json({
//         message:
//           "Room already booked",
//       });
//     }
//
//     // =========================
//     // RATE PLAN
//     // =========================
//     const ratePlan =
//       await RoomOption.findOne({
//
//         where: {
//
//           id: rate_plan_id,
//
//           // room_id,
//
//           status: "active",
//         },
//
//         transaction,
//
//         lock:
//         transaction.LOCK.UPDATE,
//       });
//
//     if (!ratePlan) {
//
//       await transaction.rollback();
//
//       return res.status(404).json({
//         message:
//           "Rate plan not found",
//       });
//     }
//
//     // =========================
//     // CALCULATE PRICE
//     // =========================
//     const priceData =
//       FileHelper.calculateBookingPrice(
//         ratePlan,
//         check_in,
//         check_out,
//         guests
//       );
//
//     // =========================
//     // CREATE BOOKING
//     // =========================
//     const booking =
//       await Booking.create(
//         {
//
//           user_id,
//
//           room_id,
//
//           option_id: rate_plan_id,
//
//           check_in,
//
//           check_out,
//
//           guests,
//
//           total_price:
//           priceData.total,
//
//           status:
//             "pending",
//
//           payment_status:
//             "pending",
//
//           expires_at,
//
//           lock_token:
//             crypto.randomUUID(),
//         },
//
//         {
//           transaction,
//         }
//       );
//
//     // =========================
//     // COMMIT
//     // =========================
//     await transaction.commit();
//
//     // =========================
//     // RETURN BOOKING ID
//     // =========================
//     return res.status(201).json({
//
//       success: true,
//
//       booking_id:
//       booking.id,
//
//       booking,
//     });
//
//   } catch (error) {
//
//     await transaction.rollback();
//
//     console.log(error);
//
//     return res.status(500).json({
//
//       success: false,
//
//       message:
//         "Booking creation failed",
//     });
//   }
// };













export const cancelBooking = async (req, res) => {

  try {

    const { bookingId } = req.params;

    // =========================
    // FIND BOOKING
    // =========================
    const booking =
      await Booking.findByPk(
        bookingId,
        {
          include: [
            {
              model: RoomOption,
              as: "option",
            },
          ],
        }
      );

    if (!booking) {

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // =========================
    // OWNER CHECK
    // =========================
    if (
      booking.user_id !== 1
      // req.user.id
    ) {

      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    // =========================
    // ALREADY CANCELLED
    // =========================
    if (
      booking.status === "cancelled"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Booking already cancelled",
      });
    }

    // =========================
    // EXPIRED BOOKINGS
    // =========================
    if (
      booking.status === "expired"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Expired booking cannot be cancelled",
      });
    }

    // =========================
    // REFUND CALCULATION
    // =========================
    const refund =
      FileHelper.calculateRefund(
        booking.option,
        booking.check_in,
        new Date()
      );

    const refundAmount =
      (
        booking.total_price *
        refund.refundPercent
      ) / 100;

    // =========================
    // PAYMENT STATUS
    // =========================
    let paymentStatus =
      booking.payment_status;

    if (
      booking.payment_status ===
      "paid"
    ) {

      paymentStatus =
        refundAmount > 0
          ? "refunded"
          : "paid";
    }

    // =========================
    // UPDATE BOOKING
    // =========================
    booking.status =
      "cancelled";

    booking.cancelled_at =
      new Date();

    booking.refund_amount =
      refundAmount;

    booking.payment_status =
      paymentStatus;

    await booking.save();

    // =========================
    // RESPONSE
    // =========================
    return res.json({

      success: true,

      message:
        "Booking cancelled successfully",

      refund,

      refundAmount,

      booking,
    });

  } catch (e) {

    console.error(e);

    return res.status(500).json({

      success: false,

      message:
        "Cancel failed",
    });
  }
};


// export const cancelBooking = async (req, res) => {
//   console.log(req.params.bookingId,88888)
//   try {
//     const { bookingId } = req.params;
//
//
//
//     // 1. գտնում ենք booking-ը
//     const booking = await Booking.findByPk(bookingId, {
//       include: [
//         {
//           model: RoomOption,
//           as: "option",
//         },
//       ],
//     });
//
//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }
//
//     if (
//       booking.user_id !== 1
//       // req.user.id
//     ) {
//
//       return res.status(403).json({
//         message: "Forbidden",
//       });
//     }
//
//     // 2. հաշվում ենք refund-ը
//     const refund = FileHelper.calculateRefund(
//       booking.option,
//       booking.check_in,
//       new Date()
//     );
//
//     // 3. հաշվարկ գումար
//     const refundAmount =
//       (booking.total_price * refund.refundPercent) / 100;
//
//     // 4. update booking
//     booking.status = "cancelled";
//     booking.refund_amount = refundAmount;
//
//     await booking.save();
//
//     res.json({
//       success: true,
//       refund,
//       refundAmount,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Cancel failed" });
//   }
// };



export const getBookingById =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const booking =
        await Booking.findByPk(
          id,
          {

            include: [

              {
                model: Room,
                as: "room",
              },

              {
                model: RoomOption,
                as: "option",
              },

            ],
          }
        );

      if (!booking) {

        return res.status(404).json({

          success: false,

          message:
            "Booking not found",
        });
      }

      // TEMP AUTH
      // հետո կլինի req.user.id
      if (
        booking.user_id !== 1
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Forbidden",
        });
      }

      return res.status(200).json({

        success: true,

        booking,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch booking",
      });
    }
  };


export const getMyBookings = async (req, res) => {
  try {
    // const userId = req.user.id;
    const userId = 1;

    const {
      page = 1,
      limit = 10,
      status,
      type, // upcoming | past
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {
      user_id: userId,
    };

    // filter ըստ status
    if (status) {
      where.status = status;
    }

    // filter ըստ ժամանակի
    const now = new Date();

    if (type === "upcoming") {
      where.check_in = { [Op.gt]: now };
    }

    if (type === "past") {
      where.check_out = { [Op.lt]: now };
    }

    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: Room,
          as: "room"
        },
        {
          model: RoomOption,
          as: "option",
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["check_in", "DESC"]],
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};
