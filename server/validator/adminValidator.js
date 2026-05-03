import Joi from 'joi';

const alphaNumPattern = /^[A-Za-z0-9]+$/;

const createAdminSchema = Joi.object({
  center: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Center is required',
    'string.min': 'Center must be at least 2 characters',
    'string.max': 'Center cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
  }),
  avatar: Joi.string().optional().messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().required(),
    accuracy: Joi.number().optional(),
  }).optional(),
  state: Joi.string().max(100).optional(),
  address: Joi.string().max(200).optional(),
  lga: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  secureToken: Joi.string().max(200).optional(),
  phone: Joi.string().max(20).optional(),
  adminName: Joi.string().max(100).optional(),
  adminEmail: Joi.string().email().optional(),
  adminPhone: Joi.string().max(20).optional(),
  adminLocation: Joi.string().max(200).optional(),
  paystackCustomerId: Joi.string().max(200).optional(),
  paystackCustomerCode: Joi.string().max(200).optional(),
});

const updateAdminSchema = Joi.object({
  center: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  avatar: Joi.string().uri().optional(),
  role: Joi.string().valid('ADMIN').optional(),
  paymentConfig: Joi.object({
    amac: Joi.number().optional(),
    agent: Joi.number().optional(),
    technology: Joi.number().optional(),
    operation: Joi.number().optional(),
  }).optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().required(),
    accuracy: Joi.number().optional(),
  }).optional(),
  state: Joi.string().max(100).optional(),
  address: Joi.string().max(200).optional(),
  lga: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  secureToken: Joi.string().max(200).optional(),
  status: Joi.boolean().optional(),
  phone: Joi.string().max(20).optional(),
  adminName: Joi.string().max(100).optional(),
  adminEmail: Joi.string().email().optional(),
  adminPhone: Joi.string().max(20).optional(),
  adminLocation: Joi.string().max(200).optional(),
  paystackCustomerId: Joi.string().max(200).optional(),
  paystackCustomerCode: Joi.string().max(200).optional(),
});

const loginAdminSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const forgotPasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required',
    'any.required': 'Old password is required',
  }),
  newPassword: Joi.string().min(8).max(100).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password must be at most 100 characters long',
    'string.empty': 'New password is required',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirm password must match new password',
    'any.required': 'Confirm password is required',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).max(100).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password must be at most 100 characters long',
    'string.empty': 'New password is required',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirm password must match new password',
    'any.required': 'Confirm password is required',
  }),
});

const createSecurityTokenSchema = Joi.object({
  securityToken: Joi.string().pattern(alphaNumPattern).length(6).required().messages({
    'string.pattern.base': 'Security token must contain only letters and numbers',
    'string.length': 'Security token must be 6 characters long',
    'string.empty': 'Security token is required',
    'any.required': 'Security token is required',
  }),
  confirmSecurityToken: Joi.string().valid(Joi.ref('securityToken')).required().messages({
    'any.only': 'Confirm security token must match security token',
    'any.required': 'Confirm security token is required',
  }),
});

const changeSecurityTokenSchema = Joi.object({
  oldSecurityToken: Joi.string().pattern(alphaNumPattern).required().messages({
    'string.pattern.base': 'Old security token must contain only letters and numbers',
    'string.empty': 'Old security token is required',
    'any.required': 'Old security token is required',
  }),
  newSecurityToken: Joi.string().pattern(alphaNumPattern).length(6).required().messages({
    'string.pattern.base': 'New security token must contain only letters and numbers',
    'string.length': 'New security token must be 6 characters long',
    'string.empty': 'New security token is required',
    'any.required': 'New security token is required',
  }),
  confirmSecurityToken: Joi.string().valid(Joi.ref('newSecurityToken')).required().messages({
    'any.only': 'Confirm security token must match new security token',
    'any.required': 'Confirm security token is required',
  }),
});

const verifySecurityCodeSchema = Joi.object({
  securityCode: Joi.string().pattern(alphaNumPattern).required().messages({
    'string.pattern.base': 'Security code must contain only letters and numbers',
    'string.empty': 'Security code is required',
    'any.required': 'Security code is required',
  }),
});

const updateAdminStatusSchema = Joi.object({
  status: Joi.boolean().required().messages({
    'any.required': 'Status is required',
    'boolean.base': 'Status must be true or false',
  }),
});

export {
  createAdminSchema,
  updateAdminSchema,
  loginAdminSchema,
  createSecurityTokenSchema,
  changeSecurityTokenSchema,
  verifySecurityCodeSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  updateAdminStatusSchema,
};