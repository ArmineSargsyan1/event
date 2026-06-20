import path from 'path';
import logger from 'morgan';
import express, {response} from 'express';
import createError from 'http-errors';
// import errorHandler from './middlewares/errorHandler.js';
import router from './routes/index.js';
import cors from "./middlewares/cors.js";
import './migrate.js';
import axios from "axios";
import Hotel from "./models/Hotels.js";
import Room from "./models/Room.js";
import Photo from "./models/Photo.js";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import createCloudinaryUpload from './middlewares/upload.js';
import * as paymentController from "./controllers/payment.js";
import sequelize from "./clients/db.sequelize.mysql.js";


const uploadRoomImages = createCloudinaryUpload('rooms');

const app = express();
app.use(cors);


app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));

app.use(
  "/payments/webhook",
  express.raw({ type: "application/json" })
);

app.post(
  "/payments/webhook",
  paymentController.stripeBookingWebhook
);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 3. ROUTES

app.use(router);



app.post('/rooms/:id/images', uploadRoomImages.array('images', 10), async (req, res) => {
  try {
    const roomId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({message: "No images uploaded"});
    }

    // Վերբեռնել DB-ում
    const photoRecords = await Promise.all(files.map(file =>
      Photo.create({path: file.path, roomId})
    ));

    res.status(201).json({photos: photoRecords});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Error uploading images"});
  }
});






app.get("/api/gallery", async (req, res) => {
  const url = "https://anigrandhotelyerevan.com/all-rooms/";
  const photos = await getAhotelSliderPhotos(url);

  res.json({count: photos.length, images: photos});
});




app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.findAll();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});


console.log("DB:", sequelize.config.database),999999999999999;


app.use((req, res, next) => {
  next(createError(404));
});


export default app;

