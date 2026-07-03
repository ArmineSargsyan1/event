import { Router } from "express";
import {getNearbyLandmarksBySqlWithTime} from "../controllers/nearby.js";


const router = Router();

router.get("/", getNearbyLandmarksBySqlWithTime);


export default router;
