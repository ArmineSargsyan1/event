import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Stripe from "stripe";
import sequelize from "../clients/db.sequelize.mysql.js";
import {Op} from "sequelize";
import crypto from "crypto";
import {sendMail} from "../services/mail.js";
import Hotels from "../models/Hotels.js";
import Socket from "../services/Socket.js";
import Notification from "../models/Notification.js";
import Restaurant from "../models/Restaurant.js";
import {Order} from "../models/index.js";
import MenuItem from "../models/MenuItem.js";
import Dish from "../models/Dish.js";
import OrderItem from "../models/OrderItem.js";
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





export const createRestaurantOrder = async (req, res, next) => {
  try {
    const { restaurantId, bookingId, items, deliveryAddress } = req.body;
    const userId = req.userId || null;

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    let hasPrepaidBreakfast = false;

    if (bookingId) {
      const currentBooking = await Booking.findByPk(bookingId);

      if (!currentBooking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

      if (currentBooking.status !== 'confirmed') {
        return res.status(400).json({ success: false, message: "Booking is not confirmed" });
      }

      const today = new Date();
      const checkInDate = new Date(currentBooking.check_in_date);
      const checkOutDate = new Date(currentBooking.check_out_date);

      if (today < checkInDate || today > checkOutDate) {
        return res.status(400).json({
          success: false,
          message: "Room service is only available during your stay (between check-in and check-out dates)."
        });
      }

      if (currentBooking.snapshot_meal_plan === 'breakfast' ||
        currentBooking.snapshot_meal_plan === 'all_inclusive' ||
        currentBooking.snapshot_meal_plan === 'full_board') {
        hasPrepaidBreakfast = true;
      }
    }

    const order = await Order.create({
      restaurantId,
      userId,
      bookingId: bookingId || null,
      deliveryAddress: bookingId ? "Room Service" : deliveryAddress,
      amount: 0,
      status: 'pending'
    });

    let totalAmount = 0;
    const orderItemsToCreate = [];

    const serverHour = new Date().getHours();
    const isActualBreakfastHour = serverHour >= 8 && serverHour < 20;

    for (const item of items) {
      const dbItem = await MenuItem.findByPk(item.menuItemId, {
        include: [{ model: Dish }]
      });

      if (!dbItem) {
        return res.status(404).json({ success: false, message: `Menu item ID ${item.menuItemId} not found` });
      }

      let finalPricePerItem = dbItem.price;

      const isFreeBreakfastItem =
        hasPrepaidBreakfast &&
        isActualBreakfastHour &&
        dbItem.Dish?.category?.toLowerCase() === 'breakfast';

      if (isFreeBreakfastItem) {
        finalPricePerItem = 0;
      }

      totalAmount += finalPricePerItem * item.quantity;

      orderItemsToCreate.push({
        orderId: order.id,
        menuItemId: dbItem.id,
        quantity: item.quantity,
        price: finalPricePerItem
      });
    }

    await OrderItem.bulkCreate(orderItemsToCreate);

    order.amount = totalAmount;

    if (totalAmount === 0) {
      order.status = 'paid';
      await order.save();
      return res.status(201).json({
        success: true,
        message: "Order placed successfully (Free Room Service)",
        order
      });
    }

    await order.save();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(totalAmount * 100),
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
          type: "RESTAURANT_ORDER",
          order_id: order.id.toString()
        },
      },
      {
        idempotencyKey: `order_${order.id}`,
      }
    );

    await order.update({ stripeSessionId: paymentIntent.id });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      order
    });

  } catch (err) {
    console.error("Error in createRestaurantOrder:", err);
    next(err);
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
              console.log(` Real-time Socket notification sent to User: ${currentUserId}`);
            }
          }
        } catch (socketErr) {
          console.error(" Notification/Socket failed, but Booking is SAFE:", socketErr.message);
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
    console.error(" Webhook processing error:", error);
    if (wt && !wt.finished) {
      try {
        await wt.rollback();
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr.message);
      }
    }
  }
};


export const stripeRestaurantWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_RESTAURANT_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.json({ received: true });

  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return;
  }

  const paymentIntent = event.data.object;

  if (paymentIntent.metadata?.type === "RESTAURANT_ORDER") {
    const orderId = paymentIntent.metadata.order_id;
    if (!orderId) return;

    try {
      if (event.type === "payment_intent.succeeded") {
        await Order.update(
          { status: 'paid' },
          { where: { id: orderId } }
        );
        console.log(`📡 [Restaurant Webhook] Order ${orderId} successfully marked as PAID.`);
      } else if (event.type === "payment_intent.payment_failed") {
        await Order.update(
          { status: 'cancelled' },
          { where: { id: orderId } }
        );
        console.log(`[Restaurant Webhook] Order ${orderId} marked as CANCELLED.`);
      }
    } catch (dbErr) {
      console.error(" Database Error in Restaurant Webhook:", dbErr);
    }
  }
};


