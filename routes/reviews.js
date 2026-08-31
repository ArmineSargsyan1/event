import express from "express";
import * as ReviewsController from "../controllers/reviews.js";
import auth from "../middlewares/authMiddlewere.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/review.schema.js";
import createCloudinaryUpload from "../middlewares/upload.js";

const router = express.Router();

const upload = createCloudinaryUpload('restaurant_reviews');

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



router.post('/restaurants/:id',
  auth,
  upload.single('image'),
  validation(schema.createRestaurantReview),
  ReviewsController.createRestaurantReview
);


export default router;
