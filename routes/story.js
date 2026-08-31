import express from 'express';
import * as controller from '../controllers/story.js';
import authorize from '../middlewares/authMiddlewere.js';
import createCloudinaryUpload from "../middlewares/upload.js";

const upload = createCloudinaryUpload('stories');


const router = express.Router();

router.post('/create', authorize,
  upload.single('media'),
  controller.createStory);



router.get('/my', authorize, controller.getMyStories);
router.get('/user/:userId', authorize, controller.getUserStories);

router.post('/:id/like', authorize, controller.toggleLikeStory);
router.post('/:id/reply', authorize, controller.replyToStory);
router.post('/:id/view', authorize, controller.viewStory);
router.get('/:id/stats', authorize, controller.getStoryStats);

router.delete('/:id', authorize, controller.deleteStory);

export default router;
