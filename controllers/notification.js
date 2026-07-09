import Hotels from "../models/Hotels.js";
import User from "../models/User.js";
import HotelPhotos from "../models/HotelPhotos.js";
import Notification from "../models/Notification.js";
import PostComment from "../models/PostComment.js";


export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;

    const notifications = await Notification.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'userName', 'profilePicture']
        },
        {
          model: Hotels,
          as: 'hotel',
          attributes: ['id', 'name'],
          required: false,
          include: [
            {
              model: HotelPhotos,
              as: 'images',
              attributes: ['url', 'image_url'],
              limit: 1,
              required: false
            }
          ]
        },
        {
          model: PostComment,
          as: 'comment',
          attributes: ['id', 'content'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};


export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.userId;

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.status(200).json({ success: true, message: 'successfully read' });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const deletedCount = await Notification.destroy({
      where: {
        id: id,
        userId: userId
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or you don't have permission to delete it"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    next(error);
  }
};
