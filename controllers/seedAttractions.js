import slugify from "slugify";
import Attraction from "../models/Attraction.js";

const GEOAPIFY_API_KEY = "99e2ef51b05b45b382d05d2bf86f3868";

const mapCategory = (categories = []) => {
  if (categories.includes("tourism.attraction.monastery") || categories.includes("religion.place_of_worship")) return "monastery";
  if (categories.includes("tourism.attraction.museum")) return "museum";
  if (categories.includes("tourism.attraction.fortress")) return "fortress";
  if (categories.includes("natural.mountain")) return "mountain";
  if (categories.includes("natural.water")) return "lake";

  return "historical";
};

export const seedAttractions = async () => {
  try {

    const lat = 40.1792;
    const lon = 44.5152;
    const url = `https://geoapify.com{lon},${lat},150000&limit=30&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return;
    }

    const attractionsToInsert = [];
    const usedSlugs = new Set();

    for (const item of data.features) {
      const props = item.properties;
      const coords = item.geometry.coordinates;

      if (!props.name) continue;

      let baseSlug = slugify(props.name, { lower: true, strict: true });

      let slug = baseSlug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);

      attractionsToInsert.push({
        name: props.name,
        slug: slug,
        category: mapCategory(props.categories),
        region: props.state || props.county || props.city || "Armenia",
        description: props.formatted || `${props.name} is a beautiful historic place located in Armenia.`,
        latitude: coords[1],
        longitude: coords[0],
        image: null,
        rating: (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1),
        featured: Math.random() > 0.7
      });
    }


    await Attraction.bulkCreate(attractionsToInsert, { ignoreDuplicates: true });


  } catch (error) {
    console.error( error);
  }
};
