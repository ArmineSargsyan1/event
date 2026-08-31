import express from "express";
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getBookingById,
  createDraftBooking,
  getBookingConfirmation,
  getSuccessToken,
  getBookingDetails, sendSmsVerification, verifySmsCode,
} from "../controllers/booking.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/booking.schema.js";
import authorize from "../middlewares/authMiddlewere.js";


const router = express.Router();

router.post(
  "/draft",
  // authMiddleware,
  validation(schema.createBooking),
  createDraftBooking
);


router.get("/my",
  authorize,
  getMyBookings
);

router.post('/send-sms-otp', sendSmsVerification);
router.post('/verify-sms-otp', verifySmsCode);

router.post("/",
  authorize,
  createBooking);


router.put("/:bookingId/cancel",
  authorize,
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
  authorize,
  getBookingDetails
);


router.get(
  "/:id",
  getBookingById
);

export default router;
