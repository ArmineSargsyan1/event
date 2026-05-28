import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Stripe from "stripe";


const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

export const createBookingSession =
  async (req, res) => {

    try {const {bookingId} = req.body;

      // =========================
      // GET BOOKING
      // =========================
      const booking = await Booking.findByPk(bookingId,
        {
            include: [
              {
                model: Room,
                as: "room",
              },
            ],
          }
        );

      if (!booking) {

        return res.status(404).json({
          message:
            "Booking not found",
        });
      }

      // =========================
      // STRIPE SESSION
      // =========================
      const session =
        await stripe.checkout.sessions.create({

          payment_method_types: [
            "card",
          ],

          mode: "payment",

          metadata: {booking_id:bookingId},

          line_items: [
            {
              price_data: {

                currency: "usd",

                product_data: {
                  name:
                    booking.room?.name ||
                    "Hotel Booking",
                },

                unit_amount:
                  Math.round(
                    booking.total_price * 100
                  ),
              },

              quantity: 1,
            },
          ],

          success_url:
            `http://localhost:3000/payment-success?booking_id=${booking.id}`,

          cancel_url:
            `http://localhost:3000/payment-cancel?booking_id=${booking.id}`,
        });

      // =========================
      // SAVE SESSION ID
      // =========================
      booking.stripe_session_id =
        session.id;

      await booking.save();

      // =========================
      // RESPONSE
      // =========================
      return res.json({

        success: true,

        url:
        session.url,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Payment session failed",
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
    console.log(
      "❌ Webhook signature error:",
      err.message
    );

    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  // =========================
  // CHECKOUT SUCCESS
  // =========================
  if (
    event.type ===
    "checkout.session.completed"
  ) {
    const session =
      event.data.object;

    const bookingId =
      session.metadata.booking_id;

    const booking =
      await Booking.findByPk(
        bookingId
      );

    if (booking) {
      booking.payment_status =
        "paid";

      await booking.save();

      console.log(
        "✅ Booking marked as PAID"
      );
    }
  }

  res.json({ received: true });
};
// export const stripeBookingWebhook = async (req, res) => {
//   console.log("BODY IS BUFFER:", Buffer.isBuffer(req.body),666);
//
//   const sig = req.headers["stripe-signature"];
//
//   let event;
//
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.log("❌ Webhook signature error:", err.message);
//
//     return res.status(400).send(
//       `Webhook Error: ${err.message}`
//     );
//   }
//
//   console.log("✅ WEBHOOK HIT:", event.type);
//
//   res.json({ received: true });
// };





