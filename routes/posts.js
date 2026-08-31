import { Router } from 'express';
import * as controller from  '../controllers/posts.js';
import authorize from "../middlewares/authMiddlewere.js";
import validation from '../middlewares/validation.js';
import schema from '../schemas/post.schema.js';
import createCloudinaryUpload from "../middlewares/upload.js";
import {searchMusic} from "../controllers/posts.js";

const uploadPostMedia = createCloudinaryUpload('posts');


const router = Router();

router.get('/tagged', authorize, controller.getMyTaggedPosts);


router.get("/place-posts", controller.getPlacePosts);

router.get("/my-visited-places", authorize, controller.getMyVisitedPlaces);


router.get("/music/search", authorize, controller.searchMusic);


// CRUD
router.post(
  '/', authorize,
  uploadPostMedia.single('postMedia'),
  validation(schema.createPost),
  controller.createPost);

router.get('/', controller.getAllPosts);

router.get('/:id',
  authorize,
  controller.getPost
);


router.get('/track/:id', controller.getFreshTrackPreview);


router.get('/user/:userId', controller.getUserPosts);

// router.get('/:postId/comments', controller.getPostComments);
//

router.put('/:id',
  authorize,
  validation(schema.updatePost),
  controller.updatePost);

//
router.delete('/:id', authorize, controller.deletePost);


// // INTERACTIONS
router.post('/:postId/like', authorize, controller.toggleLike);

router.post('/:postId/tags', authorize, controller.addPostTags)
router.post('/:postId/comments', authorize, controller.addComment);
router.post(`/comments/:commentId/reply`, authorize, controller.replyComment);
router.post('/comments/:commentId/like', authorize, controller.toggleCommentLike);
router.post('/:postId/share', authorize, controller.sharePost);
router.delete('/comments/:commentId', authorize, controller.deleteComment);


export default router;
