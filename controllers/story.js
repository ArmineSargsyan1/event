import {Op, Sequelize} from 'sequelize';
import Story from "../models/Story.js";
import User from "../models/User.js";
import StoryComment from "../models/StoryComment.js";
import StoryView from "../models/StoryView.js";
import StoryLike from "../models/StoryLike.js";
import StoryMention from "../models/StoryMention.js";
import sequelize from "../clients/db.sequelize.mysql.js";
import Message from "../models/Message.js";
import {cloudinary} from "../middlewares/upload.js";
import FileHelper from "../services/Utils.js";
import Follower from "../models/Follower.js";
import Notification from "../models/Notification.js";
import Socket from "../services/Socket.js";



export const sendAutoMessage = async (senderId, receiverId, text, transaction) => {
  if (String(senderId) === String(receiverId)) return;
  await Message.create({

    senderId,
    receiverId,
    text,
    isRead: false
  }, {transaction});
};

export const createStory = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Image or video is missing." });

  const t = await sequelize.transaction();
  try {
    const { caption, mentionedUserIds, lat, lng, locationName, musicTrackId } = req.body;

    const safeParse = (data) => {
      try {
        return typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        return data;
      }
    };

    const userIds = mentionedUserIds ? [].concat(safeParse(mentionedUserIds)) : [];

    const mediaUrl = req.file.path || req.file.secure_url;
    const mediaPublicId = req.file.filename || req.file.public_id;

    const isVideo = req.file.mimetype
      ? req.file.mimetype.startsWith('video')
      : (req.file.resource_type === 'video');

    const newStory = await Story.create({
      userId: req.userId,
      mediaUrl,
      mediaPublicId,
      mediaType: isVideo ? 'video' : 'image',
      caption: caption || '',
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
      locationName: locationName || null,
      musicTrackId: musicTrackId || null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }, { transaction: t });

    if (userIds.length > 0) {
      const author = await User.findByPk(req.userId, { transaction: t });
      await Promise.all(userIds.map(id => {
        if (!id) return;
        return Promise.all([
          StoryMention.create({ storyId: newStory.id, userId: id }, { transaction: t }),
          sendAutoMessage(req.userId, id, `${author.userName} mentioned you in their story.`, t)
        ]);
      }));
    }

    await t.commit();
    res.status(201).json({ success: true, message: "story created", story: newStory });
  } catch (error) {
    console.log(error)
    if (t) await t.rollback();
    res.status(500).json({ error: error.message });
  }
};



export const getMyStories = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const followings = await Follower.findAll({
      where: { followerId: currentUserId },
      attributes: ['followingId']
    });

    const allowedUserIds = followings.map(f => f.followingId);
    allowedUserIds.push(currentUserId);

    const stories = await Story.findAll({
      where: {
        userId: { [Op.in]: allowedUserIds },
        expiresAt: { [Op.gt]: new Date() }
      },
      attributes: [
        'id', 'userId', 'mediaUrl', 'mediaType', 'caption', 'locationName', 'musicTrackId', 'createdAt', 'updatedAt',
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM story_view WHERE story_view.storyId = Story.id)`),
          'viewCount'
        ],
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM story_like WHERE story_like.storyId = Story.id)`),
          'likesCount'
        ],
        [
          Sequelize.literal(`EXISTS (
        SELECT 1 FROM story_view 
        WHERE story_view.storyId = Story.id 
        AND story_view.userId = ${currentUserId ? currentUserId : 'NULL'}
      )`),
          'isSeen'
        ],
        [
          Sequelize.literal(`EXISTS (
        SELECT 1 FROM story_like 
        WHERE story_like.storyId = Story.id 
        AND story_like.userId = ${currentUserId ? currentUserId : 'NULL'}
      )`),
          'isLiked'
        ]
      ],
      include: [{ model: User, as: 'author', attributes: ['userName', 'profilePicture'] }],
      order: [['createdAt', 'ASC']]
    });


    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const stories = await Story.findAll({
      where: {
        userId: userId,
        expiresAt: { [Op.gt]: new Date() }
      },
      attributes: [
        'id', 'userId', 'mediaUrl', 'mediaType', 'caption', 'locationName', 'musicTrackId', 'createdAt', 'updatedAt',
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM story_view WHERE story_view.storyId = Story.id)`),
          'viewCount'
        ],
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM story_like WHERE story_like.storyId = Story.id)`),
          'likesCount'
        ],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM story_view 
            WHERE story_view.storyId = Story.id 
            AND story_view.userId = ${currentUserId ? currentUserId : 'NULL'}
          )`),
          'isSeen'
        ],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM story_like 
            WHERE story_like.storyId = Story.id 
            AND story_like.userId = ${currentUserId ? currentUserId : 'NULL'}
          )`),
          'isLiked'
        ]
      ],
      include: [{ model: User, as: 'author', attributes: ['userName', 'profilePicture'] }],
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json(stories);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const story = await Story.findByPk(id);

    if (!story) {
      return res.status(404).json({ error: "story not found" });
    }

    if (String(story.userId) !== String(userId)) {
      return res.status(403).json({ error: "you can't delete this story" });
    }

    if (story.mediaPublicId) {
      try {
        await cloudinary.uploader.destroy(story.mediaPublicId, {
          resource_type: story.mediaType
        });
        console.log(`Cloudinary file deleted: ${story.mediaPublicId}`);
      } catch (cloudinaryError) {
        console.error("Failed to delete file from Cloudinary:", cloudinaryError);
      }
    }

    await story.destroy();

    res.status(200).json({ success: true, message: "story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ error: "error deleting the story" });
  }
};


export const toggleLikeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.userId;

    const story = await Story.findByPk(id);
    if (!story) return res.status(404).json({ error: "Story not found" });

    const liker = await User.findByPk(myId, { attributes: ['id', 'userName', 'profilePicture'] });

    const existingLike = await StoryLike.findOne({
      where: { storyId: id, userId: myId }
    });

    if (existingLike) {
      await existingLike.destroy();

      await Notification.destroy({
        where: { userId: story.userId, senderId: myId, type: 'STORY_LIKE' }
      });

      return res.status(200).json({ liked: false });
    } else {
      await StoryLike.create({
        storyId: id,
        userId: myId
      });

      if (String(story.userId) !== String(myId)) {
        const savedNotification = await Notification.create({
          userId: story.userId,
          senderId: myId,
          type: 'STORY_LIKE',
          message: 'liked your story.',
          isRead: false
        });

        const notificationPayload = {
          ...savedNotification.toJSON(),
          sender: liker
        };

        await Socket.emit(
          `user_${story.userId}`,
          { event: 'new_message', data: { storyId: id, liked: true }, notification: notificationPayload },
          'new_message'
        );
      }

      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.userId;
    // const viewerId = 24;
    const story = await Story.findByPk(id);

    if (!story) return res.status(404).json({ error: "Story not found" });

    if (String(story.userId) === String(viewerId)) {
      return res.status(200).json({ message: "Own story" });
    }

    const [view, created] = await StoryView.findOrCreate({
      where: { storyId: id, userId: viewerId }
    });

    if (created) {
      try {
        const viewer = await User.findByPk(viewerId, { attributes: ['id', 'userName', 'profilePicture'] });

        const savedNotification = await Notification.create({
          userId: story.userId,
          senderId: viewerId,
          type: 'STORY_VIEW',
          message: 'viewed your story.',
          isRead: false
        });

        const notificationPayload = {
          ...savedNotification.toJSON(),
          sender: viewer
        };

        await Socket.emit(
          `user_${story.userId}`,
          { event: 'new_story_view', data: { storyId: id, viewer: viewer }, notification: notificationPayload },
          'new_story_view'
        );
      } catch (e) {
        console.error("Error sending socket story view notification:", e);
      }
    }

    return res.status(200).json({ message: "View recorded" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};




export const replyToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    // const myId = req.userId;
    const myId = 24;

    const story = await Story.findByPk(id);
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    const newMessage = await Message.create({
      senderId: myId,
      receiverId: story.userId,
      text: `Replied to your story: "${text}"`,
      isRead: false
    });

    const savedNotification = await Notification.create({
      userId: story.userId,
      senderId: myId,
      type: 'STORY_REPLY',
      message: `replied to your story: "${text}"`,
      isRead: false
    });

    const notificationPayload = {
      ...savedNotification.toJSON(),
      sender: await User.findByPk(myId, { attributes: ['id', 'userName', 'profilePicture'] })
    };

    await Socket.emit(
      `user_${story.userId}`,
      { event: 'new_message', data: newMessage, notification: notificationPayload },
      'new_message'
    );

    return res.status(200).json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};





export const getStoryStats = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findByPk(id);

    if (!story || String(story.userId) !== String(req.userId)) {
      return res.status(403).json({ error: "Unavailable data" });
    }

    const viewers = await StoryView.findAndCountAll({
      where: { storyId: id },
      include: [{ model: User, as: 'viewer', attributes: ['userName', 'profilePicture'] }]
    });

    const likes = await StoryLike.findAndCountAll({
      where: { storyId: id },
      include: [{ model: User, as: 'user', attributes: ['userName', 'profilePicture'] }]
    });
    res.status(200).json({
      viewCount: viewers.count,
      viewers: viewers.rows,
      likesCount: likes.count,
      likes: likes.rows,});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
