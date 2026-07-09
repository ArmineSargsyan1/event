import express from "express";
import * as ReviewsController from "../controllers/reviews.js";
import auth from "../middlewares/authMiddlewere.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/review.schema.js";

const router = express.Router();

router.post(
  "/create",
   auth,
  validation(schema.createReview),
  ReviewsController.createReview
);

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
