import express from "express";
import * as Controller from "../controllers/hotel.js";
import validation from "../middlewares/validation.js";
import schema from "../schemas/hotel.schema.js";


import auth from "../middlewares/authMiddlewere.js";
import {log} from "debug";


const router = express.Router();

/* ---------------- LIST + FILTER + SEARCH + PAGINATION ---------------- */
router.get("/",
  validation(schema.getHotels),
  Controller.getHotels);

/* ---------------- TOP HOTELS ---------------- */
router.get("/top", Controller.getTopHotels);

/* ---------------- SINGLE HOTEL ---------------- */
router.get("/:id",
  // validation(schema.getSingleHotel),
  Controller.getHotelById);

export default router;













// / // // import express from "express";
// // // import { getHotels, getHotel, createHotel, updateHotel, deleteHotel } from "../controllers/hotelsl.js";
// // //
// // // const router = express.Router();
// // // router.get("/", getHotels);
// // // router.get("/:id", getHotel);
// // // router.post("/", createHotel);
// // // router.put("/:id", updateHotel);
// // // router.delete("/:id", deleteHotel);
// // //
// // // export default router;
// //
// // import express from "express";
// // import { getHotelsData } from "../controllers/hotelsl.js";
// //
// // const router = express.Router();
// // router.get("/hotels-only", getHotelsData); // միայն հյուրանոցներ
// // export default router;
//
// // import { Router } from 'express';
// // import controller from '../controllers/users.js';
// // import upload from "../middlewares/upload.js";
// // import authorize from "../middlewares/authMiddlewere.js";
// // import validation from '../middlewares/validation.js';
// // import schema from '../schemas/user.schema.js';
//
// // import { Op } from 'sequelize';
// // import Hotel from '../models/Hotels.js';
// // import Room from '../models/Room.js';
// // import axios from "axios";
// // const router = Router();
// //
// //
// // // Helper: fetch OSM hotels via Overpass
// // const getOverpassHotels = async (city) => {
// //   const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
// //     params: { key: process.env.OPENCAGE_API_KEY, q: city, limit: 1 }
// //   });
// //
// //   const geoData = geoRes.data.results;
// //   if (!geoData.length) return [];
// //
// //   const { lat, lng } = geoData[0].geometry;
// //   const delta = 0.05;
// //   const south = lat - delta;
// //   const north = lat + delta;
// //   const west = lng - delta;
// //   const east = lng + delta;
// //
// //   const overpassQuery = `
// //     [out:json][timeout:25];
// //     node["tourism"="hotel"](${south},${west},${north},${east});
// //     out ${40};
// //   `;
// //
// //   const overpassRes = await axios.post(
// //     'https://overpass-api.de/api/interpreter',
// //     overpassQuery,
// //     { headers: { 'Content-Type': 'text/plain' } }
// //   );
// //
// //   return overpassRes.data.elements || [];
// // };
// //
// // router.get('/', async (req, res) => {
// //   const city = req.query.city || 'Paris';
// //
// //   // Search & filters
// //   const search = req.query.search || '';
// //   const minPrice = parseFloat(req.query.minPrice) || 0;
// //   const maxPrice = parseFloat(req.query.maxPrice) || 10000;
// //   const stars = req.query.stars ? parseFloat(req.query.stars) : null;
// //   const amenities = req.query.amenities ? req.query.amenities.split(',') : [];
// //   const sortBy = req.query.sortBy || 'price';
// //   const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
// //   const page = parseInt(req.query.page) || 1;
// //   const limit = parseInt(req.query.limit) || 10;
// //   const offset = (page - 1) * limit;
// //
// //   try {
// //     // 1️⃣ External hotels cache (24h)
// //     let externalHotels = await Hotel.findAll({
// //       where: {
// //         cityName: city,
// //         source: 'external',
// //         updatedAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
// //       },
// //       include: Room
// //     });
// //
// //     if (externalHotels.length === 0) {
// //       // Fetch external API hotels
// //       const externalRes = await axios.get(`https://api.example.com/hotels?city=${city}`);
// //       const apiHotels = externalRes.data;
// //
// //       const dbHotels = await Hotel.findAll({ where: { cityName: city, source: 'external' } });
// //       const dbIds = dbHotels.map(h => h.external_id);
// //       const apiIds = apiHotels.map(h => h.id.toString());
// //
// //       // Upsert external hotels + rooms
// //       for (let h of apiHotels) {
// //         const [hotelInstance] = await Hotel.upsert({
// //           external_id: h.id,
// //           name: h.name,
// //           image_url: h.image,
// //           cityName: city,
// //           source: 'external',
// //           stars: h.stars || 4
// //         });
// //
// //         if (h.rooms) {
// //           const dbRooms = await Room.findAll({ where: { hotelId: hotelInstance.id } });
// //           const dbRoomNames = dbRooms.map(r => r.name);
// //           const apiRoomNames = h.rooms.map(r => r.name);
// //
// //           for (let r of h.rooms) {
// //             await Room.upsert({
// //               hotelId: hotelInstance.id,
// //               name: r.name,
// //               price: r.price || 100,
// //               amenities: r.amenities || []
// //             });
// //           }
// //
// //           // Delete removed rooms
// //           const toDelete = dbRoomNames.filter(n => !apiRoomNames.includes(n));
// //           if (toDelete.length) {
// //             await Room.destroy({ where: { hotelId: hotelInstance.id, name: toDelete } });
// //           }
// //         }
// //       }
// //
// //       // Delete removed hotels
// //       const idsToDelete = dbIds.filter(id => !apiIds.includes(id));
// //       if (idsToDelete.length) {
// //         await Hotel.destroy({
// //           where: { external_id: { [Op.in]: idsToDelete }, cityName: city, source: 'external' }
// //         });
// //       }
// //
// //       externalHotels = await Hotel.findAll({ where: { cityName: city, source: 'external' }, include: Room });
// //     }
// //
// //     // 2️⃣ Custom hotels
// //     const customHotels = await Hotel.findAll({ where: { cityName: city, source: 'custom' }, include: Room });
// //
// //     // 3️⃣ OSM hotels (Overpass API)
// //     const osmHotelsRaw = await getOverpassHotels(city);
// //     for (let h of osmHotelsRaw) {
// //       await Hotel.upsert({
// //         external_id: h.id,
// //         name: h.tags?.name || 'Unnamed Hotel',
// //         image_url: h.tags?.image || null,
// //         cityName: city,
// //         source: 'osm',
// //         stars: h.tags?.stars || 3
// //       });
// //     }
// //     const osmHotels = await Hotel.findAll({ where: { cityName: city, source: 'osm' }, include: Room });
// //
// //     // Merge all hotels
// //     let allHotels = [...externalHotels, ...customHotels, ...osmHotels];
// //
// //     // 4️⃣ SEARCH filter
// //     if (search) allHotels = allHotels.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
// //
// //     // 5️⃣ STAR filter
// //     if (stars) allHotels = allHotels.filter(h => h.stars >= stars);
// //
// //     // 6️⃣ PRICE & AMENITIES filter
// //     allHotels = allHotels.filter(h => {
// //       return h.Rooms.some(r => {
// //         const priceOk = r.price >= minPrice && r.price <= maxPrice;
// //         const amenitiesOk = amenities.length === 0 || amenities.every(a => (r.amenities || []).includes(a));
// //         return priceOk && amenitiesOk;
// //       });
// //     });
// //
// //     // 7️⃣ SORT
// //     allHotels.sort((a, b) => {
// //       if (sortBy === 'rating') return order === 'ASC' ? a.stars - b.stars : b.stars - a.stars;
// //       const aPrice = Math.min(...a.Rooms.map(r => r.price));
// //       const bPrice = Math.min(...b.Rooms.map(r => r.price));
// //       return order === 'ASC' ? aPrice - bPrice : bPrice - aPrice;
// //     });
// //
// //     // 8️⃣ PAGINATION
// //     const total = allHotels.length;
// //     const paginated = allHotels.slice(offset, offset + limit);
// //
// //     // 9️⃣ Normalize response
// //     const result = paginated.map(h => ({
// //       id: h.source === 'external' ? `api_${h.external_id}` : h.source === 'osm' ? `osm_${h.external_id}` : `custom_${h.id}`,
// //       name: h.name,
// //       image: h.image_url,
// //       stars: h.stars,
// //       source: h.source,
// //       rooms: h.Rooms.map(r => ({ name: r.name, price: r.price, amenities: r.amenities }))
// //     }));
// //
// //     res.json({ page, limit, total, hotels: result });
// //
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });
// //
//
//
// import { Router } from 'express';
// import { Op } from 'sequelize';
// import axios from 'axios';
// import Hotel from '../models/Hotels.js';
// import Room from '../models/Room.js';
// import {createFullHotel} from "../controllers/hotel.js";
//
// const router = Router();
//
// // ✅ Overpass helper (optimized + safe)
// const getOverpassHotels = async (city) => {
//   try {
//     const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
//       params: { key: process.env.OPENCAGE_API_KEY, q: city, limit: 1 }
//     });
//
//     const geoData = geoRes.data.results;
//     if (!geoData.length) return [];
//
//     const { lat, lng } = geoData[0].geometry;
//
//     const delta = 0.05;
//     const south = lat - delta;
//     const north = lat + delta;
//     const west = lng - delta;
//     const east = lng + delta;
//
//     const query = `
//       [out:json][timeout:50];
//       (
//         node["tourism"="hotel"](${south},${west},${north},${east});
//         way["tourism"="hotel"](${south},${west},${north},${east});
//         relation["tourism"="hotel"](${south},${west},${north},${east});
//       );
//       out center 30;
//     `;
//
//     const res = await axios.post(
//       'https://overpass-api.de/api/interpreter',
//       query,
//       {
//         headers: { 'Content-Type': 'text/plain' },
//         timeout: 10000
//       }
//     );
//
//     return res.data.elements || [];
//
//   } catch (err) {
//     console.log('Overpass failed, skipping...');
//     return [];
//   }
// };
//
// router.get('/', async (req, res) => {
//   const city = req.query.city || 'Paris';
//
//   // Filters
//   const search = req.query.search || '';
//   const minPrice = parseFloat(req.query.minPrice) || 0;
//   const maxPrice = parseFloat(req.query.maxPrice) || 10000;
//   const stars = req.query.stars ? parseFloat(req.query.stars) : null;
//   const amenities = req.query.amenities ? req.query.amenities.split(',') : [];
//
//   const sortBy = req.query.sortBy || 'price';
//   const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
//
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;
//
//   try {
//     // =============================
//     // 1️⃣ EXTERNAL HOTELS (CACHE)
//     // =============================
//     let externalHotels = await Hotel.findAll({
//       where: {
//         cityName: city,
//         source: 'external',
//         updatedAt: {
//           [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
//         }
//       },
//       include: Room
//     });
//
//     if (externalHotels.length === 0) {
//       const externalRes = await axios.get(`https://api.example.com/hotels?city=${city}`);
//       const apiHotels = externalRes.data;
//
//       const dbHotels = await Hotel.findAll({
//         where: { cityName: city, source: 'external' }
//       });
//
//       const dbIds = dbHotels.map(h => h.external_id);
//       const apiIds = apiHotels.map(h => h.id.toString());
//
//       for (let h of apiHotels) {
//         const [hotelInstance] = await Hotel.upsert({
//           external_id: h.id,
//           name: h.name,
//           image_url: h.image,
//           cityName: city,
//           source: 'external',
//           stars: h.stars || 4
//         });
//
//         if (h.rooms) {
//           const dbRooms = await Room.findAll({ where: { hotelId: hotelInstance.id } });
//           const dbRoomNames = dbRooms.map(r => r.name);
//           const apiRoomNames = h.rooms.map(r => r.name);
//
//           for (let r of h.rooms) {
//             await Room.upsert({
//               hotelId: hotelInstance.id,
//               name: r.name,
//               price: r.price || 100,
//               amenities: r.amenities || []
//             });
//           }
//
//           const toDelete = dbRoomNames.filter(n => !apiRoomNames.includes(n));
//           if (toDelete.length) {
//             await Room.destroy({
//               where: { hotelId: hotelInstance.id, name: toDelete }
//             });
//           }
//         }
//       }
//
//       const idsToDelete = dbIds.filter(id => !apiIds.includes(id));
//       if (idsToDelete.length) {
//         await Hotel.destroy({
//           where: {
//             external_id: { [Op.in]: idsToDelete },
//             cityName: city,
//             source: 'external'
//           }
//         });
//       }
//
//       externalHotels = await Hotel.findAll({
//         where: { cityName: city, source: 'external' },
//         include: Room
//       });
//     }
//
//     // =============================
//     // 2️⃣ CUSTOM HOTELS
//     // =============================
//     const customHotels = await Hotel.findAll({
//       where: { cityName: city, source: 'custom' },
//       include: Room
//     });
//
//     // =============================
//     // 3️⃣ OSM HOTELS (CACHE)
//     // =============================
//     let osmHotels;
//
//     const freshOsm = await Hotel.findAll({
//       where: {
//         cityName: city,
//         source: 'osm',
//         updatedAt: {
//           [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
//         }
//       }
//     });
//
//     if (freshOsm.length === 0) {
//       const osmRaw = await getOverpassHotels(city);
//
//       for (let h of osmRaw) {
//         const lat = h.lat || h.center?.lat;
//         const lng = h.lon || h.center?.lon;
//
//         const [hotelInstance] = await Hotel.upsert({
//           external_id: h.id,
//           name: h.tags?.name || 'Unnamed Hotel',
//           image_url: h.tags?.image || null,
//           cityName: city,
//           source: 'osm',
//           stars: h.tags?.stars || 3,
//           lat,
//           lng
//         });
//
//         // ✅ default room
//         await Room.upsert({
//           hotelId: hotelInstance.id,
//           name: 'Standard Room',
//           price: 80,
//           amenities: []
//         });
//       }
//     }
//
//     osmHotels = await Hotel.findAll({
//       where: { cityName: city, source: 'osm' },
//       include: Room
//     });
//
//     // =============================
//     // MERGE
//     // =============================
//     let allHotels = [...externalHotels, ...customHotels, ...osmHotels];
//
//     // SEARCH
//     if (search) {
//       allHotels = allHotels.filter(h =>
//         h.name.toLowerCase().includes(search.toLowerCase())
//       );
//     }
//
//     // STARS
//     if (stars) {
//       allHotels = allHotels.filter(h => h.stars >= stars);
//     }
//
//     // PRICE + AMENITIES
//     allHotels = allHotels.filter(h => {
//       return (h.Rooms || []).some(r => {
//         const priceOk = r.price >= minPrice && r.price <= maxPrice;
//         const amenitiesOk =
//           amenities.length === 0 ||
//           amenities.every(a => (r.amenities || []).includes(a));
//
//         return priceOk && amenitiesOk;
//       });
//     });
//
//     // SORT
//     allHotels.sort((a, b) => {
//       if (sortBy === 'rating') {
//         return order === 'ASC' ? a.stars - b.stars : b.stars - a.stars;
//       }
//
//       const aPrice = Math.min(...(a.Rooms?.map(r => r.price) || [0]));
//       const bPrice = Math.min(...(b.Rooms?.map(r => r.price) || [0]));
//
//       return order === 'ASC' ? aPrice - bPrice : bPrice - aPrice;
//     });
//
//     // PAGINATION
//     const total = allHotels.length;
//     const paginated = allHotels.slice(offset, offset + limit);
//
//     // RESPONSE
//     const result = paginated.map(h => ({
//       id:
//         h.source === 'external'
//           ? `api_${h.external_id}`
//           : h.source === 'osm'
//             ? `osm_${h.external_id}`
//             : `custom_${h.id}`,
//       name: h.name,
//       image: h.image_url,
//       stars: h.stars,
//       source: h.source,
//       rooms: (h.Rooms || []).map(r => ({
//         name: r.name,
//         price: r.price,
//         amenities: r.amenities
//       }))
//     }));
//
//     res.json({
//       page,
//       limit,
//       total,
//       hotels: result
//     });
//
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
//
//
//
//
//
//
// router.post("/full-hotel", createFullHotel);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// export default router;
//
// // router.get('/', async (req, res) => {
// //   const city = req.query.city || 'Paris';
// //
// //   // 🔍 search
// //   const search = req.query.search || '';
// //   const minPrice = parseFloat(req.query.minPrice) || 0;
// //   const maxPrice = parseFloat(req.query.maxPrice) || 10000;
// //
// //   // 🧭 filter
// //   const stars = req.query.stars ? parseFloat(req.query.stars) : null;
// //   const amenities = req.query.amenities ? req.query.amenities.split(',') : [];
// //
// //   // 📊 sorting
// //   const sortBy = req.query.sortBy || 'price'; // price | rating
// //   const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
// //
// //   // 📄 pagination
// //   const page = parseInt(req.query.page) || 1;
// //   const limit = parseInt(req.query.limit) || 10;
// //   const offset = (page - 1) * limit;
// //
// //   try {
// //     // ⏱ cache check (24h)
// //     const freshHotels = await Hotel.findAll({
// //       where: {
// //         cityName: city,
// //         source: 'external',
// //         updatedAt: {
// //           [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
// //         }
// //       }
// //     });
// //
// //     let externalHotels = [];
// //
// //     if (freshHotels.length === 0) {
// //       const externalHotelsRaw = await axios.get(
// //         `https://api.example.com/hotels?city=${city}`
// //       );
// //
// //       const apiHotels = externalHotelsRaw.data;
// //
// //       const apiIds = apiHotels.map(h => h.id.toString());
// //
// //       const dbHotels = await Hotel.findAll({
// //         where: { cityName: city, source: 'external' }
// //       });
// //
// //       const dbIds = dbHotels.map(h => h.external_id);
// //
// //       // 🔄 upsert hotels
// //       for (let h of apiHotels) {
// //
// //         const [hotelInstance] = await Hotel.upsert({
// //           external_id: h.id,
// //           name: h.name,
// //           image_url: h.image,
// //           cityName: city,
// //           source: 'external',
// //           stars: h.stars || 4
// //         });
// //
// //         // 🧩 ROOM SYNC
// //         if (h.rooms) {
// //           const dbRooms = await Room.findAll({
// //             where: { hotelId: hotelInstance.id }
// //           });
// //
// //           const dbRoomNames = dbRooms.map(r => r.name);
// //           const apiRoomNames = h.rooms.map(r => r.name);
// //
// //           for (let r of h.rooms) {
// //             await Room.upsert({
// //               hotelId: hotelInstance.id,
// //               name: r.name,
// //               price: r.price || 100,
// //               amenities: r.amenities || []
// //             });
// //           }
// //
// //           const toDelete = dbRoomNames.filter(n => !apiRoomNames.includes(n));
// //
// //           if (toDelete.length) {
// //             await Room.destroy({
// //               where: { hotelId: hotelInstance.id, name: toDelete }
// //             });
// //           }
// //         }
// //       }
// //
// //       // ❌ delete removed hotels
// //       const idsToDelete = dbIds.filter(id => !apiIds.includes(id));
// //
// //       if (idsToDelete.length) {
// //         await Hotel.destroy({
// //           where: {
// //             external_id: { [Op.in]: idsToDelete },
// //             cityName: city,
// //             source: 'external'
// //           }
// //         });
// //       }
// //
// //       externalHotels = await Hotel.findAll({
// //         where: { cityName: city, source: 'external' },
// //         include: Room
// //       });
// //
// //     } else {
// //       externalHotels = await Hotel.findAll({
// //         where: { cityName: city, source: 'external' },
// //         include: Room
// //       });
// //     }
// //
// //     // 🏨 custom hotels
// //     const customHotels = await Hotel.findAll({
// //       where: { cityName: city, source: 'custom' },
// //       include: Room
// //     });
// //
// //     let allHotels = [...externalHotels, ...customHotels];
// //
// //     // 🔍 SEARCH (name)
// //     if (search) {
// //       allHotels = allHotels.filter(h =>
// //         h.name.toLowerCase().includes(search.toLowerCase())
// //       );
// //     }
// //
// //     // 🧭 FILTER (stars)
// //     if (stars) {
// //       allHotels = allHotels.filter(h => h.stars >= stars);
// //     }
// //
// //     // 🧭 FILTER (price + amenities)
// //     allHotels = allHotels.filter(h => {
// //       const hasValidRoom = h.Rooms.some(r => {
// //         const priceOk = r.price >= minPrice && r.price <= maxPrice;
// //
// //         const amenitiesOk =
// //           amenities.length === 0 ||
// //           amenities.every(a => (r.amenities || []).includes(a));
// //
// //         return priceOk && amenitiesOk;
// //       });
// //
// //       return hasValidRoom;
// //     });
// //
// //     // 📊 SORT
// //     allHotels.sort((a, b) => {
// //       if (sortBy === 'rating') {
// //         return order === 'ASC' ? a.stars - b.stars : b.stars - a.stars;
// //       }
// //
// //       // price sort (min room price)
// //       const aPrice = Math.min(...a.Rooms.map(r => r.price));
// //       const bPrice = Math.min(...b.Rooms.map(r => r.price));
// //
// //       return order === 'ASC' ? aPrice - bPrice : bPrice - aPrice;
// //     });
// //
// //     // 📄 PAGINATION
// //     const total = allHotels.length;
// //     const paginated = allHotels.slice(offset, offset + limit);
// //
// //     // 🎯 normalize response
// //     const result = paginated.map(h => ({
// //       id: h.source === 'external' ? `api_${h.external_id}` : `custom_${h.id}`,
// //       name: h.name,
// //       image: h.image_url,
// //       stars: h.stars,
// //       source: h.source,
// //       rooms: h.Rooms.map(r => ({
// //         name: r.name,
// //         price: r.price,
// //         amenities: r.amenities
// //       }))
// //     }));
// //
// //     console.log(result,123456789)
// //     res.json({
// //       page,
// //       limit,
// //       total,
// //       hotels: result
// //     });
// //
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });
//
//
//
