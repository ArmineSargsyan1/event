import {Router} from "express";

import auth from "../middlewares/authMiddlewere.js";
import controller from "../controllers/owner.js";
import * as Controller from "../controllers/admin.js";
import createCloudinaryUpload from "../middlewares/upload.js";
import validation from "../middlewares/validation.js";
import menuSchema from "../schemas/menu.schema.js";
// import validation from "../middlewares/validation.js";
// import schema from "../schemas/user.schema.js";

const router = Router();

const uploadHotelPhoto = createCloudinaryUpload('hotels');
const uploadRoomPhoto = createCloudinaryUpload('room');

const uploadRestaurantPhoto = createCloudinaryUpload('restaurants');

const isOwner = (req, res, next) => {
  console.log(req.role === "owner")
  if (req.role === 'owner') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Business owner privileges are required to access this node registry."
  });
};

router.use(auth);
router.use(isOwner);



router.get("/notifications/all", controller.getOwnerNotifications);
router.put("/notifications/:id/read", controller.markNotificationAsRead);
router.put("/notifications/clear-all", controller.clearAllOwnerNotifications);



router.get("/dashboard/stats", controller.getOwnerDashboardStats);
router.get("/analytics/booking-chart", controller.getOwnerBookingChartData);
router.get("/analytics/orders-chart", controller.getOwnerOrderChartData);
router.get("/analytics/services-donut", controller.getOwnerServicesChartData);
router.get("/analytics/recent-activity", controller.getOwnerRecentTransactions);


router.get("/property/details", controller.getOwnerPropertyDetails);

router.get("/amenities", controller.getOwnerAmenities);


router.put("/hotels/:id",  controller.updateHotel);


router.post(
  "/hotels/gallery",
  uploadHotelPhoto.array("photos", 5),
  controller.syncHotelGallery
);

///room

router.get("/rooms", controller.getOwnerRooms);


router.post("/rooms/rates", controller.addRoomRatePlan);

router.post("/rooms",  uploadRoomPhoto.array("photos", 5),controller.createOwnerRoom);

router.put("/rooms/:id", uploadRoomPhoto.array("photos", 5), controller.updateOwnerRoom);

router.delete("/rooms/:id", controller.deleteOwnerRoom);

router.put("/rooms/:id/restore", controller.restoreOwnerRoom);

///restaurant

router.get("/restaurant", controller.getOwnerRestaurantDetails);

router.put(
  "/restaurant/upsert",
  uploadRestaurantPhoto.any(),
  controller.upsertOwnerRestaurant
);


//menu
router.get("/dishes-list", controller.getGlobalDishesList);

router.post(
  "/restaurant/menu",
  uploadRestaurantPhoto.single("custom_image"),
  // validation(menuSchema.createMenuItem),
  controller.createMenuItem
);


router.put(
  "/restaurant/menu/:id",
  uploadRestaurantPhoto.single("custom_image"),
  // validation(menuSchema.updateMenuItem),
  controller.ownerUpdateMenuItem
);


router.delete(
  '/restaurant/menu/:id',
  controller.deleteMenuItem
);

// booking

router.get(
  "/bookings",
  controller.getOwnerBookings
);

router.put(
  "/bookings/:id/status",
  controller.updateOwnerOrderStatus
);

router.get(
  "/bookings/:bookingId/items",
  controller.getOwnerOrderItemsByBooking
);

///reviews posts

router.get("/reviews", controller.getOwnerReviews);
router.post("/reviews/:id/reply", controller.createReviewReply);
router.get("/ugc-posts", controller.getOwnerUgcPosts);
router.delete("/ugc-posts/:id", controller.disconnectUgcPost);

//settings
router.get("/settings", controller.getOwnerSettings);
router.put("/settings", controller.updateOwnerSettings);





/* ==========================================================================
   2. OWNER HOTEL REVIEWS & REPLIES
   ========================================================================== */
// router.get("/hotel/:hotel_id", controller.getOwnerHotelReviews);
//
// router.post("/reviews/:id/reply", controller.createReviewReply);




export default router;
