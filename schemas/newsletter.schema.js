import Joi from "joi";

export default {
  subscribe: {
    body: Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .lowercase()
        .trim()
        .required()
    })
  }
};
