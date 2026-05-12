import Joi from "joi";

const locationSchema = Joi.alternatives().try(Joi.object(), Joi.string());

const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(150).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be at most 150 characters long",
    "any.required": "Name is required",
  }),
  phone: Joi.string().min(10).max(20).required().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 20 characters long",
    "any.required": "Phone is required",
  }),
  category: Joi.string().trim().required().messages({
    "string.base": "Category must be a string",
    "any.required": "Category is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  avatar: Joi.string().min(1).optional().messages({
    "string.base": "Avatar must be a string",
    "string.min": "Avatar cannot be empty",
  }),
  status: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Status must be a boolean",
  }),
  center: Joi.string().min(2).max(120).required().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
    "any.required": "Center is required",
  }),
  role: Joi.string().trim().optional().default("COMPANY").messages({
    "string.base": "Role must be a string",
  }),
  location: locationSchema.optional().messages({
    "alternatives.match": "Location must be a valid object or string",
  }),
  data: Joi.object().optional().allow(null).messages({
    "object.base": "Data must be an object",
  }), 
});

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(150).optional().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be at most 150 characters long",
  }),
  phone: Joi.string().min(10).max(20).optional().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 20 characters long",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),
  avatar: Joi.string().optional().messages({
    "string.base": "Avatar must be a string",
  }),
  status: Joi.boolean().optional().messages({
    "boolean.base": "Status must be a boolean",
  }),
  center: Joi.string().min(2).max(120).optional().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
  }),
  role: Joi.string().trim().optional().messages({
    "string.base": "Role must be a string",
  }),
  secureToken: Joi.string().trim().optional().messages({
    "string.base": "Secure token must be a string",
  }),
  accountCode: Joi.string().trim().optional().messages({
    "string.base": "Account code must be a string",
  }),
  location: locationSchema.optional().messages({
    "alternatives.match": "Location must be a valid object or string",
  }),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required().messages({
    "string.base": "New password must be a string",
    "string.min": "New password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password must match new password",
      "any.required": "Confirm password is required",
    }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.base": "Current password must be a string",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.base": "New password must be a string",
    "string.min": "New password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password must match new password",
      "any.required": "Confirm password is required",
    }),
});
 
const loginCompanySchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const alphaNumPattern = /^[A-Za-z0-9]+$/;

export {
  createCompanySchema,
  updateCompanySchema,
  resetPasswordSchema,
  changePasswordSchema,
  loginCompanySchema,
};