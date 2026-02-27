import express from "express";
import controller from "../controllers/event.js";
import auth from "../middlewares/authMiddlewere.js";
import upload from "../middlewares/upload.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/eventschema.js";

const router = express.Router();

const uploadEvent = upload("event");


router.get("/",
  controller.getEvents);

router.post(
  "/", auth,
  uploadEvent.single("image"),
  validation(schema.createEvent),
  controller.createEvent);


router.put("/:id",
  auth,
  uploadEvent.single("image"),
  validation(schema.updateEvent),
  controller.updateEvent
);

router.post("/:eventId/register", auth, controller.registerForEvent);

router.get("/my-events", auth, controller.getUserEvents);

export default router;
