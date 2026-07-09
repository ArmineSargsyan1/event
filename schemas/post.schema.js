import Joi from 'joi';

const MAX_MENTIONS = 20;

export default {
  createPost: {
    body: Joi.object({
      mediaUrl: Joi.string().uri().optional(),
      mediaType: Joi.string().valid('image', 'video').optional(),
      caption: Joi.string().max(2200).allow('', null).messages({
        'string.max': 'Caption cannot exceed 2200 characters.',
      }),
      location: Joi.string().max(100).allow('', null),
      latitude: Joi.number().min(-90).max(90).allow(null),
      longitude: Joi.number().min(-180).max(180).allow(null),
      mentions: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
      ).optional(),
    }).unknown(true),
  },

  updatePost: {
    body: Joi.object({
      caption: Joi.string().max(2200).allow('', null).messages({
        'string.max': 'Caption cannot exceed 2200 characters.',
      }),
      location: Joi.string().max(100).allow('', null),
    }),
  },
};
