import {Router} from "express";

import auth from "../middlewares/authMiddlewere.js";
// import validation from "../middlewares/validation.js";
// import schema from "../schemas/user.schema.js";
import controller from "../controllers/flight.js";


const router = Router();

// router.get('/',
//   // auth,
//   // validation(schema.GetUser),
//    controller.GetFlights
// );



const flights = [
  { id: 'FL123', from: 'Buenos Aires', to: 'Praga', departure: '2026-05-26', return: '2026-05-30', price: 1200, toRegionId: 2872 },
  { id: 'FL456', from: 'Buenos Aires', to: 'Londres', departure: '2026-05-26', return: '2026-05-30', price: 1100, toRegionId: 1234 }
];

router.get('/', (req, res) => {
  res.json({ flights });
});


export default router;
