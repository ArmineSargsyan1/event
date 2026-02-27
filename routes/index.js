import {Router} from 'express';


import users from "./users.js";
import event from "./event.js";
import chat from "./chat.js";


const router = Router();

router.get('/', (req, res) => {
  res.redirect('/users/views/profile');
});

router.use('/users', users);
router.use('/event', event);
router.use('/chat', chat);

export default router;
