import express from 'express';
import * as controller from '../controllers/messages.js';
import authorize from "../middlewares/authMiddlewere.js";

const router = express.Router();


router.post('/send', authorize, controller.sendMessage)
router.get('/conversations', authorize, controller.getConversations);
router.put('/clear/:contactId', authorize, controller.deleteConversation);
router.get('/:contactId', authorize, controller.getMessages);
router.delete('/:id', authorize, controller.deleteMessage);


export default router;
