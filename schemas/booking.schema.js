import Joi from 'joi';

export default {
  createEvent: {
    body: Joi.object({
      room_id: Joi.number()
        .integer()
        .positive()
        .required(),

      rate_plan_id: Joi.number()
        .integer()
        .positive()
        .required(),

      check_in: Joi.date()
        .iso()
        .greater("now")
        .required(),

      check_out: Joi.date()
        .iso()
        .greater(Joi.ref("check_in"))
        .required(),

      guests: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .required(),

    }),
  },

    // params: {
    //   id: Joi.number().integer().positive().required()
    // }
  }



