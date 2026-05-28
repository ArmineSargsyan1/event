import axios from "axios";
import Regions from "../models/Regions.js";
import Neighborhoods from "../models/Neighborhoods.js";
import POI from "../models/Poi.js";
import Airports from "../models/Airports.js";
import Hotels from "../models/Hotels.js";


// utils/geo.js

// --------------------
// 🔹 Utility: nearest city
// --------------------
export function findNearestCityWithDistance(lat, long, cities) {
  if (lat == null || long == null || isNaN(lat) || isNaN(long)) return null;

  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // km
  let nearestCity = null;
  let minDist = Infinity;

  for (const city of cities) {
    if (city.lat == null || city.long == null) continue;

    const dLat = toRad(city.lat - lat);
    const dLon = toRad(city.long - long);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(city.lat)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    if (dist < minDist) {
      minDist = dist;
      nearestCity = { gaia_id: city.gaia_id, distance_km: Number(dist.toFixed(2)) };
    }
  }

  return nearestCity;
}

// --------------------
// 🔹 Utility: fetch Overpass nodes
// --------------------
async function fetchOverpassNodes(lat, lng, delta = 0.05, type = "hotel", limit = 20) {
  const south = lat - delta;
  const north = lat + delta;
  const west = lng - delta;
  const east = lng + delta;

  const overpassQuery = `
    [out:json][timeout:40];
    node["tourism"="${type}"](${south},${west},${north},${east});
    out ${limit};
  `;



  const overpassRes = await axios.post(
    'https://overpass-api.de/api/interpreter',
    overpassQuery,
    { headers: { 'Content-Type': 'text/plain' } }
  );

  return overpassRes.data.elements.map(el => ({
    id: el.id,
    lat: el.lat,
    lon: el.lon,
    tags: el.tags || {}
  }));
}

// --------------------
// 🟢 Main batch function
// --------------------
export default async function fetchRegionsBatch(queries) {
  try {
    for (const query of queries) {
      // 1️⃣ Fetch from RapidAPI (Hotels.com)
      const response = await axios.get(
        "https://hotels-com-provider.p.rapidapi.com/v2/regions",
        {
          params: { query, locale: "es_AR", domain: "AR" },
          headers: {
            "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
            "x-rapidapi-key": process.env.RAPIDAPI_KEY
          }
        }
      );

      const regions = response.data.data;

      // 2️⃣ Extract cities for nearest calculation
      const cities = regions
        .filter(r => r.type === "CITY")
        .map(c => ({
          gaia_id: c.gaiaId,
          lat: parseFloat(c.coordinates?.lat),
          long: parseFloat(c.coordinates?.long)
        }))
        .filter(c => !isNaN(c.lat) && !isNaN(c.long));

      const cache = new Map();
      const getKey = (lat, long) => `${lat.toFixed(3)},${long.toFixed(3)}`;

      // 3️⃣ Loop over regions from RapidAPI
      for (const r of regions) {
        console.log(8)
        const { type, gaiaId, hotelId, name, regionNames = {}, coordinates = {}, hierarchyInfo = {} } = r;
        const countryObj = hierarchyInfo.country || {};
        const lat = parseFloat(coordinates.lat);
        const long = parseFloat(coordinates.long);

        let nearestCityObj = null;
        if (!isNaN(lat) && !isNaN(long)) {
          const key = getKey(lat, long);
          nearestCityObj = cache.get(key);
          if (!nearestCityObj) {
            nearestCityObj = findNearestCityWithDistance(lat, long, cities);
            cache.set(key, nearestCityObj);
          }
        }

        // Save region types
        if (["CITY", "NEIGHBORHOOD", "POI", "AIRPORT"].includes(type) && gaiaId) {
          await Regions.upsert({
            gaia_id: gaiaId,
            name: regionNames.shortName || name,
            full_name: regionNames.fullName || name,
            type,
            country: countryObj.isoCode2 || null,
            country_iso3: countryObj.isoCode3 || null,
            country_name: countryObj.name || null,
            lat: isNaN(lat) ? null : lat,
            long: isNaN(long) ? null : long
          });
        }

        if (type === "NEIGHBORHOOD" && gaiaId) {
          await Neighborhoods.upsert({
            gaia_id: gaiaId,
            name: regionNames.shortName || name,
            full_name: regionNames.fullName || name,
            lat: isNaN(lat) ? null : lat,
            long: isNaN(long) ? null : long,
            region_id: nearestCityObj?.gaia_id || null,
            distance_km: nearestCityObj?.distance_km || null
          });
        }

        if (type === "AIRPORT" && hierarchyInfo.airport) {
          const airport = hierarchyInfo.airport;
          await Airports.upsert({
            airport_id: airport.airportId,
            code: airport.airportCode,
            name: regionNames.fullName || name,
            lat: isNaN(lat) ? null : lat,
            long: isNaN(long) ? null : long,
            region_id: nearestCityObj?.gaia_id || null,
            distance_km: nearestCityObj?.distance_km || null
          });
        }

        if (type === "POI" && gaiaId) {
          await POI.upsert({
            gaia_id: gaiaId,
            name: regionNames.shortName || name,
            full_name: regionNames.fullName || name,
            lat: isNaN(lat) ? null : lat,
            long: isNaN(long) ? null : long,
            region_id: nearestCityObj?.gaia_id || null,
            distance_km: nearestCityObj?.distance_km || null
          });
        }

        if (type === "HOTEL" && hotelId) {
          console.log(hotelId,1234)
          await Hotels.upsert({
            hotel_id: hotelId,
            name: regionNames.fullName || name,
            lat: isNaN(lat) ? null : lat,
            long: isNaN(long) ? null : long,
            city_id: nearestCityObj?.gaia_id || r.cityId || null,
            distance_km: nearestCityObj?.distance_km || null
          });
        }
      }

      // 4️⃣ Fetch Overpass nodes for extra Hyuranoc
      for (const city of cities) {
        // Fetch hotel nodes instead of attractions
        const hotels = await fetchOverpassNodes(city.lat, city.long, 0.05, "hotel");

        for (const hotel of hotels) {
          const nearestCityObj = findNearestCityWithDistance(hotel.lat, hotel.lon, cities);
          console.log(hotel,5555)
          await Hotels.upsert({
            hotel_id: hotel.id,
            name: hotel.tags.name || null,
            lat: hotel.lat,
            long: hotel.lon,
            city_id: nearestCityObj?.gaia_id || null,
            distance_km: nearestCityObj?.distance_km || null,

            check_date: hotel.tags.check_date || null,
            contact_housenumber: hotel.tags['contact:housenumber'] || null,
            contact_postcode: hotel.tags['contact:postcode'] || null,
            email: hotel.tags.email || null,
            phone: hotel.tags.phone || null,
            stars: hotel.tags.stars ? parseInt(hotel.tags.stars) : null,
            website: hotel.tags.website || null,


            // name: DataTypes.STRING,
            // lat: DataTypes.FLOAT,
            // long: DataTypes.FLOAT,
            // city_id: DataTypes.STRING
          });
        }
      }

      console.log(`Synced city batch: ${query}`);
    }

    console.log("All cities & hyuranoc synced successfully!");
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}






