import moment from 'moment';
import {Socket} from "socket.io";
import Restaurant from "../models/Restaurant.js";
import Reservation from "../models/Reservation.js";
import Notification from "../models/Notification.js";
import {Op} from "sequelize";

export const createReservation = async (req, res, next) => {
  try {
    const { restaurantId, reservationDate, guestsCount, comment, bookingId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (restaurant.ownerId === userId) {
      return res.status(400).json({ success: false, message: "You cannot make reservations at your own establishment" });
    }

    const newReservation = await Reservation.create({
      restaurant_id: parseInt(restaurantId),
      user_id: userId,
      booking_id: bookingId ? parseInt(bookingId) : null,
      reservation_date: new Date(reservationDate),
      guests_count: parseInt(guestsCount) || 1,
      comment: comment || null,
      status: 'pending'
    });

    const displayDate = moment(reservationDate).format('LLL');
    const dbNotification = await Notification.create({
      userId: restaurant.ownerId,
      type: 'NEW_TABLE_RESERVATION',
      message: `New table reservation in "${restaurant.name}" on ${displayDate}`,
      isRead: false
    });

    try {
      if (typeof Socket !== 'undefined' && Socket.emit) {
        await Socket.emit(
          `user_${restaurant.ownerId}`, {
            event: 'new_notification',
            data: dbNotification.toJSON()
          },
          'new_notification'
        );
        console.log(`Real-time Socket notification sent to Restaurant Owner: ${restaurant.ownerId}`);
      }
    } catch (socketErr) {
      console.error(" Socket failed, but Reservation is safe inside DB:", socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Table reserved successfully! Awaiting restaurant confirmation.",
      reservation: newReservation
    });

  } catch (err) {
    console.error("Reservation creation error:", err);
    next(err);
  }
};


export const getMyReservations = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = { user_id: userId };

    if (status && status !== "all") {
      whereCondition.status = status;
    }

    const now = new Date();
    if (type === "upcoming") {
      whereCondition.reservation_date = { [Op.gte]: now };
    } else if (type === "past") {
      whereCondition.reservation_date = { [Op.lt]: now };
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where: whereCondition,
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'address', 'image']
      }],
      order: [['reservation_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const formattedReservations = rows.map(resObj => {
      const resDate = moment(resObj.reservation_date);
      const rightNow = moment();

      const isStatusCancellable = ['pending', 'confirmed'].includes(resObj.status);
      const isTimeCancellable = resDate.diff(rightNow, 'hours') >= 24;
      const canCancel = isStatusCancellable && isTimeCancellable;
      const canReview = resObj.status === 'confirmed' && rightNow.isAfter(resDate);

      return {
        id: resObj.id,
        status: resObj.status,
        date: resDate.format("YYYY-MM-DD - HH:mm"),
        guests: resObj.guests_count,
        comment: resObj.comment,
        canCancel,
        canReview,
        restaurant: resObj.restaurant ? {
          id: resObj.restaurant.id,
          name: resObj.restaurant.name,
          image: resObj.restaurant.image
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedReservations,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("Get reservations error:", err);
    next(err);
  }
};


export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const resObj = await Reservation.findOne({
      where: { id, user_id: userId }
    });

    if (!resObj) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    await resObj.update({ status: 'cancelled' });

    return res.status(200).json({
      success: true,
      message: "Reservation successfully cancelled."
    });
  } catch (err) {
    console.error("Cancel reservation error:", err);
    next(err);
  }
};
