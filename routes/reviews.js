import express from "express";
import * as ReviewsController from "../controllers/reviews.js";
import {getRatingBreakdown} from "../controllers/reviews.js";

const router = express.Router();

router.post("/create", ReviewsController.createReview);

router.get("/", ReviewsController.getReviews);

router.get(
  "/hotel/:hotel_id",
  ReviewsController.getHotelReviews
);

router.get(
  "/testimonials",
  ReviewsController.getTestimonials
);

router.get("/breakdown", ReviewsController.getRatingBreakdown);

export default router;
