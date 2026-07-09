import Joi from 'joi';

export default {
  toggleFollow: {
    body: Joi.object({
      followingId: Joi.string().required().messages({
        'string.base': 'Following ID must be a string.',
        'string.empty': 'Following ID cannot be empty.',
        'any.required': 'Following ID is required.'
      })
    })
  },
};
