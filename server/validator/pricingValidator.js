import Joi from 'joi';

const createPricingSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title is required',
    'string.max': 'Title must be at most 200 characters',
    'any.required': 'Title is required',
  }),
  price: Joi.string().required().messages({
    'string.base': 'Price must be a string',
    'string.empty': 'Price is required',
    'any.required': 'Price is required',
  }),
  type: Joi.string().valid('BUSINESS', 'INDIVIDUAL').required().messages({
    'any.only': 'Type must be either BUSINESS or INDIVIDUAL',
    'any.required': 'Type is required',
  }),
  category: Joi.string().optional().messages({
    'any.only': 'Category must not be empty',
  }),
  benefit: Joi.string().optional().messages({
    'string.base': 'Benefit must be a string',
  }),
  userId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'User ID must be a string',
  }),
});

const updatePricingSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.base': 'Title must be a string',
    'string.max': 'Title must be at most 200 characters',
  }),
  price: Joi.string().optional().messages({
    'string.base': 'Price must be a string',
  }),
  type: Joi.string().valid('BUSINESS', 'INDIVIDUAL').optional().messages({
    'any.only': 'Type must be either BUSINESS or INDIVIDUAL',
  }),
  category: Joi.string().optional().messages({
    'any.only': 'Category must not be empty',
  }),
  benefit: Joi.string().optional().messages({
    'string.base': 'Benefit must be a string',
  }),
  center: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Center must be a string', 
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean',
  }),
});

export { createPricingSchema, updatePricingSchema };
