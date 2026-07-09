import Follower from "../models/Follower.js";
import Socket from "../services/Socket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {Op} from "sequelize";



export const fetchUserConnections = async (userId, myId, type, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  const isFollowers = type === 'followers';
  const countWhere = isFollowers ? { followingId: userId } : { followerId: userId };

  const totalCount = await Follower.count({ where: countWhere });

  const connectionsData = await Follower.findAll({
    where: countWhere,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  if (!connectionsData || connectionsData.length === 0) {
    return { data: [], totalCount: 0 };
  }

  const targetUserIds = connectionsData.map(c => isFollowers ? c.followerId : c.followingId);

  const users = await User.findAll({
    where: { id: { [Op.in]: targetUserIds } },
    attributes: ['id', 'userName', 'profilePicture', 'bio']
  });

  const myFollowings = await Follower.findAll({
    where: {
      followerId: myId,
      followingId: { [Op.in]: targetUserIds }
    },
    attributes: ['followingId']
  });

  const myFollowingSet = new Set(myFollowings.map(f => f.followingId));
  const userMap = new Map(users.map(u => [u.id, u.toJSON()]));

  const formattedData = targetUserIds
    .map(id => {
      const user = userMap.get(id);
      if (!user) return null;
      return {
        ...user,
        isFollowing: myFollowingSet.has(id)
      };
    })
    .filter(Boolean);

  return {
    data: formattedData,
    totalCount
  };
};

export const toggleFollow = async (req, res) => {
  try {
    const {followingId} = req.body;
    const followerId = req.userId;

    if (String(followerId) === String(followingId)) {
      return res.status(400).json({message: 'You cannot follow yourself'});
    }

    const exitingFollow = await Follower.findOne({where: {followerId, followingId}});

    if (exitingFollow) {
      await exitingFollow.destroy();

      try {
        await Socket.emit(
          `user_${followingId}`,
          {
            event: 'delete_comment',
            data: { commentId: `follow_${followerId}_${followingId}` }
          },
          'delete_comment'
        );
      } catch (err) {}

      // Ջնջում ենք հին follow ծանուցումը բազայից
      await Notification.destroy({
        where: {userId: followingId, senderId: followerId, type: 'follow'}
      });

      return res.json({success: true, status: 'unfollowed'});

    } else {
      await Follower.create({followerId, followingId});

      const me = await User.findByPk(followerId, {
        attributes: ['id', 'userName', 'profilePicture']
      });

      const newNotification = await Notification.create({
        userId: followingId,
        senderId: followerId,
        type: 'follow',
        commentId: null,
        link: `follow_${followerId}_${followingId}`,
        message: `**${me.userName}** followed you`,
        isRead: false
      });

      try {
        const notifJson = newNotification.toJSON();

        const notificationPayload = {
          ...notifJson,
          commentId: notifJson.link,
          sender: {
            id: me.id,
            userName: me.userName,
            profilePicture: me.profilePicture
          }
        };

        await Socket.emit(
          `user_${followingId}`,
          {
            event: 'new_notification',
            data: notificationPayload
          },
          'new_message'
        );
        console.log(`📡 Real-time Follow Notification sent to User: ${followingId}`);

      } catch (socketErr) {
        console.error("Socket follow notification failed:", socketErr);
      }

      return res.json({success: true, status: 'followed'});
    }
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({error: error.message});
  }
};


export const getFollowers = async (req, res) => {
  try {
    const myId = req.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const totalCount = await Follower.count({ where: { followingId: myId } });

    const followersData = await Follower.findAll({
      where: { followingId: myId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    if (!followersData || followersData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { totalItems: 0, currentPage: page, totalPages: 0, hasNextPage: false }
      });
    }

    const followerUserIds = followersData.map(f => f.followerId);

    const users = await User.findAll({
      where: { id: { [Op.in]: followerUserIds } },
      attributes: ['id', 'userName', 'profilePicture']
    });

    const myFollowings = await Follower.findAll({
      where: {
        followerId: myId,
        followingId: { [Op.in]: followerUserIds }
      },
      attributes: ['followingId']
    });

    const myFollowingSet = new Set(myFollowings.map(f => f.followingId));
    const userMap = new Map(users.map(u => [u.id, u.toJSON()]));

    const formattedFollowers = followerUserIds
      .map(id => {
        const user = userMap.get(id);
        if (!user) return null;
        return {
          ...user,
          isFollowing: myFollowingSet.has(id)
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formattedFollowers,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount
      }
    });

  } catch (err) {
    console.error("Error in stable getFollowers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const getFollowing = async (req, res) => {
  try {
    const followerId = req.userId;

    const followersData = await Follower.findAll({
      where: { followerId },
      attributes: ['followingId'],
      order: [['createdAt', 'DESC']]
    });

    const followingIds = followersData.map(f => f.followingId);

    return res.status(200).json({
      success: true,
      data: followingIds
    });

  } catch (error) {
    console.error("Error in getFollowing configuration:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




export const getMyFollowingWithDetails = async (req, res) => {
  try {

    const myId = req.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const totalCount = await Follower.count({ where: { followerId: myId } });

    const followingData = await Follower.findAll({
      where: { followerId: myId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    if (!followingData || followingData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { totalItems: 0, currentPage: page, totalPages: 0, hasNextPage: false }
      });
    }

    const followingUserIds = followingData.map(f => f.followingId);

    const users = await User.findAll({
      where: { id: { [Op.in]: followingUserIds } },
      attributes: ['id', 'user_name', 'profile_picture']
    });

    const formattedFollowing = users.map(u => {
      const user = u.toJSON();
      return {
        id: user.id,
        userName: user.user_name,
        profilePicture: user.profile_picture,
        isFollowing: true
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedFollowing,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount
      }
    });

  } catch (err) {
    console.error("Error in getMyFollowingWithDetails:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const getUserFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const totalCount = await Follower.count({ where: { followingId: userId } });

    const followersData = await Follower.findAll({
      where: { followingId: userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    if (!followersData || followersData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { totalItems: 0, currentPage: page, totalPages: 0, hasNextPage: false }
      });
    }

    const followerUserIds = followersData.map(f => f.followerId);

    const users = await User.findAll({
      where: { id: { [Op.in]: followerUserIds } },
      attributes: ['id', 'user_name', 'profile_picture']
    });

    const myFollowings = await Follower.findAll({
      where: {
        followerId: myId,
        followingId: { [Op.in]: followerUserIds }
      },
      attributes: ['followingId']
    });

    const myFollowingSet = new Set(myFollowings.map(f => f.followingId));
    const userMap = new Map(users.map(u => [u.id, u.toJSON()]));

    const formattedFollowers = followerUserIds
      .map(id => {
        const user = userMap.get(id);
        if (!user) return null;
        return {
          id: user.id,
          userName: user.user_name,
          profilePicture: user.profile_picture,
          isFollowing: myFollowingSet.has(id)
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formattedFollowers,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const totalCount = await Follower.count({ where: { followerId: userId } });

    const followingData = await Follower.findAll({
      where: { followerId: userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    if (!followingData || followingData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { totalItems: 0, currentPage: page, totalPages: 0, hasNextPage: false }
      });
    }

    const followingUserIds = followingData.map(f => f.followingId);

    const users = await User.findAll({
      where: { id: { [Op.in]: followingUserIds } },
      attributes: ['id', 'user_name', 'profile_picture']
    });

    const myFollowings = await Follower.findAll({
      where: {
        followerId: myId,
        followingId: { [Op.in]: followingUserIds }
      },
      attributes: ['followingId']
    });

    const myFollowingSet = new Set(myFollowings.map(f => f.followingId));
    const userMap = new Map(users.map(u => [u.id, u.toJSON()]));

    const formattedFollowing = followingUserIds
      .map(id => {
        const user = userMap.get(id);
        if (!user) return null;
        return {
          id: user.id,
          userName: user.user_name,
          profilePicture: user.profile_picture,
          isFollowing: myFollowingSet.has(id)
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formattedFollowing,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};


