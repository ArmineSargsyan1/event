import express from "express";
import { subscribeNewsletter } from "../controllers/newsletter.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/newsletter.schema.js";

const router = express.Router();

router.post("/subscribe",
  validation(schema.subscribe),
  subscribeNewsletter);

export default router;
