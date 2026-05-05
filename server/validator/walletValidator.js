import Joi from "joi";

const createWalletSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "name is required",
  }),
  bvn: Joi.string().trim().required().messages({
    "any.required": "bvn is required",
  }),
  role: Joi.string().trim().uppercase().required().messages({
    "any.required": "role is required",
  }),
  id: Joi.string().trim().required().messages({
    "any.required": "id is required",
  })
});

const initiateTransferSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    "number.base": "amount must be a number",
    "number.greater": "amount must be greater than 0",
    "any.required": "amount is required",
  }),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "string.base": "accountNumber must be a string",
    "string.pattern.base": "accountNumber must be 10 digits",
    "any.required": "accountNumber is required",
  }),
  accountName: Joi.string().trim().min(2).max(150).required().messages({
    "string.base": "accountName must be a string",
    "string.min": "accountName must be at least 2 characters",
    "string.max": "accountName must be at most 150 characters",
    "any.required": "accountName is required",
  }),
  bankCode: Joi.string().trim().required().messages({
    "string.base": "bankCode must be a string",
    "any.required": "bankCode is required",
  }),
  merchantTxRef: Joi.string().trim().required().messages({
    "string.base": "merchantTxRef must be a string",
    "any.required": "merchantTxRef is required",
  }),
  senderName: Joi.string().trim().min(2).max(150).required().messages({
    "string.base": "senderName must be a string",
    "string.min": "senderName must be at least 2 characters",
    "string.max": "senderName must be at most 150 characters",
    "any.required": "senderName is required",
  }),
  narration: Joi.string().trim().max(255).optional().messages({
    "string.base": "narration must be a string",
    "string.max": "narration must be at most 255 characters",
  }),
});

const resolveBankAccountSchema = Joi.object({
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "string.base": "accountNumber must be a string",
    "string.pattern.base": "accountNumber must be 10 digits",
    "any.required": "accountNumber is required",
  }),
  bankCode: Joi.string().trim().required().messages({
    "string.base": "bankCode must be a string",
    "any.required": "bankCode is required",
  }),
});

const getTransactionSchema = Joi.object({
  accountNumber: Joi.string().trim().optional().messages({
    "string.base": "accountNumber must be a string",
  }),
  fromDate: Joi.string().trim().optional().messages({
    "string.base": "fromDate must be a string",
  }),
  toDate: Joi.string().trim().optional().messages({
    "string.base": "toDate must be a string",
  }),
}).or("accountNumber", "fromDate", "toDate").messages({
  "object.missing": "At least one of accountNumber, fromDate, or toDate is required",
});

const verifyTransferSchema = Joi.object({
  transactionId: Joi.string().trim().optional().messages({
    "string.base": "transactionId must be a string",
  }),
  reference: Joi.string().trim().optional().messages({
    "string.base": "reference must be a string",
  }),
}).or("transactionId", "reference").messages({
  "object.missing": "Either transactionId or reference is required",
});

export {
  createWalletSchema,
  initiateTransferSchema,
  resolveBankAccountSchema,
  getTransactionSchema,
  verifyTransferSchema,
};
