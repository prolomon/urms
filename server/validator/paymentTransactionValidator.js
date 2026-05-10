import Joi from 'joi';

const createPaymentTransactionSchema = Joi.object({
  reference: Joi.string().trim().optional(),
  userId: Joi.string().trim().required().messages({
    'string.base': 'User ID must be a string',
    'any.required': 'User ID is required',
  }),
  pricingId: Joi.string().trim().required().messages({
    'string.base': 'Pricing ID must be a string',
    'any.required': 'Pricing ID is required',
  }),
  companyId: Joi.string().trim().optional().allow(null),
  centerId: Joi.string().trim().required().messages({
    'string.base': 'Center ID must be a string',
    'any.required': 'Center ID is required',
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be at least 0',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().trim().default('NGN').messages({
    'string.base': 'Currency must be a string',
  }),
  paymentId: Joi.string().trim().required().messages({
    'string.base': 'Payment ID must be a string',
    'any.required': 'Payment ID is required',
  }),
  date: Joi.date().optional(),
  type: Joi.string().valid('COMPLETE', 'PART_PAYMENT').default('COMPLETE').messages({
    'any.only': 'Type must be either COMPLETE or PART_PAYMENT',
  }),
  category: Joi.string().trim().optional().allow(null),
  name: Joi.string().trim().optional().allow(null),
  billing: Joi.string().valid('MONTHLY', 'QUARTERLY', 'YEARLY').default('MONTHLY').messages({
    'any.only': 'Billing must be MONTHLY, QUARTERLY, or YEARLY',
  }),
  status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED').default('PENDING').messages({
    'any.only': 'Status must be one of: PENDING, SUCCESS, FAILED, CANCELLED, REFUNDED',
  }),
  metadata: Joi.object().optional().allow(null),
});

const getPaymentTransactionSchema = Joi.object({
  userId: Joi.string().trim().required(),
  page: Joi.number().default(1),
  limit: Joi.number().default(20),
});

export { createPaymentTransactionSchema, getPaymentTransactionSchema };
