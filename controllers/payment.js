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
import Hotels from "../models/Hotels.js";
import Photo from "../models/Photo.js";
import Amenity from "../models/Amenity.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createBookingSession = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {bookingId} = req.body;
    // const userId = req.userid;
    const userId = 1;


    const booking = await Booking.findByPk(bookingId, {
      include: [
        {model: Room, as: "room",
          include: [
            {
              model: Hotels,
              as: "hotel",
              attributes: ["id", "name", "address", "lat", "lon",],
            },
            {
              model: Photo,
              as: "images",
              attributes: ["id", "path"],
            },
            {
              model: Amenity,
              as: "amenities",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });


    if (!booking) {
      await t.rollback();
      return res.status(404).json({message: "Booking not found"});
    }


    if (booking.user_id !== userId) {
      await t.rollback();
      return res.status(403).json({message: "Access denied"});
    }

    // =========================
    // STATUS CHECK
    // =========================
    if (booking.status !== "pending") {
      await t.rollback();
      return res.status(409).json({
        message: "Booking is not available for payment",
      });
    }

    // =========================
    // EXPIRE CHECK
    // =========================
    if (
      booking.expires_at &&
      new Date(booking.expires_at) < new Date()
    ) {
      await t.rollback();
      return res.status(409).json({message: "Booking expired"});
    }

    // =========================
    // ROOM CONFLICT CHECK (LOCKED)
    // =========================
    const conflict = await Booking.findOne({
      where: {
        room_id: booking.room_id,
        id: {[Op.ne]: booking.id},
        status: "confirmed",
        check_in: {[Op.lt]: booking.check_out},
        check_out: {[Op.gt]: booking.check_in},
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (conflict) {
      await t.rollback();
      return res.status(409).json({message: "Room already booked"});
    }


    const room = booking.room || null;

    const formattedRoom = {
      id: room.id,
      name: room.name,
      images: room.images,
      amenities: room.amenities,

      hotel: {
        id: room.hotel?.id,
        name: room.hotel?.name,
        address: room.hotel?.address,
        lat: room.hotel?.lat,
        lng: room.hotel?.lon,
      },
    };

    // =========================
    // REUSE INTENT (FIXED ORDER)
    // =========================
    if (booking.stripe_session_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(
        booking.stripe_session_id
      );

      await t.commit();

      return res.json({
        success: true,
        clientSecret: existingIntent.client_secret,
        room: formattedRoom,
      });
    }

    // =========================
    // CREATE PAYMENT INTENT
    // =========================

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(booking.total_price * 100),
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {booking_id: bookingId,},
      },
      {
        idempotencyKey: `booking_${bookingId}`,
      }
    );


    booking.stripe_session_id = paymentIntent.id;
    await booking.save({transaction: t});

    await t.commit();


    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      room: formattedRoom,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();

    return res.status(500).json({
      success: false,
      message: "Payment intent creation failed",
    });
  }
};

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

  try {
    // =========================
    // 1. IDEMPOTENCY (STRIPE EVENT LEVEL)
    // =========================
    const alreadyProcessed = await StripeEventLog.findByPk(event.id);

    if (alreadyProcessed) {
      return res.json({received: true});
    }

    await StripeEventLog.create({id: event.id});

    // =========================
    // 2. GET BOOKING
    // =========================
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.json({received: true});
    }

    // =========================
    // 3. IDEMPOTENCY (BOOKING LEVEL)
    // =========================
    if (booking.status === "confirmed") {
      return res.json({received: true});
    }

    if (booking.status === "cancelled") {
      return res.json({received: true});
    }

    // =========================
    // 4. SUCCESS
    // =========================
    if (event.type === "payment_intent.succeeded") {
      booking.payment_status = "paid";
      booking.status = "confirmed";
      booking.paid_at = new Date();

      await booking.save();

      console.log(`Booking ${bookingId} confirmed`);
    }

    // =========================
    // 5. FAILED
    // =========================
    if (event.type === "payment_intent.payment_failed") {
      booking.payment_status = "failed";
      booking.status = "pending";

      await booking.save();

      console.log(`Booking ${bookingId} failed`);
    }

    return res.json({received: true});
  } catch (error) {
    console.error("Webhook error:", error);
    return res.json({received: true});
  }
};

