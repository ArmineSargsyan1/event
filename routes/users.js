import { Router } from 'express';
import controller from '../controllers/users.js';
import upload from "../middlewares/upload.js";
import authorize from "../middlewares/authMiddlewere.js";
import validation from '../middlewares/validation.js';
import schema from '../schemas/user.schema.js';

const router = Router();

const uploadUser = upload('users');

router.post(
  '/registration',
  uploadUser.single('profilePicture'),
  validation(schema.registration),
  controller.registration
);

router.post('/login', validation(schema.login), controller.login);
router.get('/profile', authorize, controller.profile);

router.post(
  '/profile-picture',
  authorize,
  uploadUser.single('profilePicture'),
  // validation(schema.uploadProfilePicture),
  controller.uploadProfilePicture
);

router.get('/activate', controller.activate);

router.post('/forgot-password',
  validation(schema.forgotPassword),
  controller.forgotPassword);

router.post('/reset-password', validation(schema.resetPassword), controller.resetPassword);



router.get('/views/registration', (req, res) => res.render('registration'));
router.get('/views/login', (req, res) => res.render('login'));
router.get('/views/profile', (req, res) => res.render('profile'));

export default router;
