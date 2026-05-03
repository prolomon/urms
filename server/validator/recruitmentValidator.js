import Joi from "joi";

const createRecruitmentSchema = Joi.object({
  fullname: Joi.string().trim().min(2).max(120).required().messages({
    "string.base": "Fullname must be a string",
    "string.empty": "Fullname is required",
    "string.min": "Fullname must be at least 2 characters long",
    "string.max": "Fullname must be at most 120 characters long",
    "any.required": "Fullname is required",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  phone: Joi.string().trim().min(10).max(15).required().messages({ 
    "string.base": "Phone must be a string",
    "string.empty": "Phone is required",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 15 characters long",
    "any.required": "Phone is required",
  }),
  dob: Joi.date().iso().required().messages({
    "date.base": "DOB must be a valid date",
    "date.format": "DOB must be in ISO format",
    "any.required": "DOB is required",
  }),
  gender: Joi.string().trim().required().messages({
    "string.base": "Gender must be a string",
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
  }),
  state: Joi.string().trim().required().messages({
    "string.base": "State must be a string",
    "string.empty": "State is required",
    "any.required": "State is required",
  }),
  lga: Joi.string().trim().required().messages({
    "string.base": "LGA must be a string",
    "string.empty": "LGA is required",
    "any.required": "LGA is required",
  }),
  address: Joi.string().trim().required().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  accountNumber: Joi.string().trim().min(6).max(20).required().messages({
    "string.base": "Account number must be a string",
    "string.empty": "Account number is required",
    "string.min": "Account number must be at least 6 characters long",
    "string.max": "Account number must be at most 20 characters long",
    "any.required": "Account number is required",
  }),
  bank: Joi.string().trim().required().messages({
    "string.base": "Bank must be a string",
    "string.empty": "Bank is required",
    "any.required": "Bank is required",
  }),
  accountName: Joi.string().trim().min(2).max(120).required().messages({
    "string.base": "Account name must be a string",
    "string.empty": "Account name is required",
    "string.min": "Account name must be at least 2 characters long",
    "string.max": "Account name must be at most 120 characters long",
    "any.required": "Account name is required",
  }),
  isCopper: Joi.string().trim().required().messages({
    "string.base": "isCopper must be a string",
    "string.empty": "isCopper is required",
    "any.required": "isCopper is required",
  }),
});

const deleteRecruitmentSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "string.base": "Recruitment id must be a string",
    "string.empty": "Recruitment id is required",
    "any.required": "Recruitment id is required",
  }),
});

export { createRecruitmentSchema, deleteRecruitmentSchema };
 