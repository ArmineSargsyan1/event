import express from "express";
import * as Controller from "../controllers/favorite.js";
import authMiddleware from "../middlewares/authMiddlewere.js";

const router = express.Router();

//(HOTELS)
router.get("/hotels", authMiddleware, Controller.getFavorites);
router.delete("/hotels/clear", authMiddleware, Controller.clearAllFavorites);
router.post("/hotels/add/:id", authMiddleware, Controller.createFavorite);
router.delete("/hotels/remove/:id", authMiddleware, Controller.deleteFavorite);

// RESTAURANTS)
router.get("/restaurants", authMiddleware, Controller.getRestaurantFavorites);
router.delete("/restaurants/clear", authMiddleware, Controller.clearAllRestaurantFavorites);
router.post("/restaurants/add/:id", authMiddleware, Controller.addRestaurantFavorite);
router.delete("/restaurants/remove/:id", authMiddleware, Controller.removeRestaurantFavorite);


export default router;
