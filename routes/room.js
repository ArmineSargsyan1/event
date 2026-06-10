import express from "express";
import * as Controller from "../controllers/room.js";
import createCloudinaryUpload from "../middlewares/upload.js";
import {getRoomById} from "../controllers/room.js";

const upload = createCloudinaryUpload('rooms');


const router = express.Router();

/* =========================================================
   CREATE ROOM
========================================================= */
router.post("/",
  upload.array("photos"), 

  Controller.createRoom);

/* =========================================================
   GET ROOMS (FILTER + GEO + PAGINATION)
========================================================= */
router.get("/", Controller.getRooms);

router.get("/similar", Controller.getSimilarRooms);

router.get("/:id", getRoomById);



/* =========================================================
   UPDATE ROOM (PARTIAL UPDATE)
========================================================= */
router.patch("/:id", Controller.updateRoom);

/* =========================================================
   DELETE ROOM (SOFT DELETE)
========================================================= */
router.delete("/:id", Controller.deleteRoom);

/* =========================================================
   RESTORE ROOM
========================================================= */
router.patch("/:id/restore", Controller.restoreRoom);

/* =========================================================
   BULK ARCHIVE ROOMS
========================================================= */
router.patch("/archive/bulk", Controller.bulkArchiveRooms);

/* =========================================================
   UPLOAD ROOM IMAGES
========================================================= */

router.post(
  "/:id/images",
  upload.array("photos"),
  Controller.uploadRoomImages);


/* =========================================================
   DASHBOARD STATS (ADMIN)
========================================================= */
router.get("/dashboard/stats", Controller.getRoomDashboardStats);

export default router;
