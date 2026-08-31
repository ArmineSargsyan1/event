// import express from 'express';
// import * as Controller from "../controllers/restaurant.js";
// import {addMenuItem, deleteMenuItem, updateMenuItem} from "../controllers/menuItem.js";
// import {getBusinessChats} from "../controllers/supportMessageController.js";
// import authorize from "../middlewares/authMiddlewere.js";
//
//
// const router = express.Router();
//
// // Ռեստորանների CRUD API-ներ
// router.get('/', Controller.getAllRestaurants);
// router.get('/detail/:id', Controller.getOne);
// router.post('/create', Controller.create);
// router.put('/update/:id', Controller.update);
// router.delete('/delete/:id', Controller.remove);
//
// router.get('/hotel-restaurant', Controller.getHotelRestaurant);
//
// router.post('/order',
//   authorize,
//   Controller.createRestaurantOrder);
//
// router.get('/support/chats', getBusinessChats);
//
//
// router.get('/invoice/final/:booking_id', Controller.getFinalInvoice);
//
//
// // router.get('/restaurant/:id/edit', isAuth, isOwner, Controller.renderEditForm);
// // router.get('/nearby', validate(nearbyQuerySchema, 'query'), Controller.getNearbyPage);
// // router.post('/delete-image/:id', isAuth, isOwner, Controller.deleteImage);
//
// router.post('/menu-item/add', addMenuItem);
// router.put('/menu-item/update/:id', updateMenuItem);
// router.delete('/menu-item/delete/:id', deleteMenuItem);
//
//
// export default router;


import express from 'express';
import * as Controller from "../controllers/restaurant.js";
import {addMenuItem, deleteMenuItem, updateMenuItem} from "../controllers/menuItem.js";
import {getBusinessChats} from "../controllers/supportMessageController.js";
import authorize from "../middlewares/authMiddlewere.js";

const router = express.Router();

router.get('/',
  authorize,
  Controller.getAllRestaurants);
router.get('/hotel-restaurant', Controller.getHotelRestaurant);
router.get('/support/chats', getBusinessChats);
router.get('/invoice/final/:booking_id', Controller.getFinalInvoice);
router.get('/nearby',
  // validate(nearbyQuerySchema, 'query'),
  Controller.getNearbyPage);

router.get('/:id', Controller.getOne);

router.post('/create', Controller.create);
router.put('/update/:id', Controller.update);
router.delete('/delete/:id', Controller.remove);

router.get("/:restaurantId/nearby-hotels", Controller.getNearbyHotels);


router.post('/menu-item/add', addMenuItem);
router.put('/menu-item/update/:id', updateMenuItem);
router.delete('/menu-item/delete/:id', deleteMenuItem);

export default router;
