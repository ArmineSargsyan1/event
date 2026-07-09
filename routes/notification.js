import { Router } from "express";
import * as controller from "../controllers/notification.js";
import authorize from "../middlewares/authMiddlewere.js";

const router = Router();

router.get('/', authorize, controller.getNotifications);

router.put('/read', authorize, controller.markAsRead);

router.delete('/:id', authorize, controller.deleteNotification);

export default router;
