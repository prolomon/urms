import Joi from "joi";

export const createPayoutSchema = Joi.object({
  userId: Joi.string().required(),
  bankName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  bankCode: Joi.string().required(),
  accountName: Joi.string().required(),
});

export const updatePayoutSchema = Joi.object({
  bankName: Joi.string().optional(),
  accountNumber: Joi.string().optional(),
  bankCode: Joi.string().optional(),
  accountName: Joi.string().optional(),
}).min(1);

export const updatePayoutStatusSchema = Joi.object({
  status: Joi.boolean().required(),
});