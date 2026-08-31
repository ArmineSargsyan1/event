import Joi from "joi";

export default {
  createReservation: {
    body: Joi.object({
      restaurantId: Joi.number()
        .integer()
        .positive()
        .required(),

      guestsCount: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .required(),

      comment: Joi.string()
        .max(500)
        .allow('')
        .optional(),

      reservationDate: Joi.date()
        .iso()
        .greater("now")
        .required()
        .messages({
          "date.greater": "Cannot be booked for past time",
          "date.base": "Incorrect date format"
        })
    }),
  },

  cancelReservation: {
    params: Joi.object({
      id: Joi.number()
        .integer()
        .positive()
        .required(),
    }),
  },
};
