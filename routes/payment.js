import express from "express";
import authorize from "../middlewares/authMiddlewere.js";
import * as paymentController from "../controllers/payment.js";


const router = express.Router();

// =========================
// TEST PAGES
// =========================
router.get(
  "/",
(req, res) =>
    res.render(
      "payment",
      {
        status: "info",
      }
    )
);

router.get(
  "/payment-success",
  (req, res) =>
    res.render(
      "payment",
      {
        status: "success",
      }
    )
);

router.get(
  "/payment-cancel",
  (req, res) =>
    res.render(
      "payment",
      {
        status: "cancel",
      }
    )
);

// =========================
// CREATE STRIPE SESSION
// =========================
router.post(
  "/create-booking-session",
  authorize,
  paymentController.createBookingSession
);


export default router;
