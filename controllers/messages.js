import Messages from '../models/Messages.js';
import Users from "../models/User.js";
import {Op} from "sequelize";
import Socket from "../services/Socket.js";

export default {

  async GetUser(req, res, next) {
    try {
      res.json({
        users: await Users.findAll({
          where: {id: {[Op.ne]: +req.userId}}
        }),
      });
    } catch (e) {
      next(e);
    }
  },

  async GetMessages(req, res, next) {
    try {
      const {to} = req.query;
      console.log(+to, +req.userId)

      res.json({
        messages: await Messages.findAll({
          where: {
            [Op.or]: [
              {from: +req.userId, to: +to},
              {
                from: +to, to: +req.userId,
              }
            ]
          }
        })
      });
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  },


  async CreateMessage(req, res, next) {
    try {
      const {
        message,
        to,
      } = req.body;


      await Messages.create({
        from: +req.userId,
        to: +to,
        message
      })


      Socket.io
        .to(`user_${to}`)
        .emit('new_message', {
          from: +req.userId,
          to: +to,
          message
        });

      res.json({
        status: 'ok'
      });
    } catch (e) {
      console.log(e)
      next(e);
    }
  },


};
