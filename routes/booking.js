import express from "express";
import {
  createBooking,
  cancelBooking, getMyBookings, getBookingById, getBooking, createDraftBooking, getBookingConfirmation, getSuccessToken,
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

// GET BOOKING BY ID
router.get(
  "/:id",
  // authMiddleware,
  getBooking
);

// Create booking
router.post("/", createBooking);


router.get(
  "/:id/success",
  getSuccessToken
);

router.get(
  "/:id/confirmation",
  getBookingConfirmation
);


// Cancel booking
router.put("/:bookingId/cancel", cancelBooking);


router.get("/my",
  // authMiddleware,
  getMyBookings);


router.get(
  "/:id",
  getBookingById
);

export default router;
