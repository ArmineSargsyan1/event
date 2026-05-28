import express from "express";
import * as Controller from "../controllers/favorite.js";




const router = express.Router();

router.post(
  "/",
  // authMiddleware,
  Controller.createFavorite
);

router.get(
  "/",
  // authMiddleware,
  Controller.getFavorites
);

router.delete(
  "/:hotelId",
  // authMiddleware,
  Controller.deleteFavorite
);

router.delete(
  "/",
  // authMiddleware,
  Controller.clearAllFavorites
);

export default router;
