import User from './User.js';
import Event from './Event.js';
import Room from './Room.js';
import Hotel from './Hotels.js';
import Booking from './Booking.js';

export {default as User} from "./User.js";
export { default as Event } from './Event.js';
export { default as UserEvents } from './UserEvents.js';
export { default as Booking } from './Booking.js';
export { default as Hotels} from './Hotels.js';
export { default as HotelPhotos} from './HotelPhotos.js';
export { default as HotelAmenity} from './HotelAmenity.js';
export { default as Room } from './Room.js';
export { default as RoomOption } from './RoomOption.js';
export { default as Amenity } from './Amenity.js';
export { default as Accessibility } from './Accessibility.js';
export { default as RoomExtra } from './RoomExtra.js';
export { default as LocationPoint } from './LocationPoint.js';
export { default as Reviews } from './Reviews.js';
export { default as ReviewLiked } from './ReviewLiked.js';
export { default as ReviewReplies } from './ReviewReplies.js';
export { default as Favorites } from './Favorites.js';

export { default as RoomAmenities } from './RoomAmenities.js';
export { default as Photos } from './Photo.js';


export { default as Regions } from './Regions.js';
export { default as Neighborhoods} from './Neighborhoods.js';
export { default as AirPorts } from './AirPorts.js';
export { default as Poi} from './Poi.js';



// User.belongsToMany(Event, { through: 'UserEvents', as: 'registeredEvents' });
// Event.belongsToMany(User, { through: 'UserEvents', as: 'participants' });
//
//
// Room.hasMany(Booking, { foreignKey: 'roomId' });
// Hotel.hasMany(Room, { foreignKey: 'hotelId' });



