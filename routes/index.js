import {Router} from 'express';


import users from "./users.js";
import flights from "./flights.js";
import chat from "./chat.js";
import room from "./room.js";
import app from "../app.js";
import hotels from "./hotelsl.js";
import reviews from "./reviews.js";
import admin from "./admin.js";
import amenity from "./amenity.js";
import booking from "./booking.js";
import payment from "./payment.js";
import favorites from "./favorites.js";
// import owner from "./owner.js";

// app.use('/flights', flights);
// app.use('/packages', packagesRoute);/


const router = Router();

router.get('/', (req, res) => {
  res.redirect('/users/views/profile');
});



router.use('/users', users);
router.use('/round-trip', flights);



router.use('/room', room);
router.use('/amenity', amenity);

router.use('/hotels', hotels);
router.use('/reviews', reviews);
router.use('/admin', admin);
router.use('/bookings', booking);
router.use('/favorites', favorites);
router.use('/payments', payment);
// router.use('/owner', owner);

export default router;
