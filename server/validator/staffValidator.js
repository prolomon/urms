import Joi from "joi";

const locationSchema = Joi.alternatives().try(Joi.object(), Joi.string());

const createStaffSchema = Joi.object({
  fullname: Joi.string().min(2).max(150).required().messages({
    "string.base": "Fullname must be a string",
    "string.min": "Fullname must be at least 2 characters long",
    "string.max": "Fullname must be at most 150 characters long",
    "any.required": "Fullname is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string().min(10).max(20).required().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 20 characters long",
    "any.required": "Phone is required",
  }),
  gender: Joi.string().valid("MALE", "FEMALE").required().messages({
    "any.only": "Gender must be either MALE or FEMALE",
    "any.required": "Gender is required",
  }),
  status: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Status must be a boolean",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
  }),
  location: locationSchema.optional().messages({
    "alternatives.match": "Location must be a valid object or string",
  }),
  avatar: Joi.string().optional().messages({
    "string.base": "Avatar must be a string",
  }),
  center: Joi.string().min(2).max(120).required().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
    "any.required": "Center is required",
  }),
  role: Joi.string().trim().optional().default("STAFF").messages({
    "string.base": "Role must be a string",
  }),
});

const updateStaffSchema = Joi.object({
  fullname: Joi.string().min(2).max(150).optional().messages({
    "string.base": "Fullname must be a string",
    "string.min": "Fullname must be at least 2 characters long",
    "string.max": "Fullname must be at most 150 characters long",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),
  phone: Joi.string().min(10).max(20).optional().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 20 characters long",
  }),
  gender: Joi.string().valid("MALE", "FEMALE").optional().messages({
    "any.only": "Gender must be either MALE or FEMALE",
  }),
  status: Joi.boolean().optional().messages({
    "boolean.base": "Status must be a boolean",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
  }),
  location: locationSchema.optional().messages({
    "alternatives.match": "Location must be a valid object or string",
  }),
  center: Joi.string().min(2).max(120).optional().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
  }),
  role: Joi.string().trim().optional().messages({
    "string.base": "Role must be a string",
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

export { createStaffSchema, updateStaffSchema, resetPasswordSchema, changePasswordSchema };