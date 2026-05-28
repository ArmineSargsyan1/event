import {Router} from "express";

import auth from "../middlewares/authMiddlewere.js";
import controller from "../controllers/owner.js";
// import validation from "../middlewares/validation.js";
// import schema from "../schemas/user.schema.js";

const router = Router();



router.post(
  "/reviews/:id/reply",
  // ownerAuth,
  // validation(schema.GetUser),
  controller.createReviewReply
);


// OWNER HOTEL REVIEWS
router.get(
  "/hotel/:hotel_id",
  // ownerAuth,
  controller.getOwnerHotelReviews
);



export default router;
