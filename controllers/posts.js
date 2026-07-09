import sequelize from "../clients/db.sequelize.mysql.js";
// import PostComment from "../models/PostComment.js";
import User from "../models/User.js";
import FileHelper from "../services/Utils.js";
import Post from "../models/Post.js";
import PostLike from "../models/PostLike.js";
import PostComment from "../models/PostComment.js";
import PostTag from "../models/PostTag.js";
import Notification from "../models/Notification.js";
import Socket from "../services/Socket.js";
import CommentLike from "../models/CommentLike.js";
import PostCommentReply from "../models/PostCommentReply.js";
import Message from "../models/Message.js";

export const createPost = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    let { caption, location, latitude, longitude, mentions, musicTrack } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image or video is required." });
    }

    if (musicTrack && typeof musicTrack === 'string') {
      try {
        musicTrack = JSON.parse(musicTrack);
      } catch (e) {
        console.error("MusicTrack parsing error:", e);
      }
    }

    let mentionsArray = [];
    if (mentions) {
      if (typeof mentions === 'string') {
        try {
          mentionsArray = JSON.parse(mentions);
        } catch (e) {
          mentionsArray = [mentions];
        }
      } else {
        mentionsArray = Array.isArray(mentions) ? mentions : [mentions];
      }
    }

    const mediaUrl = req.file.path || req.file.secure_url;

    const isVideo = req.file.mimetype
      ? req.file.mimetype.startsWith('video')
      : req.file.resource_type === 'video';

    const mediaType = isVideo ? 'video' : 'image';

    const post = await Post.create({
      userId: req.userId,
      mediaUrl,
      mediaType,
      caption,
      location,
      latitude,
      longitude,
      musicTrack,
    }, { transaction: t });

    if (mentionsArray.length > 0) {
      const author = await User.findByPk(req.userId, { transaction: t });

      for (const uId of mentionsArray) {
        if (String(uId) !== String(req.userId)) {
          await Notification.create({
            userId: uId,
            senderId: req.userId,
            type: 'MENTION',
            message: `${author.userName} mentioned you in their post.`,
            link: `/posts/${post.id}`,
            isRead: false
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.status(201).json({success: true, message: "Publishing successful", post });
  } catch (error) {
    console.error(error)
    if (t) await t.rollback();
    next(error);
  }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      limit,
      offset,
      attributes: FileHelper.getPostAttributes(),
      include: [
        {
          model: User,
          as: "author",
          attributes: ['id', 'userName', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      posts: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: count,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where: { userId },
      limit,
      offset,
      attributes: FileHelper.getPostAttributes(),
      include: [
        {
          model: User,
          as: "author",
          attributes: ['id', 'userName', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      posts: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: count,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const post = await Post.findByPk(id, {
      attributes: FileHelper.getPostAttributes(['latitude', 'longitude']),
      include: [
        {
          model: User,
          as: "author",
          attributes: ['id', 'userName', 'profilePicture']
        },
        {
          model: PostLike,
          as: "likes",
          attributes: ['id', 'userId']
        },
        {
          model: PostComment,
          as: "comments",
          required: false,
          include: [
            {
              model: User,
              as: "author",
              attributes: ['userName', 'profilePicture']
            },
            {
              model: CommentLike,
              as: "likes",
              attributes: ['id', 'userId']
            },
            {
              model: PostCommentReply,
              as: "replies",
              include: [
                {
                  model: User,
                  as: "author",
                  attributes: ['userName', 'profilePicture']
                },
                {
                  model: CommentLike,
                  as: "likes",
                  attributes: ['id', 'userId']
                }
              ]
            }
          ]
        }
      ],
      order: [
        [{ model: PostComment, as: 'comments' }, 'createdAt', 'ASC']
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postData = post.toJSON();

    postData.isLiked = postData.likes ? postData.likes.some(like => like.userId === currentUserId) : false;
    postData.likesCount = postData.likes ? postData.likes.length : 0;

    const mainCommentsCount = postData.comments ? postData.comments.length : 0;
    let repliesCount = 0;

    if (postData.comments && postData.comments.length > 0) {
      postData.comments.forEach(comment => {
        comment.isLiked = comment.likes ? comment.likes.some(l => l.userId === currentUserId) : false;
        comment.likesCount = comment.likes ? comment.likes.length : 0;

        if (comment.replies && comment.replies.length > 0) {
          repliesCount += comment.replies.length; // 👈 Գումարում ենք ռեպլայների քանակը
          comment.replies.forEach(reply => {
            reply.isLiked = reply.likes ? reply.likes.some(l => l.userId === currentUserId) : false;
            reply.likesCount = reply.likes ? reply.likes.length : 0;
          });
        }
      });
    }

    postData.commentsCount = mainCommentsCount + repliesCount;

    if (post.commentsCount !== postData.commentsCount) {
      await Post.update({ commentsCount: postData.commentsCount }, { where: { id } });
    }

    res.status(200).json({ success: true, data: postData });
  } catch (error) {
    next(error);
  }
};


// export const getPostComments = async (req, res, next) => {
//   try {
//     const { postId } = req.params;
//
//     const comments = await PostComment.findAll({
//       where: { postId },
//       include: [
//         {
//           model: User,
//           as: 'author',
//           attributes: ['id', 'userName', 'profilePicture']
//         }
//       ],
//       order: [['createdAt', 'ASC']]
//     });
//
//     res.status(200).json({
//       success: true,
//       data: comments
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// export const updatePost = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { caption, location } = req.body;
//
//     const post = await Post.findOne({ where: { id, userId: req.userId } });
//
//     if (!post) {
//       return res.status(403).json({ error: 'Permission denied or post does not exist.' });
//     }
//
//     await post.update({ caption, location });
//
//     const updatedPost = await Post.findByPk(id, {
//       attributes: FileHelper.getPostAttributes()
//     });
//
//     res.json({
//       success: true,
//       message: 'post updated successfully.',
//       post: updatedPost
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deletePost = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//
//     // Գտնում ենք պոստը և համոզվում, որ հենց այս օգտատիրոջն է պատկանում
//     const post = await Post.findOne({ where: { id, userId: req.userId } });
//
//     if (!post) {
//       return res.status(403).json({ error: 'Permission denied or post does not exist.' });
//     }
//
//     // 🔥 ՈՒՂՂՎԱԾ Է CLOUDINARY-Ի ՀԱՄԱՐ
//     if (post.mediaUrl && post.mediaUrl.startsWith('http')) {
//       try {
//         // 1. Հղումից առանձնացնում ենք public_id-ն (օրինակ՝ "posts/posts_123456_uuid")
//         // Այս կոդը հեռացնում է մինչև թղթապանակի անունը եղած հասցեն և վերջի ֆորմատը (.jpg, .mp4)
//         const urlParts = post.mediaUrl.split('/');
//         const folderName = urlParts[urlParts.length - 2]; // "posts"
//         const fileNameWithExt = urlParts[urlParts.length - 1]; // "posts_123456_uuid.jpg"
//         const fileName = fileNameWithExt.split('.')[0]; // "posts_123456_uuid"
//
//         const publicId = `${folderName}/${fileName}`; // "posts/posts_123456_uuid"
//
//         // 2. Ջնջում ենք ֆայլը Cloudinary-ից (հաշվի առնելով resource_type-ը)
//         const isVideo = post.mediaType === 'video';
//         await cloudinary.uploader.destroy(publicId, {
//           resource_type: isVideo ? 'video' : 'image'
//         });
//
//         console.log(`Successfully deleted from Cloudinary: ${publicId}`);
//       } catch (cloudinaryError) {
//         console.error("Failed to delete media from Cloudinary:", cloudinaryError);
//       }
//     }
//
//     // Ջնջում ենք պոստը տվյալների բազայից
//     await post.destroy();
//
//     res.json({ success: true, message: 'Post successfully deleted' });
//   } catch (error) {
//     next(error);
//   }
// };


export const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingLike = await PostLike.findOne({ where: { postId, userId } });
    let isLiked = false;

    if (existingLike) {
      await existingLike.destroy();
      isLiked = false;
    } else {
      await PostLike.create({ postId, userId });
      isLiked = true;
    }

    const actualLikesCount = await PostLike.count({ where: { postId } });

    post.likesCount = actualLikesCount;
    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? "Post liked successfully" : "Post unliked successfully",
      isLiked: isLiked,
      likesCount: actualLikesCount
    });

  } catch (error) {
    next(error);
  }
};

// // interaction

export const addPostTags = async (req, res, next) => {
  console.log(req.body)
  try {
    const { postId } = req.params;
    const { tags } = req.body;
    const senderId = req.userId;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ message: "Tags are required and should be an array" });
    }

    const sender = await User.findByPk(senderId, { attributes: ['userName'] });
    const senderName = sender ? sender.userName : "User";

    const tagsToCreate = tags.map(tag => ({
      postId: postId,
      taggedUserId: tag.taggedUserId,
      x: tag.x ?? 0,
      y: tag.y ?? 0
    }));

    const createdTags = await PostTag.bulkCreate(tagsToCreate);

    const notifications = tags.map(tag => ({
      userId: tag.taggedUserId,
      senderId: senderId,
      type: 'TAG',
      postId: postId,
      message: `${senderName} tagged you in their post.`,
      isRead: false
    }));

    await Notification.bulkCreate(notifications);

    res.status(201).json({ success: true, data: createdTags });
  } catch (error) {
    console.error("---- MySQL ERROR MESSAGE:", error.parent?.sqlMessage);
    console.error("-----SQL QUERY:", error.parent?.sql);
    next(error);
  }
};



export const handleMentions = async (text, postId, senderId, commentId = null) => {
  try {
    const mentionRegex = /@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const usernames = matches.map(match => match[1]);

    if (usernames.length === 0) return;

    const mentionedUsers = await User.findAll({
      where: { userName: usernames }
    });

    const sender = await User.findByPk(senderId, { attributes: ['userName'] });
    const senderName = sender ? sender.userName : "Someone";

    const notificationPayloads = mentionedUsers
      .filter(user => String(user.id) !== String(senderId))
      .map(user => ({
        userId: user.id,
        senderId: senderId,
        postId: postId,
        commentId: commentId,
        type: 'MENTION',
        message: `mentioned you in a comment.`,
        isRead: false
      }));

    if (notificationPayloads.length === 0) return;

    const createdNotifications = await Notification.bulkCreate(notificationPayloads);

    try {
      for (const notification of createdNotifications) {
        await Socket.emit(`user_${notification.userId}`, {
          event: 'new_notification',
          data: {
            ...notification.toJSON(),
            sender: {
              id: senderId,
              userName: senderName
            }
          }
        });
      }
    } catch (socketError) {
      console.error("Socket broadcast error in handleMentions:", socketError);
    }

  } catch (error) {
    console.error("Error in handleMentions:", error);
  }
};


export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    // const userId = 9;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const sender = await User.findByPk(userId, { attributes: ['userName', 'profilePicture'] });
    const senderName = sender ? sender.userName : "user";
    const senderPic = sender ? sender.profilePicture : null;

    const newComment = await PostComment.create({
      postId,
      userId,
      content: content.trim()
    });

    const post = await Post.findByPk(postId);

    let notification = null;
    if (post && post.userId !== userId) {
      notification = await Notification.create({
        userId: post.userId,
        senderId: userId,
        type: 'COMMENT',
        postId: postId,
        commentId: newComment.id,
        message: `**${senderName}** commented on your post`,
        isRead: false
      });
    }

    await handleMentions(content, postId, userId, newComment.id);

    const commentWithAuthor = await PostComment.findByPk(newComment.id, {
      include: [{
        model: User,
        as: "author",
        attributes: ['userName', 'profilePicture']
      }]
    });

    const commentData = commentWithAuthor.toJSON();
    commentData.likes = [];
    commentData.isLiked = false;
    commentData.likesCount = 0;
    commentData.replies = [];

    try {
      if (notification) {
        const notificationPayload = {
          ...notification.toJSON(),
          sender: {
            id: userId,
            userName: senderName,
            profilePicture: senderPic
          },
          comment: {
            id: newComment.id,
            content: newComment.content
          }
        };

        await Socket.emit(
          `user_${post.userId}`,
          { event: 'new_notification', data: notificationPayload },
          'new_message'
        );

        console.log(`📡 Live comment notification dispatched to user: ${post.userId}`);
      }

      await Socket.emit(`user_${post.userId}`, commentData, `new_comment_post_${postId}`);

    } catch (e) {
      console.error("Socket error in addComment:", e);
    }

    if (post) {
      await post.increment('commentsCount', { by: 1 });
      await post.reload();
    }

    res.status(201).json({
      success: true,
      data: commentData,
      commentsCount: post ? post.commentsCount : 1
    });
  } catch (error) {
    console.error("CRITICAL ADD COMMENT ERROR:", error);
    next(error);
  }
};


export const replyComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    // const userId = req.userId;
    const userId = 9;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'The answer cannot be empty.' });
    }

    const parentComment = await PostComment.findByPk(commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Parent comment not found" });
    }

    const sender = await User.findByPk(userId, { attributes: ['id', 'userName', 'profilePicture'] });
    const senderName = sender ? sender.userName : "user";
    const senderPic = sender ? sender.profilePicture : null;

    const reply = await PostCommentReply.create({
      content: content.trim(),
      userId,
      commentId: commentId,
    });

    let notification = null;
    if (parentComment.userId !== userId) {
      notification = await Notification.create({
        userId: parentComment.userId,
        senderId: userId,
        type: 'COMMENT_REPLY',
        postId: parentComment.postId,
        commentId: commentId,
        message: `**${senderName}** replied to your comment`,
        isRead: false
      });
    }

    const replyWithAuthor = await PostCommentReply.findByPk(reply.id, {
      include: [{
        model: User,
        as: "author",
        attributes: ['userName', 'profilePicture']
      }]
    });

    const replyData = {
      ...replyWithAuthor.toJSON(),
      likes: [],
      isLiked: false,
      likesCount: 0,
      replies: []
    };

    try {
      if (notification) {
        const notificationPayload = {
          ...notification.toJSON(),
          sender: {
            id: userId,
            userName: senderName,
            profilePicture: senderPic
          },
          comment: {
            id: reply.id,
            content: reply.content
          }
        };

        await Socket.emit(
          `user_${parentComment.userId}`,
          { event: 'new_notification', data: notificationPayload },
          'new_message'
        );
      }

      await Socket.emit(`user_${parentComment.userId}_new_reply_post_${parentComment.postId}`, replyData);

    } catch (socketError) {
      console.error("Socket error in replyComment:", socketError);
    }

    const post = await Post.findByPk(parentComment.postId);
    if (post) {
      await post.increment('commentsCount', { by: 1 });
      await post.reload();
    }

    res.status(201).json({
      success: true,
      data: replyData,
      commentsCount: post ? post.commentsCount : 1
    });
  } catch (error) {
    next(error);
  }
};


export const toggleCommentLike = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    // const userId = req.userId;
    const userId = 20;

    let commentOwnerId = null;
    let targetPostId = null;
    let commentType = 'COMMENT';

    let comment = await PostComment.findByPk(commentId);

    if (comment) {
      commentOwnerId = comment.user_id || comment.userId;
      targetPostId = comment.post_id || comment.postId;
      commentType = 'COMMENT';
    } else {
      const reply = await PostCommentReply.findByPk(commentId);
      if (!reply) {
        return res.status(404).json({ success: false, message: "Comment or reply not found" });
      }
      commentOwnerId = reply.user_id || reply.userId;
      commentType = 'REPLY';

      const parentCommentId = reply.comment_id || reply.commentId;
      const mainComment = await PostComment.findByPk(parentCommentId);
      targetPostId = mainComment ? (mainComment.post_id || mainComment.postId) : null;
    }

    const existingLike = await CommentLike.findOne({ where: { commentId, userId } });

    if (existingLike) {
      await existingLike.destroy();

      if (commentOwnerId) {
        await Notification.destroy({
          where: {
            userId: commentOwnerId,
            senderId: userId,
            type: 'COMMENT_LIKE',
          }
        });
      }

      const likesCount = await CommentLike.count({ where: { commentId } });

      return res.status(200).json({
        success: true,
        message: "Comment like removed",
        liked: false,
        likesCount
      });
    }

    const sender = await User.findByPk(userId);
    const senderName = sender ? (sender.user_name || sender.userName) : "user";
    const senderPic = sender ? (sender.profile_picture || sender.profilePicture) : null;

    await CommentLike.create({ commentId, userId, commentType });

    let newNotification = null;
    if (commentOwnerId && commentOwnerId !== userId) {
      newNotification = await Notification.create({
        userId: commentOwnerId,
        senderId: userId,
        type: 'COMMENT_LIKE',
        postId: targetPostId,
        message: `**${senderName}** liked your comment`,
        isRead: false
      });
    }

    try {
      if (newNotification && commentOwnerId) {
        const notificationPayload = {
          ...newNotification.toJSON(),
          sender: {
            id: userId,
            userName: senderName,
            profilePicture: senderPic
          }
        };

        await Socket.emit(
          `user_${commentOwnerId}`,
          { event: 'new_notification', data: notificationPayload },
          'new_message'
        );
      }
    } catch (socketError) {
      console.error("Socket error in toggleCommentLike:", socketError);
    }

    const likesCount = await CommentLike.count({ where: { commentId } });

    return res.status(201).json({
      success: true,
      message: "Comment liked successfully",
      liked: true,
      likesCount
    });

  } catch (error) {
    console.error("CRITICAL TOGGLE COMMENT LIKE ERROR:", error);
    next(error);
  }
};





export const sharePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    // const { receiverId, comment } = req.body;
    // const senderId = req.userId;

    const senderId = 20;
    const  receiverId  = 8;
    const { comment } = req.body;

    const shareMessage = await Message.create({
      senderId,
      receiverId,
      text: comment || '',
      sharedPostId: postId,
      postId: postId,
    });

    const [post, sender] = await Promise.all([
      Post.findByPk(postId, {
        attributes: ['id', 'userId', 'mediaUrl', 'mediaType', 'caption', 'createdAt']
      }),
      User.findByPk(senderId, {
        attributes: ['id', 'user_name', 'userName', 'profile_picture', 'profilePicture']
      })
    ]);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const senderName = sender ? (sender.user_name || sender.userName) : "user";
    const senderPic = sender ? (sender.profile_picture || sender.profilePicture) : null;

    const [likesCount, commentsCount] = await Promise.all([
      PostLike.count({ where: { postId: postId } }),
      PostComment.count({ where: { postId: postId } })
    ]);

    const postData = {
      ...post.toJSON(),
      likesCount,
      commentsCount
    };


    const formattedMessage = {
      ...shareMessage.toJSON(),
      sharedPost: postData
    };

    let newNotification = null;
    if (receiverId !== senderId) {
      newNotification = await Notification.create({
        userId: receiverId,
        senderId: senderId,
        type: 'SHARE_POST',
        postId: postId,
        message: `shared a post with you`,
        isRead: false
      });
    }

    const notificationPayload = {
      ...newNotification.toJSON(),
      sender: {
        id: senderId,
        userName: senderName,
        profilePicture: senderPic
      }
    };


    try {
      if (newNotification) {

        await Socket.emit(
          `user_${receiverId}`,
          {
            event: 'new_notification',
            data: notificationPayload
          },
          'new_message'
        );
      }
    } catch (socketError) {
      console.error("Socket error on notification emit:", socketError);
    }

    try {
      await Socket.emit(
        `user_${receiverId}`,
        {
          event: 'new_message',
          data: formattedMessage
        },
        'new_message'
      );
    } catch (socketError) {
      console.error("Socket error on chat message emit:", socketError);
    }


    return res.status(201).json({ success: true, fullMessage: formattedMessage });
  } catch (error) {
    console.error("Error in sharePost controller:", error);
    next(error);
  }
};


export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    await CommentLike.destroy({ where: { commentId } });

    let postId = null;
    let parentId = null;
    let isReply = false;
    let totalDeletedCount = 0;
    let postUserId = null;

    const reply = await PostCommentReply.findByPk(commentId);

    if (reply) {
      if (reply.userId !== userId) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      parentId = reply.commentId;
      isReply = true;
      totalDeletedCount = 1;

      const mainComment = await PostComment.findByPk(parentId, { attributes: ['postId'] });
      postId = mainComment ? mainComment.postId : null;

      await PostCommentReply.destroy({ where: { id: commentId } });

    } else {
      const comment = await PostComment.findByPk(commentId);

      if (!comment) {
        return res.status(404).json({ success: false, message: "Comment or Reply not found" });
      }

      if (comment.userId !== userId) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      postId = comment.postId;
      parentId = null;

      const subReplies = await PostCommentReply.findAll({ where: { commentId: commentId }, attributes: ['id'] });
      const replyIds = subReplies.map(r => r.id);

      if (replyIds.length > 0) {
        await CommentLike.destroy({ where: { commentId: replyIds } });
        await PostCommentReply.destroy({ where: { commentId: commentId } });
      }

      totalDeletedCount = 1 + replyIds.length;

      await Notification.destroy({ where: { commentId: commentId } });

      await PostComment.destroy({ where: { id: commentId }, force: true });
    }

    let updatedCommentsCount = 0;
    if (postId) {
      const post = await Post.findByPk(postId);
      if (post) {
        postUserId = post.userId;
        await post.decrement('commentsCount', { by: totalDeletedCount });
        await post.reload();
        updatedCommentsCount = post.commentsCount;
      }
    }

    if (postId && postUserId) {
      try {
        await Socket.emit(
          `user_${postUserId}`,
          {
            event: 'delete_comment',
            data: {
              commentId,
              parentId,
              commentsCount: updatedCommentsCount
            }
          },
          'delete_comment'
        );
      } catch (socketError) {
        console.error("Socket error in deleteComment:", socketError);
      }
    }

    return res.status(200).json({
      success: true,
      message: isReply ? "Reply deleted successfully" : "Comment deleted successfully",
      commentsCount: updatedCommentsCount
    });

  } catch (error) {
    console.error("COMBINED DELETE ERROR:", error);
    next(error);
  }
};


