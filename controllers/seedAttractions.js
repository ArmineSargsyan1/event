import slugify from "slugify";
import Attraction from "../models/Attraction.js"; // Տեղադրեք npm i slugify, եթե չկա

const GEOAPIFY_API_KEY = "99e2ef51b05b45b382d05d2bf86f3868";

const mapCategory = (categories = []) => {
  if (categories.includes("tourism.attraction.monastery") || categories.includes("religion.place_of_worship")) return "monastery";
  if (categories.includes("tourism.attraction.museum")) return "museum";
  if (categories.includes("tourism.attraction.fortress")) return "fortress";
  if (categories.includes("natural.mountain")) return "mountain";
  if (categories.includes("natural.water")) return "lake";

  // Default տարբերակ
  return "historical";
};

export const seedAttractions = async () => {
  try {
    console.log("⏳ Geoapify-ից տվյալների ստացումը սկսվեց...");

    // Կենտրոնը Երևանն է, շառավիղը՝ 150կմ (150000 մետր), որպեսզի ընդգրկի ողջ Հայաստանը
    const lat = 40.1792;
    const lon = 44.5152;
    const url = `https://geoapify.com{lon},${lat},150000&limit=30&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      console.log("❌ Ոչ մի տվյալ չգտնվեց API-ից:");
      return;
    }

    const attractionsToInsert = [];
    const usedSlugs = new Set();

    for (const item of data.features) {
      const props = item.properties;
      const coords = item.geometry.coordinates;

      // Բաց թողնել անանուն վայրերը
      if (!props.name) continue;

      // Ստեղծում ենք մաքուր URL slug (օր.՝ Garni Temple -> garni-template)
      let baseSlug = slugify(props.name, { lower: true, strict: true });

      // Խուսափում ենք կրկնվող slug-երից բազայի unique սահմանափակման համար
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
        latitude: coords[1], // Geoapify-ում երկրորդը latitude-ն է
        longitude: coords[0], // Geoapify-ում առաջինը longitude-ն է
        image: null, // Geoapify-ն անվճար նկարներ չի տալիս, հետագայում կարող եք ավելացնել Unsplash-ից
        rating: (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1), // Գեներացնում է ռեալիստիկ ռեյտինգ 4.2-ից 5.0-ի արանքում
        featured: Math.random() > 0.7 // Պատահականության սկզբունքով որոշ վայրեր դարձնում է featured
      });
    }

    console.log(`🔄 Պատրաստվում է բազա ներմուծվել ${attractionsToInsert.length} տեսարժան վայր...`);

    // BulkCreate-ը միանգամից մեկ հարցումով բոլոր տվյալները լցնում է MySQL բազա
    await Attraction.bulkCreate(attractionsToInsert, { ignoreDuplicates: true });

    console.log("✅ Հայաստանի տեսարժան վայրերը հաջողությամբ լցվեցին բազայի մեջ:");

  } catch (error) {
    console.error("❌ Seeder-ի աշխատանքի ժամանակ սխալ տեղի ունեցավ:", error);
  }
};
