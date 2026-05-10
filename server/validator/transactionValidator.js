import Joi from 'joi';

const createTransactionSchema = Joi.object({
  reference: Joi.string().trim().min(1).required().messages({
    'string.base': 'Reference must be a string',
    'string.empty': 'Reference is required',
    'any.required': 'Reference is required',
  }),
  event: Joi.string().trim().min(1).required().messages({
    'string.base': 'Event must be a string',
    'string.empty': 'Event is required',
    'any.required': 'Event is required',
  }),
  status: Joi.string()
    .uppercase()
    .valid('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED')
    .optional()
    .default('PENDING')
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of PENDING, SUCCESS, FAILED, REFUNDED, or CANCELLED',
    }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be at least 0',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().trim().uppercase().max(10).optional().default('NGN').messages({
    'string.base': 'Currency must be a string',
    'string.max': 'Currency must not exceed 10 characters',
  }),
  channel: Joi.string().trim().max(100).optional().allow(null, '').messages({
    'string.base': 'Channel must be a string',
    'string.max': 'Channel must not exceed 100 characters',
  }),
  gatewayResponse: Joi.string().trim().max(255).optional().allow(null, '').messages({
    'string.base': 'Gateway response must be a string',
    'string.max': 'Gateway response must not exceed 255 characters',
  }),
  customerEmail: Joi.string().email().trim().optional().allow(null, '').messages({
    'string.email': 'Customer email must be valid',
  }),
  merchantTxRef: Joi.string().trim().optional().allow(null, '').messages({
    'string.base': 'Merchant transaction reference must be a string',
  }),
  paymentId: Joi.string().trim().optional().allow(null, '').messages({
    'string.base': 'Payment ID must be a string',
  }),
  userId: Joi.string().trim().optional().allow(null, '').messages({
    'string.base': 'User ID must be a string',
  }),
  metadata: Joi.object().optional().messages({
    'object.base': 'Metadata must be an object',
  }),
});

export { createTransactionSchema };