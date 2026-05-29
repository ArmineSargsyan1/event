import express from "express";
import {
  createBooking,
  cancelBooking, getMyBookings, getBookingById, getBooking, createDraftBooking,
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
