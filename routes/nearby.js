import { Router } from "express";
import {getAttractionBySlug, getFeaturedAttractions, getNearbyLandmarksBySqlWithTime} from "../controllers/nearby.js";


const router = Router();

router.get("/", getNearbyLandmarksBySqlWithTime);

router.get("/featured", getFeaturedAttractions);

router.get("/:slug", getAttractionBySlug);
export default router;
