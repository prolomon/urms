import Joi from "joi";

const createWalletSchema = Joi.object({
  id: Joi.string().trim().optional().messages({
    "string.base": "memberId must be a string",
  }),
  customerCode: Joi.string().trim().optional().messages({
    "string.base": "customerCode must be a string",
  }),
  accountType: Joi.string().trim().lowercase().valid("member", "admin", "agent").required().messages({
    "string.base": "accountType must be a string",
    "any.only": "accountType must be member, admin, or agent",
    "any.required": "accountType is required",
  }),
})

const validateWalletOwnershipSchema = Joi.object({
  customerCode: Joi.string().trim().required().messages({
    "string.base": "customerCode must be a string",
    "any.required": "customerCode is required",
  }),
  bvn: Joi.string().trim().pattern(/^\d{11}$/).required().messages({
    "string.base": "bvn must be a string",
    "string.pattern.base": "bvn must be 11 digits",
    "any.required": "bvn is required",
  }),
  type: Joi.string().trim().lowercase().valid("nin", "bvn").required().messages({
    "string.base": "type must be a string",
    "any.only": "type must be nin or bvn",
    "any.required": "type is required",
  }),
});

const updateWalletBalanceSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    "number.base": "amount must be a number",
    "number.greater": "amount must be greater than 0",
    "any.required": "amount is required",
  }),
  operation: Joi.string().trim().lowercase().valid("credit", "debit").required().messages({
    "string.base": "operation must be a string",
    "any.only": "operation must be credit or debit",
    "any.required": "operation is required",
  }),
});

const createTransferRecipientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required().messages({
    "string.base": "name must be a string",
    "string.min": "name must be at least 2 characters",
    "string.max": "name must be at most 150 characters",
    "any.required": "name is required",
  }),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "string.base": "accountNumber must be a string",
    "string.pattern.base": "accountNumber must be 10 digits",
    "any.required": "accountNumber is required",
  }),
  bankCode: Joi.string().trim().required().messages({
    "string.base": "bankCode must be a string",
    "any.required": "bankCode is required",
  }),
  currency: Joi.string().trim().uppercase().valid("NGN", "GHS", "ZAR", "KES").optional().messages({
    "string.base": "currency must be a string",
    "any.only": "currency must be one of NGN, GHS, ZAR, or KES",
  }),
});

const initiateTransferSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    "number.base": "amount must be a number",
    "number.greater": "amount must be greater than 0",
    "any.required": "amount is required",
  }),
  recipientCode: Joi.string().trim().required().messages({
    "string.base": "recipientCode must be a string",
    "any.required": "recipientCode is required",
  }),
  reason: Joi.string().trim().max(255).optional().messages({
    "string.base": "reason must be a string",
    "string.max": "reason must be at most 255 characters",
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

export {
  createWalletSchema,
  updateWalletBalanceSchema,
  validateWalletOwnershipSchema,
  createTransferRecipientSchema,
  initiateTransferSchema,
  resolveBankAccountSchema,
};
