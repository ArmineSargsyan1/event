import {Op} from "sequelize";
import Message from "../models/Message.js";
import Socket from "../services/Socket.js";
import User from "../models/User.js";


export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text, sharedPostId } = req.body;
    const myId = req.userId;

    const newMessage = await Message.create({
      senderId: myId,
      receiverId,
      text,
      sharedPostId: sharedPostId || null,
      isRead: false,
      deletedBySender: false,
      deletedByReceiver: false
    });

    const sender = await User.findByPk(myId, {
      attributes: ['id', 'user_name', 'userName', 'profile_picture', 'profilePicture']
    });

    const senderName = sender ? (sender.user_name || sender.userName) : "user";
    const senderPic = sender ? (sender.profile_picture || sender.profilePicture) : null;

    const notificationPayload = {
      id: `msg_${newMessage.id}`,
      userId: receiverId,
      senderId: myId,
      type: 'MESSAGE',
      message: text.length > 30 ? `${text.substring(0, 30)}...` : text,
      isRead: false,
      createdAt: new Date(),
      comment: {
        content: text
      },
      sender: {
        id: myId,
        userName: senderName,
        profilePicture: senderPic
      }
    };

    try {
      await Socket.emit(
        `user_${receiverId}`,
        { event: 'new_notification', data: notificationPayload },
        'new_message'
      );

      await Socket.emit(
        `user_${receiverId}`,
        { event: 'new_message', data: newMessage },
        'new_message'
      );

      await Socket.emit(
        `user_${myId}`,
        { event: 'new_message', data: newMessage },
        'new_message'
      );
    } catch (socketError) {
      console.error("Socket error in sendMessage:", socketError);
    }

    return res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};



export const getMessages = async (req, res) => {
  try {
    const { contactId } = req.params;
    // const  contactId = 8
    const { page = 1, limit = 20 } = req.query;
    const myId = req.userId;
    // const myId = 20;
    console.log(contactId, myId,8888888888888)
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    await Message.update(
      { isRead: true },
      {
        where: { senderId: contactId, receiverId: myId, isRead: false }
      }
    );

    const [totalCount, messages, contactUser] = await Promise.all([
      Message.count({
        where: {
          [Op.or]: [
            { senderId: myId, receiverId: contactId, deletedBySender: false },
            { senderId: contactId, receiverId: myId, deletedByReceiver: false }
          ]
        }
      }),
      Message.findAll({
        where: {
          [Op.or]: [
            { senderId: myId, receiverId: contactId, deletedBySender: false },
            { senderId: contactId, receiverId: myId, deletedByReceiver: false }
          ]
        },
        attributes: ['id', 'senderId', 'receiverId', 'text', 'isRead', 'sharedPostId', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }),
      User.findByPk(contactId, {
        attributes: ['id', 'user_name', 'userName', 'profile_picture', 'profilePicture']
      })
    ]);

    const contactInfo = contactUser ? {
      id: contactUser.id,
      userName: contactUser.user_name || contactUser.userName,
      profilePicture: contactUser.profile_picture || contactUser.profilePicture
    } : null;

    return res.status(200).json({
      success: true,
      contact: contactInfo,
      messages,
      pagination: {
        totalItems: totalCount,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
        hasNextPage: page * parseInt(limit, 10) < totalCount
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




export const getConversations = async (req, res) => {
  try {
    const myId = req.userId;
    const { query } = req.query;

    if (query && query.trim() !== '') {
      const contacts = await User.findAll({
        where: {
          id: { [Op.ne]: myId },
          userName: { [Op.like]: `%${query.trim()}%` }
        },
        attributes: ['id', 'userName', 'profilePicture'],
        limit: 20
      });
      return res.status(200).json({ success: true, contacts });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, deletedBySender: false },
          { receiverId: myId, deletedByReceiver: false }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.senderId !== myId) contactIds.add(msg.senderId);
      if (msg.receiverId !== myId) contactIds.add(msg.receiverId);
    });

    const contacts = await User.findAll({
      where: { id: Array.from(contactIds) },
      attributes: ['id', 'userName', 'profilePicture']
    });

    return res.status(200).json({ success: true, contacts });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.userId;

    const message = await Message.findOne({ where: { id, senderId: myId } });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found or unauthorized" });
    }

    await message.destroy();
    return res.status(200).json({ success: true, message: "The message was deleted for everyone." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { contactId } = req.params;
    const myId = req.userId;

    await Message.update(
      { deletedBySender: true },
      { where: { senderId: myId, receiverId: contactId } }
    );

    await Message.update(
      { deletedByReceiver: true },
      { where: { senderId: contactId, receiverId: myId } }
    );

    return res.status(200).json({
      success: true, message: "The chat was cleared by you"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
