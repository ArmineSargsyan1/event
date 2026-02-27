import User from './User.js';
import Event from './Event.js';

export {default as User} from "./User.js";
export { default as Event } from './Event.js';
export { default as UserEvents } from './UserEvents.js';



User.belongsToMany(Event, { through: 'UserEvents', as: 'registeredEvents' });
Event.belongsToMany(User, { through: 'UserEvents', as: 'participants' });
