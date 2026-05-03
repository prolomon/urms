import Joi from 'joi';

const paymentDistributionSchema = Joi.object({
  main: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Main value must be a number',
      'number.min': 'Main value must be at least 0',
      'number.max': 'Main value cannot exceed 100',
      'any.required': 'Main value is required',
    }),
  agent: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Agent value must be a number',
      'number.min': 'Agent value must be at least 0',
      'number.max': 'Agent value cannot exceed 100',
      'any.required': 'Agent value is required',
    }),
  operation: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Operation value must be a number',
      'number.min': 'Operation value must be at least 0',
      'number.max': 'Operation value cannot exceed 100',
      'any.required': 'Operation value is required',
    }),
  technology: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Technology value must be a number',
      'number.min': 'Technology value must be at least 0',
      'number.max': 'Technology value cannot exceed 100',
      'any.required': 'Technology value is required',
    }),
  userId: Joi.string()
    .required()
    .messages({
      'string.base': 'User ID must be a string',
      'any.required': 'User ID is required',
    }),
});

export { paymentDistributionSchema };
