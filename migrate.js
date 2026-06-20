import * as Models from "./models/index.js";


(async () => {
  try {
    const list = [
      Models.User,
      Models.Newsletter,
      Models.Hotels,
      Models.HotelPhotos,
      Models.Amenity,
      Models.HotelAmenity,
      Models.Room,
      Models.RoomOption,
      Models.Accessibility,
      Models.RoomExtra,
      Models.RoomAmenities,
      Models.LocationPoint,
      Models.Reviews,
      Models.ReviewLiked,
      Models.ReviewReplies,
      Models.Photos,
      Models.Favorites,
      Models.Booking,
      Models.StripeEventLog,

    ];


    Object.values(Models).forEach(model => {
      if (typeof model.associate === "function") {
        model.associate(Models);
      }
    });


    for (const model of list) {
      await model.sync({alter: true});
      console.log(`${model.name} synced successfully`);


    }


  } catch (e) {
    console.error("Error:", e);
  }
})();





