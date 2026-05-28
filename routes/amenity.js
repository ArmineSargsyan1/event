import express from "express";
import * as Controller from "../controllers/amenity.js";

const router = express.Router();


router.get("/", Controller.getAmenities);



export default router;



