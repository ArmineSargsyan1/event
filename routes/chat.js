import {Router} from "express";

import auth from "../middlewares/authMiddlewere.js";
import controller from "../controllers/messages.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/user.schema.js";

const router = Router();

router.get('/users',
  auth,
  validation(schema.GetUser),
  controller.GetUser)
;

router.get(
  '/messages',
  auth,
  validation(schema.GetMessages),
  controller.GetMessages
)

router.post('/send',
  auth,
  validation(schema.CreateMessage),
  controller.CreateMessage,
)

export default router;
