import fs from 'fs';
import path from 'path';
import md5 from 'md5';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

import {sendMail} from '../services/mail.js';

const {AUTH_SECRET, JWT_EXPIRES_IN, USER_SECRET} = process.env;

const hashPassword = (password) => md5(md5(password) + USER_SECRET);

const cleanFile = (file) => {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

export default {

  async registration(req, res, next) {
    try {
      const {userName, email, password} = req.body;

      const existingUser = await User.findOne({where: {email}});
      if (existingUser) {
        cleanFile(req.file);
        return res.status(409).json({success: false, error: 'Email already registered'});
      }
      const profilePicture = req.file
        ? path.normalize(req.file.path).replace(/\\/g, '/')
        : null;

      const hashedPassword = hashPassword(password);

      const user = await User.create({
        userName,
        email,
        password: hashedPassword,
        profilePicture,
      });


      const activationLink = `http://localhost:3000/users/activate?token=${user.activationToken}`;

      await sendMail({
        to: email,
        subject: 'Activate Your Account',
        template: 'activate',
        templateData: {
          userName,
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
      console.log(error,888)
      cleanFile(req.file);
      next(error);
    }
  },

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
        return res.status(403).json({success: false, error: 'Activate your account first'});
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

      return res.status(200).json({success: true, message: 'Login successful', token, data: userData});

    } catch (err) {
      next(err);
    }
  },

  async profile(req, res, next) {
    try {
      const user = await User.findByPk(req.userId,
        {
          attributes: {exclude: ['password', 'activationToken', 'resetToken', 'resetTokenExp']}
        });
      if (!user) return res.status(404).json({success: false, error: 'User not found'});

      return res.json({success: true, user});
    } catch (err) {
      next(err);
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

      const resetLink = `http://localhost:3000/users/forgot-password?token=${resetToken}`;

      await sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        templateData: {userName: user.userName, resetLink}
      });

      return res.status(200).json({
        success: true,
        message: 'If this email exists, a reset link has been sent.'
      });

    } catch (err) {
      next(err);
    }
  },


  async resetPassword(req, res, next) {
    const {token} = req.query;
    const {newPassword, confirmPassword} = req.body;

    if (!token) return res.status(400).send('Missing token');

    let decoded;
    try {
      decoded = jwt.verify(token, AUTH_SECRET);
    } catch (err) {
      return res.status(400).send('Invalid or expired token');
    }

    const user = await User.findOne({where: {id: decoded.id, resetToken: token}});
    if (!user) return res.status(400).send('Invalid or expired token');

    user.password = md5(md5(newPassword) + USER_SECRET);
    user.resetToken = null;
    await user.save();

    res.send('Password has been reset successfully! You can now login.');
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
