import express from 'express';
import authorize from '../middlewares/authMiddlewere.js';
import validate from '../middlewares/validation.js';
import schema from '../schemas/reservation.schema.js';
import * as controller from '../controllers/reservation.js';

const router = express.Router();

router.post(
  '/create',
  authorize,
  validate(schema.createReservation),
  controller.createReservation
);

router.get('/my', authorize, controller.getMyReservations);

router.post(
  '/cancel/:id',
  authorize,
  validate(schema.cancelReservation),
  controller.cancelReservation
);

export default router;
