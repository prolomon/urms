import Joi from 'joi';

const createNotificationSchema = Joi.object({
  userId: Joi.string().trim().required().messages({
    'string.base': 'User ID must be a string',
    'any.required': 'User ID is required',
  }),
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.base': 'Title must be a string',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must be at most 150 characters long',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().min(1).max(500).required().messages({
    'string.base': 'Description must be a string',
    'string.min': 'Description must be at least 1 character long',
    'string.max': 'Description must be at most 500 characters long',
    'any.required': 'Description is required',
  }),
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date',
  }),
  type: Joi.string()
    .uppercase()
    .valid('UPDATE', 'SUCCESS', 'FAILED', 'PENDING', 'REQUEST', 'REMINDER', 'WELCOME')
    .required()
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be one of UPDATE, SUCCESS, FAILED, PENDING, REQUEST, REMINDER, or WELCOME',
      'any.required': 'Type is required',
    }),
});

export { createNotificationSchema };
