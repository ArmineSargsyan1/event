import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  const { flight, hotel } = req.body;
  const packagePrice = flight.price + hotel.price;
  res.json({ flight, hotel, packagePrice });
});

export default router;
