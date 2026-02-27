import Event from "../models/Event.js";
import {Op} from "sequelize";
import Socket from "../services/Socket.js";
import User from "../models/User.js";
import {sendMail} from "../services/mail.js";

export default {
  async getEvents(req, res) {
    try {
      const {search, page = 1, limit = 5} = req.query;

      const whereClause = search
        ? {
          [Op.or]: [
            {title: {[Op.like]: `%${search}%`}},
            {location: {[Op.like]: `%${search}%`}}
          ]
        }
        : {};

      const events = await Event.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [["date", "ASC"]],
      });

      res.json({
        total: events.count,
        pages: Math.ceil(events.count / limit),
        currentPage: parseInt(page),
        data: events.rows
      });

    } catch (error) {
      res.status(500).json({message: error.message});
    }
  },


  async createEvent(req, res) {

    try {
      const {title, description, date, location} = req.body;

      const event = await Event.create({
        title,
        description,
        date,
        location,
        image: req.file?.path || null,
        UserId: req.userId,
      });

      Socket.emit(`user_${user.id}`, {action: "created", event}, "event_update");

      const user = await User.findByPk(req.userId);
      console.log(user.email, 9666)
      if (user?.email) {
        await sendMail({
          to: user.email,
          subject: `The event has been created: ${event.title}`,
          template: "event_create",
          templateData: {title: event.title, date: event.date},
        });
      }

      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({message: "Server error. Could not create event."});
    }
  },


  async updateEvent(req, res) {
    const {title, description, date, location} = req.body;

    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) return res.status(404).json({message: "Event not found"});

      await event.update({
        title: title ?? event.title,
        description: description ?? event.description,
        date: date ?? event.date,
        location: location ?? event.location,
        image: req.file?.path ?? event.image,
      });

      const registeredUsers = await event.getParticipants();


      await Promise.all(
        registeredUsers.map(user =>
          Socket.emit(
            `user_${user.id}`,
            {action: "updated", event},
            "event_update"
          )
        )
      );

      for (const user of registeredUsers) {
        if (user.email) {
          await sendMail({
            to: user.email,
            subject: `The event has been updated: ${event.title}`,
            template: "event_updated",
            templateData: {name: event.title, date: event.date},
          });
        }
      }

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({message: "Server error. Could not update event."});
    }
  },

  async registerForEvent(req, res) {
    try {
      const {eventId} = req.params;
      const userId = req.userId;

      const event = await Event.findByPk(eventId);

      if (!event) return res.status(404).json({message: "Event not found"});

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({message: "User not found"});

      await event.addParticipant(user);

      if (user.email) {
        await sendMail({
          to: user.email,
          subject: `You have registered for: ${event.title}`,
          template: "event_register",
          templateData: {name: event.title, date: event.date},
        });
      }

      Socket.emit(`user_${user.id}`, {action: "registered", event, user}, "event_update");

      res.json({message: "Successfully registered for the event", event});
    } catch (error) {
      res.status(500).json({message: "Server error. Could not register."});
    }
  },

  async getUserEvents(req, res) {
    try {

      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({message: "User not found"});

      const events = await user.getEvents({
        order: [["date", "ASC"]],
      });

      res.json(events);
    } catch (error) {
      res.status(500).json({message: error.message});
    }
  },

  async deleteEvent(req, res) {
    try {
      const event = await Event.findByPk(req.params.id);

      if (!event)
        return res.status(404).json({message: "Event not found"});

      if (event.UserId !== req.user.id)
        return res.status(403).json({message: "Not authorized"});

      await event.destroy();

      res.json({message: "Event deleted successfully"});
    } catch (error) {
      res.status(500).json({message: error.message});
    }
  },
}
