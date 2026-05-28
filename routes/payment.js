import express from "express";

import * as paymentController from "../controllers/payment.js";



const router =
  express.Router();

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
  paymentController.createBookingSession
);



router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeBookingWebhook
);
// =========================
// STRIPE WEBHOOK
// =========================

// router.post(
//   "/webhook",
//   (req, res, next) => {
//     console.log("🔥 WEBHOOK REQUEST HIT");
//     console.log("METHOD:", req.method);
//     console.log("URL:", req.originalUrl);
//     next();
//   },
//   express.raw({ type: "application/json" }),
//   paymentController.stripeBookingWebhook
// );
// router.post(
//
//   "/webhook",
//
//   express.raw({type: "application/json",}),
//   paymentController.stripeBookingWebhook);

export default router;
