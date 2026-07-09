import express from 'express';
import * as controller from '../controllers/follows.js';
import authorize from "../middlewares/authMiddlewere.js";
import validation from '../middlewares/validation.js';
import schema from '../schemas/follow.schema.js';



const router = express.Router();


router.post(
  '/toggle',
  authorize,
  validation(schema.toggleFollow),
  controller.toggleFollow);

router.get('/my-followers', authorize, controller.getFollowers);
router.get('/following', authorize, controller.getFollowing);

router.get('/my-following-details', authorize, controller.getMyFollowingWithDetails);

router.get('/:userId/followers', authorize, controller.getUserFollowers);
router.get('/:userId/following', authorize, controller.getUserFollowing);
export default router;
