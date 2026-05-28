import express from "express";
import fetchRegionsBatch  from "../services/citiesDataSync.js";
import {createReview} from "../controllers/reviews.js";
import createCloudinaryUpload from "../middlewares/upload.js";
import * as Controller from "../controllers/admin.js";
import {
  createAmenity,
  deleteAmenity,
  getAllAmenitiesAdmin,
  seedAmenities,
  updateAmenity
} from "../controllers/Admin.controller.js";
import {getHotels} from "../controllers/hotel.js";

import auth from "../middlewares/authMiddlewere.js";
import upload from "../middlewares/upload.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/hotel.schema.js";
import {getAdminHotels, getAdminTopHotels} from "../controllers/admin.js";



const router = express.Router();

const uploadHotelPhoto = createCloudinaryUpload('hotels');

// POST կամ GET, կախված թե ինչպես կցանկանաս
router.post("/regions", async (req, res) => {
  const { cities } = req.body;

  console.log(cities,777777)
  if (!cities || !cities.length) {
    return res.status(400).json({ error: "cities array is required" });
  }

  try {
   const a =  await fetchRegionsBatch(cities);
    console.log(a,222)
    res.json({ message: "Regions synced successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




/* =========================
   📌 GET ROUTES
========================= */

// list + filters + pagination
router.get("/hotels", getHotels);
router.get("/hotelss", getAdminHotels);
router.get("/hotels/top", getAdminTopHotels);

router.get("/hotels/stats", Controller.getAdminHotelStats);



//
// // top hotels
// router.get("/top", getTopHotels);
//
// // single hotel
// router.get("/:id", getHotelById);


/* =========================
   📌 POST / CREATE
========================= */
router.post("/hotels",
  validation(schema.createHotel),
  Controller.createHotel);




/* =========================
   📌 PUT / UPDATE
========================= */
router.put("/hotels/:id",
  validation(schema.updateHotel),
  Controller.updateHotel);


/* =========================
   📌 DELETE
========================= */
router.delete("/hotels/:id", Controller.deleteHotel);


router.post("/hotels/:id/restore",
  Controller.restoreHotel

);


router.get("/hotels/inactive", Controller.getInactiveHotels);


router.post(
  "/hotels/gallery",
  // adminAuth,
  uploadHotelPhoto.array("photos", 20), // max 20 files
  Controller.syncHotelGallery
);


router.get(
  "/hotels/:id/photos",
  Controller.getHotel
);





router.post("/create/review", createReview);

router.get(
  "/reviews/dashboard",
  Controller.getAdminReviewsDashboard
);


router.get(
  "/reviews/export",
  Controller.exportReviewsReport
);

router.get(
  "/reviews/all",
  Controller.getAdminAllReviews
);


router.delete(
  "/reviews/:id",
  Controller.deleteReview
);



//users

router.get("/users/stats", Controller.getUserStats);
router.get("/users", Controller.getAllAdminUsers);

router.get("/amenities", getAllAmenitiesAdmin);
router.post("/amenities", createAmenity);
router.put("/amenities/:id", updateAmenity);
router.delete("/amenities/:id", deleteAmenity);
router.post("/amenities/seed", seedAmenities);

export default router;
