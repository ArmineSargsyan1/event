import {Router} from 'express';


import users from "./users.js";
import room from "./room.js";
import hotels from "./hotelsl.js";
import reviews from "./reviews.js";
import admin from "./admin.js";
import amenity from "./amenity.js";
import booking from "./booking.js";
import payment from "./payment.js";
import favorites from "./favorites.js";
import newsletter from "./newsletter.js";
import nearby from "./nearby.js";
import posts from "./posts.js";
import notification from "./notification.js";
import  follows from "./follows.js";
import messages from "./messages.js";
// import owner from "./owner.js";

// app.use('/flights', flights);


const router = Router();

router.get('/', (req, res) => {
  res.redirect('/users/views/profile');
});



router.use('/users', users);
router.use('/round-trip', flights);



router.use('/room', room);
router.use('/amenity', amenity);

router.use('/hotels', hotels);
router.use('/newsletter', newsletter);
router.use('/reviews', reviews);
router.use('/admin', admin);
router.use('/bookings', booking);
router.use('/favorites', favorites);
router.use('/payments', payment);
router.use('/nearby', nearby);
// router.use('/owner', owner);

//social
router.use('/posts', posts);
router.use('/notifications',notification);
router.use('/followers', follows);
router.use('/messages', messages);

export default router;
