import fs from 'fs';
import path from 'path';
import md5 from 'md5';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

import {sendMail} from '../services/mail.js';
import Post from "../models/Post.js";
import {Op, Utils} from "sequelize";
import FileHelper from "../services/Utils.js";
import {Follower} from "../models/index.js";
import Story from "../models/Story.js";
import sequelize from "../clients/db.sequelize.mysql.js";

const {AUTH_SECRET, JWT_EXPIRES_IN, USER_SECRET} = process.env;

const hashPassword = (password) => md5(md5(password) + USER_SECRET);

const cleanFile = (file) => {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

export default {

  async registration(req, res, next) {
    console.log(req.body, 89)
    try {
      const {fullName, email, phoneNumber, password} = req.body;

      const existingUser = await User.findOne({where: {email}});
      if (existingUser) {
        cleanFile(req.file);
        return res.status(409).json({success: false, error: 'Email already registered'});
      }

      // const profilePicture = req.file
      //   ? path.normalize(req.file.path).replace(/\\/g, '/')
      //   : null;

      const hashedPassword = hashPassword(password);

      const user = await User.create({
        userName: fullName,
        email,
        password: hashedPassword,
        phoneNumber,
        lastStoryTimestamp: new Date(),
      });


      // const activationLink = `http://localhost:5000/users/activate?token=${user.activationToken}`;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const activationLink = `${frontendUrl}/activate?token=${user.activationToken}`;

      await sendMail({
        to: email,
        subject: 'Activate Your Account',
        template: 'activate',
        templateData: {
          userName: fullName,
          activationLink
        }
      });

      const newUser = await User.findByPk(user.id, {
        attributes: {exclude: ['password']}
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully. Check email to activate account.',
        user: newUser
      });

    } catch (error) {
      // cleanFile(req.file);
      next(error);
    }
  },


  // async registration(req, res, next) {
  //   console.log(req.body, 89)
  //   try {
  //     const {fullName, email, phoneNumber, password} = req.body;
  //
  //     const existingUser = await User.findOne({where: {email}});
  //     if (existingUser) {
  //       cleanFile(req.file);
  //       return res.status(409).json({success: false, error: 'Email already registered'});
  //     }
  //
  //     const hashedPassword = hashPassword(password);
  //
  //     const user = await User.create({
  //       userName: fullName,
  //       email,
  //       password: hashedPassword,
  //       phoneNumber,
  //       lastStoryTimestamp: new Date(),
  //     });
  //
  //     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  //     const activationLink = `${frontendUrl}/activate?token=${user.activationToken}`;
  //
  //     console.log(`\n🚀 [TESTING]  USER ID ${user.id} for:`);
  //     console.log(`${activationLink}\n`);
  //
  //     sendMail({
  //       to: email,
  //       subject: 'Activate Your Account',
  //       template: 'activate',
  //       templateData: {
  //         userName: fullName,
  //         activationLink
  //       }
  //     }).catch(err => console.error("⚠️ Nodemailer blocked by Render, link printed above:", err.message));
  //
  //     const newUser = await User.findByPk(user.id, {
  //       attributes: {exclude: ['password']}
  //     });
  //
  //     return res.status(201).json({
  //       success: true,
  //       message: 'User registered successfully. Check email to activate account.',
  //       user: newUser
  //     });
  //
  //   } catch (error) {
  //     next(error);
  //   }
  // },


  async activate(req, res, next) {
    try {
      const {token} = req.query;
      const user = await User.findOne({where: {activationToken: token}});

      if (!user) return res.status(400).json({success: false, error: 'Invalid activation token'});

      user.isActive = true;
      user.activationToken = null;
      await user.save();

      return res.status(200).json({success: true, message: 'Account activated successfully'});
    } catch (err) {
      next(err);
    }
  },


  async login(req, res, next) {
    try {
      const {email, password} = req.body;

      const user = await User.findOne({where: {email}});

      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({success: false, error: 'Invalid credentials'});
      }

      if (!user.isActive) {
        return res.status(403).json({success: false, error: 'Please activate your account via email first'});
      }

      const token = jwt.sign(
        {id: user.id, email: user.email},
        process.env.AUTH_SECRET,
        {expiresIn: JWT_EXPIRES_IN}
      );

      const userData = await User.findByPk(user.id,
        {
          attributes: {exclude: ['password', 'activationToken', 'resetToken', 'resetTokenExp']}
        });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: userData
      });

    } catch (err) {
      next(err);
    }
  },


  async profile(req, res, next) {
    try {
      const userId = req.userId;

      const [user, stories, followersCount, followingCount, postsCount] = await Promise.all([
        User.findByPk(userId, {attributes: ['id', 'userName', 'email', 'profilePicture', 'bio', 'isPrivate']}),
        Story.findAll({where: {userId, expiresAt: {[Op.gt]: new Date()}}}),
        Follower.count({where: {followingId: userId}}),
        Follower.count({where: {followerId: userId}}),
        Post.count({where: {userId}})
      ]);

      if (!user) return res.status(404).json({success: false, message: 'No user found.'});

      return res.status(200).json({
        success: true,
        user,
        stories,
        followersCount,
        followingCount,
        postsCount,
        isAccessible: true
      });
    } catch (err) {
      next(err);
    }
  },

  async getFullProfile(req, res, next) {
    try {
      const {userId} = req.params;
      const myId = req.userId;
      const targetId = parseInt(userId, 10);

      const profile = await User.findByPk(targetId, {
        attributes: ['id', 'userName', 'email', 'profilePicture', 'bio', 'isPrivate']
      });

      if (!profile) {
        return res.status(404).json({success: false, message: 'No user found.'});
      }

      const [followersCount, followingCount, isFollowing, postsCount] = await Promise.all([
        Follower.count({where: {followingId: targetId}}),
        Follower.count({where: {followerId: targetId}}),
        myId ? Follower.findOne({where: {followerId: myId, followingId: targetId}}) : null,
        Post.count({where: {userId: targetId}})
      ]);

      const hasAccess = !profile.isPrivate || myId === targetId || !!isFollowing;

      return res.status(200).json({
        success: true,
        data: {
          ...profile.toJSON(),
          postsCount,
          followersCount,
          followingCount,
          isFollowing: !!isFollowing,
          isAccessible: hasAccess
        }
      });

    } catch (err) {
      next(err);
    }
  },


  async searchExplore(req, res, next) {
    try {
      const {query} = req.query;
      const myId = req.userId;

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const offset = (page - 1) * limit;

      if (!query || query.trim() === '') {
        const totalPosts = await Post.count();

        const explorePosts = await Post.findAll({
          attributes: ['id', 'mediaUrl', 'mediaType', 'caption', 'createdAt'],
          order: [[sequelize.fn('RAND')]],
          limit: limit,
          offset: offset
        });

        return res.status(200).json({
          success: true,
          type: 'explore',
          data: explorePosts,
          pagination: {
            currentPage: page,
            limit: limit,
            totalItems: totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            hasNextPage: page * limit < totalPosts
          }
        });
      }

      const users = await User.findAll({
        where: {
          id: {[Op.ne]: myId},
          userName: {[Op.like]: `%${query.trim()}%`}
        },
        attributes: ['id', 'userName', 'profilePicture'],
        limit: limit,
        offset: offset
      });

      return res.status(200).json({
        success: true,
        type: 'users',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },


  async forgotPassword(req, res, next) {
    try {
      const {email} = req.body;
      const user = await User.findOne({where: {email}});

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If this email exists, a reset link has been sent.'
        });
      }

      const resetToken = jwt.sign(
        {id: user.id, email: user.email},
        AUTH_SECRET,
        {expiresIn: '1h'}
      );

      user.resetToken = resetToken;
      await user.save();

      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

      await sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        templateData: {userName: user.userName, resetLink}
      });

      return res.status(200).json({
        success: true,
        message: 'A password reset link has been successfully sent to your email address.'
      });

    } catch (err) {
      next(err);
    }
  },


  async resetPassword(req, res, next) {
    console.log(req.body, 98);
    try {
      const {newPassword} = req.body;

      const token = req.body.token || req.query.token;

      console.log(token)

      if (!token) {
        return res.status(400).send('The password reset link is missing or has expired.');
      }

      let decoded;
      try {
        // decoded = jwt.verify(token, AUTH_SECRET);
        decoded = jwt.verify(token, AUTH_SECRET, {ignoreExpiration: true});
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).send('The password reset link has expired. Please request a new one.');
        }
        return res.status(401).send('Invalid reset token.');
      }

      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(400).send('Invalid or expired token');
      }

      user.password = md5(md5(newPassword) + USER_SECRET);
      user.resetToken = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully! You can now login.'
      });

    } catch (err) {
      next(err);
    }
  },


  async changePassword(req, res, next) {
    try {
      const {oldPassword, newPassword} = req.body;
      const userId = req.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({success: false, message: "User not found"});
      }

      if (user.password !== hashPassword(oldPassword)) {
        return res.status(400).json({success: false, message: "The old password is incorrect"});
      }

      user.password = hashPassword(newPassword);
      await user.save();

      return res.status(200).json({success: true, message: "Password changed successfully."});

    } catch (error) {
      next(error);
    }
  },

  async uploadProfilePicture(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({success: false, error: 'No file uploaded'});

      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({success: false, error: 'User not found'});

      if (user.profilePicture) {
        try {
          fs.unlinkSync(user.profilePicture);
        } catch (e) {
          console.warn('Old picture not deleted:', e.message);
        }
      }

      const newPath = path.normalize(req.file.path).replace(/\\/g, '/');
      user.profilePicture = newPath;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile picture updated',
        data: {profilePicture: user.profilePicture}
      });
    } catch (err) {
      next(err);
    }
  }
};




