import Joi from 'joi';

const createPaymentSchema = Joi.object({
  reference: Joi.string().trim().optional().messages({
    'string.base': 'Reference must be a string',
  }),
  userId: Joi.string().trim().required().messages({
    'string.base': 'User ID must be a string',
    'any.required': 'User ID is required',
  }),
  sessions: Joi.array().items(Joi.string().trim()).optional().default([]).messages({
    'array.base': 'Sessions must be an array',
  }),
  frequency: Joi.string()
    .uppercase()
    .valid('MONTHLY', 'YEARLY', 'QUARTERLY')
    .default('MONTHLY')
    .required()
    .messages({
      'string.base': 'Frequency must be a string',
      'any.only': 'Frequency must be one of MONTHLY, YEARLY, or QUARTERLY',
      'any.required': 'Frequency is required',
    }),
  due: Joi.date().optional().messages({
    'date.base': 'Due date must be a valid date',
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be at least 0',
    'any.required': 'Amount is required',
  }),
  debt: Joi.number().min(0).optional().default(0).messages({
    'number.base': 'Debt must be a number',
    'number.min': 'Debt must be at least 0',
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
    isVerify: Joi.boolean().optional().default(false),
});

  const verifyPaymentSchema = Joi.object({
    amountPaid: Joi.number().min(0).optional().messages({
      'number.base': 'Amount paid must be a number',
      'number.min': 'Amount paid must be at least 0',
    }),
    session: Joi.alternatives()
      .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
      .optional()
      .messages({
        'alternatives.match': 'Session must be a string or array of strings',
      }),
    sessions: Joi.alternatives()
      .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
      .optional()
      .messages({
        'alternatives.match': 'Sessions must be a string or array of strings',
      }),
  });

  const updatePaymentScheduleSchema = Joi.object({
    frequency: Joi.string()
      .uppercase()
      .valid('MONTHLY', 'YEARLY', 'QUARTERLY')
      .required()
      .messages({
        'string.base': 'Frequency must be a string',
        'any.only': 'Frequency must be one of MONTHLY, YEARLY, or QUARTERLY',
        'any.required': 'Frequency is required',
      }),
    amount: Joi.number().min(0).required().messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Amount must be at least 0',
      'any.required': 'Amount is required',
    }),
    due: Joi.date().required().messages({
      'date.base': 'Due date must be a valid date',
      'any.required': 'Due date is required',
    }),
  });

  const makePaymentSchema = Joi.object({
    amount: Joi.number().min(100).required().messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Amount must be at least 0',
      'any.required': 'Amount is required',
    }),
    center: Joi.string().trim().optional().messages({
      'string.base': 'Center must be a string',
    }),
    company: Joi.string().trim().optional().messages({
      'string.base': 'Company must be a string',
    }),
  });

  export { createPaymentSchema, verifyPaymentSchema, updatePaymentScheduleSchema, makePaymentSchema };
