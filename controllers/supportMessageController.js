import { Op } from 'sequelize';
import SupportMessage from "../models/SupportMessage.js";
import Hotels from "../models/Hotels.js";
import Restaurant from "../models/Restaurant.js";

export const getBusinessChats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const messages = await SupportMessage.findAll({
      where: { sender_id: userId },
      include: [
        { model: Hotels, as: 'hotel', attributes: ['id', 'name'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      chats: messages
    });
  } catch (err) {
    next(err);
  }
};

export const businessSocketHandler = (io, socket) => {
  socket.on('join_business_chat', (data) => {
    const { hotel_id, restaurant_id } = data;
    if (hotel_id) socket.join(`hotel_chat_${hotel_id}`);
    if (restaurant_id) socket.join(`restaurant_chat_${restaurant_id}`);
  });

  socket.on('send_support_message', async (data) => {
    const { sender_id, hotel_id, restaurant_id, message } = data;
    try {
      const newMessage = await SupportMessage.create({
        sender_id,
        hotel_id: hotel_id || null,
        restaurant_id: restaurant_id || null,
        message
      });

      if (hotel_id) {
        io.to(`hotel_chat_${hotel_id}`).emit('receive_support_message', newMessage);
      }
      if (restaurant_id) {
        io.to(`restaurant_chat_${restaurant_id}`).emit('receive_support_message', newMessage);
      }
    } catch (err) {
      console.error(err);
    }
  });
};
