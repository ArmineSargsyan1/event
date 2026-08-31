import express from "express";
import createCloudinaryUpload from "../middlewares/upload.js";
import * as Controller from "../controllers/admin.js";
import {
  createAmenity,
  deleteAmenity,
  getAllAmenitiesAdmin,
  seedAmenities,
  updateAmenity
} from "../controllers/Admin.controller.js";

import auth from "../middlewares/authMiddlewere.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/hotel.schema.js";

import menuSchema from "../schemas/menu.schema.js";
import {
  getAdminHotels,
  getAdminTopHotels,
} from "../controllers/admin.js";

const router = express.Router();
const uploadHotelPhoto = createCloudinaryUpload('hotels');
const uploadRestaurantPhoto = createCloudinaryUpload('restaurants');


router.get("/amenities", getAllAmenitiesAdmin);
const isAdmin = (req, res, next) => {
  if (req.role === 'admin' || req.role === 'SUPER ADMIN') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Administrative privileges are required to access this system workspace registry."
  });
};

router.use(auth);
router.use(isAdmin);


// DASHBOARD ANALYTICS

router.get("/dashboard/stats", auth, isAdmin, Controller.getDashboardStats);
router.get('/chart/bookings', auth, isAdmin, Controller.getBookingChartData);
router.get('/chart/orders', auth, isAdmin, Controller.getOrderChartData);
router.get('/chart/locations', auth, isAdmin, Controller.getTopLocationsChartData);
router.get('/recent-transactions', auth, isAdmin, Controller.getRecentTransactions);

router.get('/top-hotels', auth, isAdmin, Controller.getTopHotels);
router.get('/top-restaurants', auth, isAdmin, Controller.getTopRestaurants);
router.get("/revenue-overview", auth, isAdmin, Controller.getRevenueOverview);

/* ==========================================================================
   HOTELS ROUTES
   ========================================================================== */
router.get("/hotelss", auth, isAdmin, getAdminHotels);
router.post("/hotels", auth, isAdmin,
  // validation(schema.createHotel),
  Controller.createHotel);

router.get("/hotel/stats", Controller.getAdminHotelStats);


router.get("/hotels/top", getAdminTopHotels);

router.get("/hotels/inactive", Controller.getInactiveHotels);
router.get("/hotels/:id/photos", Controller.getHotel);


router.post("/hotels/:id/restore", Controller.restoreHotel);

router.post("/hotels/gallery",
  auth, isAdmin,
  uploadHotelPhoto.array("photos", 5),
  Controller.syncHotelGallery);

router.put("/hotels/:id",
  // validation(schema.updateHotel),
  Controller.updateHotel);


router.delete("/hotels/:id", Controller.deleteHotel);
router.get("/hotels/:id/rooms", auth, Controller.getAdminHotelRooms);
router.put("/rooms/:id", auth, Controller.updateAdminRoom);
router.delete("/rooms/:id", auth, Controller.deleteAdminRoom);

router.patch("/hotels/:id/featured", auth, Controller.toggleHotelFeatured);

///restaurant
router.get("/restaurant-stats", auth, isAdmin, Controller.getAdminRestaurantStats);

router.post("/restaurants", auth, isAdmin, Controller.createRestaurant);

router.put("/restaurants/:id", auth, isAdmin, Controller.updateRestaurant);

router.delete("/restaurants/:id", auth, isAdmin, Controller.deleteRestaurant);

router.post("/restaurants/gallery",
  auth, isAdmin,
  uploadRestaurantPhoto.array("photos", 5),
  Controller.syncRestaurantGallery
);

/* ==========================================================================
   USERS ROUTES
   ========================================================================== */
router.get("/users", Controller.getAdminUsers);
router.patch("/users/:id/update-fields",Controller.updateUserFields);

/* ==========================================================================
   BOOKINGS ROUTES
   ========================================================================== */
router.get("/bookings", Controller.getAdminBookings);
router.patch("/bookings/:id/status", Controller.updateAdminOrderStatus);
router.get('/order-items/:bookingId', Controller.getOrderItemsByBooking);

/* ==========================================================================
   Analytics ROUTES
   ========================================================================== */
router.get("/analytics/global", Controller.getGlobalAnalytics);
router.get("/revenue/dashboard", Controller.getRevenueDashboardData);

//settings
router.get("/settings", Controller.getPlatformSettings);

// 2. PUT: Թարմացնել և սինքրոնացնել կարգավորումները (Ձեր ուզած տողը)
router.put("/settings", Controller.updatePlatformSettings);

router.get("/restaurants", Controller.getAdminRestaurants);

//menu
router.get(
  '/menu/:restaurantId',
  Controller.getRestaurantMenu);

router.post('/menu',
  uploadRestaurantPhoto.single("custom_image"),
  validation(menuSchema.createMenuItem),
  Controller.createMenuItem);

router.put('/menu/:id',
  uploadRestaurantPhoto.single("custom_image"),
  validation(menuSchema.updateMenuItem),
  Controller.updateMenuItem);

router.delete('/menu/:id', Controller.deleteMenuItem);

router.get('/dishes', Controller.getDishes);





router.get("/reviews/all", Controller.getAdminAllReviews);
router.delete("/reviews/:id", Controller.deleteReview);

router.get("/notifications/all", Controller.getAdminNotifications);


export default router;

/* ==========================================================================
   AMENITIES ROUTES
   ========================================================================== */
router.get("/amenities", getAllAmenitiesAdmin);
router.post("/amenities", createAmenity);
router.put("/amenities/:id", updateAmenity);
router.delete("/amenities/:id", deleteAmenity);
router.post("/amenities/seed", seedAmenities);



// router.post("/create/review", createReview);
// router.get("/reviews/dashboard", Controller.getAdminReviewsDashboard);
// router.get("/reviews/export", Controller.exportReviewsReport);


