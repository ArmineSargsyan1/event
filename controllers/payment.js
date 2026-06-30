//
// import Booking from "../models/Booking.js";
// import Room from "../models/Room.js";
// import Stripe from "stripe";
//
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//
// export const createBookingSession = async (req, res) => {
//   try {
//     const { bookingId } = req.body;
//
//     // =========================
//     // GET BOOKING
//     // =========================
//     const booking = await Booking.findByPk(bookingId, {
//       include: [
//         {
//           model: Room,
//           as: "room",
//         },
//       ],
//     });
//
//     if (!booking) {
//       return res.status(404).json({
//         message: "Booking not found",
//       });
//     }
//
//     // =========================
//     // STRIPE PAYMENT INTENT
//     // =========================
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(booking.total_price * 100),
//       currency: "usd",
//       payment_method_types: ["card"],
//       metadata: { booking_id: bookingId },
//     });
//
//     // =========================
//     // SAVE PAYMENT INTENT ID
//     // =========================
//     booking.stripe_session_id = paymentIntent.id;
//     await booking.save();
//
//     // =========================
//     // RESPONSE (clientSecret)
//     // =========================
//     return res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//     });
//
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Payment intent creation failed",
//     });
//   }
// };
//
//
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
//   // =========================
//   // PAYMENT SUCCESS
//   // =========================
//   if (event.type === "payment_intent.succeeded") {
//     const paymentIntent = event.data.object;
//
//     const bookingId = paymentIntent.metadata.booking_id;
//     const booking = await Booking.findByPk(bookingId);
//
//     if (booking) {
//       booking.payment_status = "paid";
//       booking.status = "confirmed";
//       booking.paid_at = new Date();
//
//       await booking.save();
//       console.log(`Booking ${bookingId} successfully confirmed via webhook!`);
//     }
//   }
//
//   // =========================
//   // PAYMENT FAILED
//   // =========================
//   if (event.type === "payment_intent.payment_failed") {
//     const paymentIntent = event.data.object;
//
//     const bookingId = paymentIntent.metadata.booking_id;
//     const booking = await Booking.findByPk(bookingId);
//
//     if (booking) {
//       booking.payment_status = "failed";
//       booking.status = "pending";
//
//       await booking.save();
//       console.log(`Booking ${bookingId} payment failed via webhook.`);
//     }
//   }
//
//   res.json({ received: true });
// };


import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Stripe from "stripe";
import sequelize from "../clients/db.sequelize.mysql.js";
import {Op} from "sequelize";
import StripeEventLog from "../models/StripeEventLog.js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



export const createBookingSession = async (req, res) => {
  let t = null;

  try {
    const { bookingId } = req.body;
    const userId = 1;

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
    console.error("⛔ Create booking session error:", error);

    if (t && !t.finished) {
      await t.rollback();
    }

    return res.status(500).json({
      success: false,
      message: "Payment intent creation failed",
    });
  }
};


// export const createBookingSession = async (req, res) => {
//   const t = await sequelize.transaction();
//
//   try {
//     const {bookingId} = req.body;
//     // const userId = req.userid;
//     const userId = 1;
//
//     const booking = await Booking.findByPk(bookingId, {
//       include: [{model: Room, as: "room"}],
//       transaction: t,
//       lock: t.LOCK.UPDATE,
//     });
//
//
//     if (!booking) {
//       await t.rollback();
//       return res.status(404).json({message: "Booking not found"});
//     }
//
//
//     if (booking.user_id !== userId) {
//       await t.rollback();
//       return res.status(403).json({message: "Access denied"});
//     }
//
//     // =========================
//     // STATUS CHECK
//     // =========================
//     if (booking.status !== "pending") {
//       await t.rollback();
//       return res.status(409).json({
//         message: "Booking is not available for payment",
//       });
//     }
//
//
//     // =========================
//     // ROOM CONFLICT CHECK (LOCKED)
//     // =========================
//     const conflict = await Booking.findOne({
//       where: {
//         room_id: booking.room_id,
//         id: {[Op.ne]: booking.id},
//         status: "confirmed",
//         check_in: {[Op.lt]: booking.check_out},
//         check_out: {[Op.gt]: booking.check_in},
//       },
//       transaction: t,
//       lock: t.LOCK.UPDATE,
//     });
//
//     if (conflict) {
//       await t.rollback();
//       return res.status(409).json({message: "Room already booked"});
//     }
//
//     // =========================
//     // REUSE INTENT (FIXED ORDER)
//     // =========================
//     if (booking.stripe_session_id) {
//       const existingIntent = await stripe.paymentIntents.retrieve(
//         booking.stripe_session_id
//       );
//
//       await t.commit();
//
//       return res.json({
//         success: true,
//         clientSecret: existingIntent.client_secret,
//       });
//     }
//
//     // =========================
//     // CREATE PAYMENT INTENT
//     // =========================
//
//     const paymentIntent = await stripe.paymentIntents.create(
//       {
//         amount: Math.round(booking.total_price * 100),
//         currency: "usd",
//         payment_method_types: ["card"],
//         metadata: {booking_id: bookingId,},
//       },
//       {
//         idempotencyKey: `booking_${bookingId}`,
//       }
//     );
//
//
//     booking.stripe_session_id = paymentIntent.id;
//     await booking.save({transaction: t});
//
//     await t.commit();
//
//     return res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (error) {
//     console.log(error);
//     await t.rollback();
//
//     return res.status(500).json({
//       success: false,
//       message: "Payment intent creation failed",
//     });
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

  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return res.json({ received: true });
  }

  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) return res.json({ received: true });

  let wt = null;

  try {
    wt = await sequelize.transaction();

    const booking = await Booking.findByPk(bookingId, {
      transaction: wt,
      lock: wt.LOCK.UPDATE
    });

    if (!booking) {
      await wt.rollback();
      return res.json({ received: true });
    }

    // 🔥 SUCCESS: Վճարումը հաջողվեց
    if (event.type === "payment_intent.succeeded") {
      if (booking.status !== "confirmed") {
        booking.status = "confirmed";
        booking.payment_status = "paid";
        booking.paid_at = new Date();

        booking.success_token = crypto.randomBytes(32).toString("hex");
        booking.success_token_expires = new Date(Date.now() + 10 * 60 * 1000);

        await booking.save({ transaction: wt });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      booking.status = "pending";
      booking.payment_status = "failed";

      await booking.save({ transaction: wt });
    }

    await wt.commit();
    return res.json({ received: true });

  } catch (error) {
    console.error("⛔ Webhook processing error:", error);
    if (wt && !wt.finished) {
      await wt.rollback();
    }
    return res.json({ received: true });
  }
};


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
//   try {
//     if (
//       event.type !== "payment_intent.succeeded" &&
//       event.type !== "payment_intent.payment_failed"
//     ) {
//       return res.json({ received: true });
//     }
//
//     const paymentIntent = event.data.object;
//     const bookingId = paymentIntent.metadata?.booking_id;
//
//     if (!bookingId) return res.json({ received: true });
//
//     const booking = await Booking.findByPk(bookingId);
//
//     if (!booking) return res.json({ received: true });
//
//     // 🔥 SUCCESS
//     if (event.type === "payment_intent.succeeded") {
//       if (booking.status !== "confirmed") {
//         booking.status = "confirmed";
//         booking.payment_status = "paid";
//         booking.paid_at = new Date();
//
//         booking.success_token = crypto.randomBytes(32).toString("hex");
//         booking.success_token_expires = new Date(Date.now() + 10 * 60 * 1000);
//
//         await booking.save();
//       }
//     }
//
//     // ❌ FAILED
//     if (event.type === "payment_intent.payment_failed") {
//       booking.status = "pending";
//       booking.payment_status = "failed";
//
//       await booking.save();
//     }
//
//     return res.json({ received: true });
//   } catch (error) {
//     console.error(error);
//     return res.json({ received: true });
//   }
// };
//



