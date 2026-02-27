import Joi from 'joi';

export default {
  createEvent: {
    body: Joi.object({
      title: Joi.string().min(3).max(100).required(),
      description: Joi.string().min(1).required(),
      date: Joi.date().iso().required(),
      location: Joi.string().min(2).max(200).required(),
    }),
  },


  updateEvent: {
    body: Joi.object({
      title: Joi.string().min(3).max(100),
      description: Joi.string().min(1),
      date: Joi.date().iso(),
      location: Joi.string().min(2).max(200),
    }),

    // params: {
    //   id: Joi.number().integer().positive().required()
    // }
  },


}
