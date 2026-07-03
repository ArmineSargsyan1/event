import express from "express";
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getBookingById,
  createDraftBooking,
  getBookingConfirmation,
  getSuccessToken,
  getBookingDetails,
} from "../controllers/booking.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/booking.schema.js";

const router = express.Router();

router.post(
  "/draft",
  // authMiddleware,
  validation(schema.createBooking),
  createDraftBooking
);


router.get("/my",
  // authMiddleware,
  getMyBookings
);


router.post("/",
  // authMiddleware,
  createBooking);


router.put("/:bookingId/cancel",
  // authMiddleware,
  cancelBooking);

router.get(
  "/:id/success",
  getSuccessToken
);

router.get(
  "/:id/confirmation",
  getBookingConfirmation
);

router.get(
  "/:id",
  // authMiddleware,
  getBookingDetails
);











router.get(
  "/:id",
  getBookingById
);

export default router;
