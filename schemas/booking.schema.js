import Joi from "joi";

export default {
  createBooking: {
    body: Joi.object({
      room_id: Joi.number()
        .integer()
        .positive()
        .required(),

      option_id: Joi.number()
        .integer()
        .positive()
        .required(),

      check_in: Joi.date()
        .iso()
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

  params: {
    id: Joi.object({
      id: Joi.number()
        .integer()
        .positive()
        .required(),
    }),
  },
};
