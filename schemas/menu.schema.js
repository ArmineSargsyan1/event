import Joi from 'joi';

export default {
  createMenuItem: {
    body: Joi.object({
      // 🔥 Դաշտերը փոխված են snake_case-ի, ինչպես ուղարկում է Frontend-ը FormData-ով
      restaurant_id: Joi.number()
        .integer()
        .positive()
        .required(),

      dish_id: Joi.number()
        .integer()
        .positive()
        .required(),

      price: Joi.number()
        .positive()
        .precision(2)
        .required(),

      // Joi.any()-ն թույլ է տալիս, որ ֆայլը (Binary File) հանգիստ անցնի վալիդացիան
      custom_image: Joi.any().optional().allow(null, ""),
    }),
  },

  updateMenuItem: {
    body: Joi.object({
      price: Joi.number()
        .positive()
        .precision(2)
        .required(),

      custom_image: Joi.any().optional().allow(null, ""),
    }),
  },
};
