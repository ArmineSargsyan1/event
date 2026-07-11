import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Stripe from "stripe";
import sequelize from "../clients/db.sequelize.mysql.js";
import {Op} from "sequelize";
import StripeEventLog from "../models/StripeEventLog.js";
import crypto from "crypto";
import {sendMail} from "../services/mail.js";
import Hotels from "../models/Hotels.js";
import Socket from "../services/Socket.js";
import Notification from "../models/Notification.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



export const createBookingSession = async (req, res) => {
  let t = null;

  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    t = await sequelize.transaction();

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Room, as: "room" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user_id !== userId) {
      await t.rollback();
      return res.status(403).json({ message: "Access denied" });
    }

    if (booking.status !== "pending") {
      await t.rollback();
      return res.status(409).json({ message: "Booking is not available for payment" });
    }

    const conflict = await Booking.findOne({
      where: {
        room_id: booking.room_id,
        id: { [Op.ne]: booking.id },
        status: "confirmed",
        check_in: { [Op.lt]: booking.check_out },
        check_out: { [Op.gt]: booking.check_in },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (conflict) {
      await t.rollback();
      return res.status(409).json({ message: "Room already booked" });
    }

    if (booking.stripe_session_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.stripe_session_id);
      await t.commit();
      return res.json({
        success: true,
        clientSecret: existingIntent.client_secret,
      });
    }

    await t.commit();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(booking.total_price * 100),
        currency: "usd",
        payment_method_types: ["card"],
        metadata: { booking_id: bookingId },
      },
      {
        idempotencyKey: `booking_${bookingId}`,
      }
    );

    await Booking.update(
      { stripe_session_id: paymentIntent.id },
      { where: { id: bookingId } }
    );

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error(" Create booking session error:", error);

    if (t && !t.finished) {
      await t.rollback();
    }

    return res.status(500).json({
      success: false,
      message: "Payment intent creation failed",
    });
  }
};


// sa ashxatoxn er avelacrel em socket
// export const stripeBookingWebhook = async (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   let event;
//
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
//
//   if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
//     return res.json({ received: true });
//   }
//
//   const paymentIntent = event.data.object;
//   const bookingId = paymentIntent.metadata?.booking_id;
//
//   if (!bookingId) return res.json({ received: true });
//
//   let wt = null;
//
//   try {
//     wt = await sequelize.transaction();
//
//     const booking = await Booking.findByPk(bookingId, {
//       transaction: wt,
//       lock: wt.LOCK.UPDATE
//     });
//
//     if (!booking) {
//       await wt.rollback();
//       return res.json({ received: true });
//     }
//
//     // 🔥 SUCCESS: Վճարումը հաջողվեց
//     if (event.type === "payment_intent.succeeded") {
//       if (booking.status !== "confirmed") {
//         booking.status = "confirmed";
//         booking.payment_status = "paid";
//         booking.paid_at = new Date();
//
//         booking.success_token = crypto.randomBytes(32).toString("hex");
//         booking.success_token_expires = new Date(Date.now() + 10 * 60 * 1000);
//
//         await booking.save({ transaction: wt });
//
//
//         try {
//           await sendMail({
//             to: booking.customer_email,
//             subject: `Booking Confirmed! Reservation #${booking.id}`,
//             template: "voucher",
//             templateData: {
//               id: booking.id,
//               customerName: booking.customer_name,
//               checkIn: booking.check_in,
//               checkOut: booking.check_out,
//               totalPrice: booking.total_price
//             }
//           });
//           console.log(` Voucher email successfully dispatched to customer.`);
//         } catch (mailErr) {
//           console.error(" Nodemailer failed but database transaction saved:", mailErr);
//         }
//
//
//       }
//     }
//
//     if (event.type === "payment_intent.payment_failed") {
//       booking.status = "pending";
//       booking.payment_status = "failed";
//
//       await booking.save({ transaction: wt });
//     }
//
//     await wt.commit();
//     return res.json({ received: true });
//
//   } catch (error) {
//     console.error("⛔ Webhook processing error:", error);
//     if (wt && !wt.finished) {
//       await wt.rollback();
//     }
//     return res.json({ received: true });
//   }
// };


export const stripeBookingWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.json({ received: true });

  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return;
  }

  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) return;

  let wt = null;

  try {
    wt = await sequelize.transaction();

    const booking = await Booking.findByPk(bookingId, {
      transaction: wt,
      lock: wt.LOCK.UPDATE
    });

    if (!booking) {
      await wt.rollback();
      return;
    }

    if (event.type === "payment_intent.succeeded") {
      if (booking.status !== "confirmed") {
        booking.status = "confirmed";
        booking.payment_status = "paid";
        booking.paid_at = new Date();

        booking.success_token = crypto.randomBytes(32).toString("hex");
        booking.success_token_expires = new Date(Date.now() + 10 * 60 * 1000);

        await booking.save({ transaction: wt });

        const formattedBookingId = String(booking.id).padStart(8, '0');
        const bookingCode = `#GPH-${formattedBookingId}`;

        try {
          const currentUserId = booking.user_id || booking.userId;

          if (currentUserId) {
            const bookingNotification = await Notification.create({
              userId: currentUserId,
              type: 'BOOKING_CONFIRMED',
              message: `Your reservation ${bookingCode} has been successfully confirmed! 🎉`,
              hotelId: booking.hotel_id || booking.hotelId,
              isRead: 0
            }, { transaction: wt });


              if (typeof Socket !== 'undefined' && Socket.emit) {
              await Socket.emit(
                `user_${currentUserId}`,
                {
                  event: 'new_notification',
                  data: bookingNotification.toJSON()
                },
                'new_notification'
              );
              console.log(`📡 Real-time Socket notification sent to User: ${currentUserId}`);
            }
          }
        } catch (socketErr) {
          console.error("⚠️ Notification/Socket failed, but Booking is SAFE:", socketErr.message);
        }

        try {
          await sendMail({
            to: booking.customer_email,
            subject: `Booking Confirmed! Reservation #${booking.id}`,
            template: "voucher",
            templateData: {
              id: booking.id,
              customerName: booking.customer_name,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              totalPrice: booking.total_price
            }
          });
          console.log(` Voucher email successfully dispatched to customer.`);
        } catch (mailErr) {
          console.error(" Nodemailer failed but database transaction saved:", mailErr);
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      booking.status = "pending";
      booking.payment_status = "failed";
      await booking.save({ transaction: wt });
    }

    await wt.commit();

  } catch (error) {
    console.error("⛔ Webhook processing error:", error);
    if (wt && !wt.finished) {
      try {
        await wt.rollback();
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr.message);
      }
    }
  }
};

