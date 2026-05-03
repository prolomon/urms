import Joi from 'joi';

const createPaymentSchema = Joi.object({
  reference: Joi.string().trim().optional().messages({
    'string.base': 'Reference must be a string',
  }),
  userId: Joi.string().trim().required().messages({
    'string.base': 'User ID must be a string',
    'any.required': 'User ID is required',
  }),
  businessName: Joi.string().trim().min(1).max(200).required().messages({
    'string.base': 'Business name must be a string',
    'string.min': 'Business name must be at least 1 character long',
    'string.max': 'Business name must be at most 200 characters long',
    'any.required': 'Business name is required',
  }),
  businessType: Joi.string()
    .required()
    .messages({
      'string.base': 'Business type must be a string',
      'any.only': 'Business type must be valid',
      'any.required': 'Business type is required',
    }),
  frequency: Joi.string()
    .uppercase()
    .valid('MONTHLY', 'YEARLY', 'QUARTERLY')
    .required()
    .messages({
      'string.base': 'Frequency must be a string',
      'any.only': 'Frequency must be one of MONTHLY, YEARLY, or QUARTERLY',
      'any.required': 'Frequency is required',
    }),
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date',
  }),
  due: Joi.date().optional().messages({
    'date.base': 'Due date must be a valid date',
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be at least 0',
    'any.required': 'Amount is required',
  }),
  payment: Joi.string()
    .required()
    .messages({
      'string.base': 'Payment must be a string',
      'any.only': 'Payment must be included',
      'any.required': 'Payment is required',
    }),
  status: Joi.string()
    .uppercase()
    .valid('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')
    .optional()
    .default('PENDING')
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of PENDING, COMPLETED, FAILED, CANCELLED, or REFUNDED',
    }),
});

export { createPaymentSchema };
