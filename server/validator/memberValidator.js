import Joi from "joi";

const alphaNumPattern = /^[A-Za-z0-9]+$/;

const createMemberSchema = Joi.object({
  fullname: Joi.string().min(3).max(100).required().messages({
    "string.base": "Fullname must be a string",
    "string.min": "Fullname must be at least 3 characters long",
    "string.max": "Fullname must be at most 100 characters long",
    "any.required": "Fullname is required",
  }),
  businessName: Joi.string().min(1).max(200).optional().messages({
    "string.base": "Business name must be a string",
    "string.min": "Business name must be at least 1 character long",
    "string.max": "Business name must be at most 200 characters long",
  }),
  center: Joi.string().min(2).max(120).required().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
    "any.required": "Center is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string().min(10).max(15).required().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 15 characters long",
    "any.required": "Phone is required",
  }),
  type: Joi.string()
    .valid("BUSINESS", "INDIVIDUAL")
    .optional()
    .default("BUSINESS")
    .messages({
      "any.only": "Type must be either BUSINESS or INDIVIDUAL",
    }),
  billingFrequency: Joi.string()
    .uppercase()
    .valid("MONTHLY", "YEARLY", "QUARTERLY")
    .optional()
    .default("MONTHLY")
    .messages({
      "any.only":
        "Billing frequency must be one of MONTHLY, YEARLY, or QUARTERLY",
    }),
  category: Joi.string().trim().max(100).optional().default("SMALL").messages({
    "string.base": "Category must be a string",
    "string.max": "Category must be at most 100 characters long",
  }),
  password: Joi.string().optional().default(Joi.ref("phone")).messages({
    "any.required": "Password is required",
  }),
  location: Joi.object().optional().messages({
    "object.base": "Location must be a valid JSON object",
  }),
  avatar: Joi.string().optional().messages({
    "string.base": "Avatar must be a valid URI",
  }),
  agent: Joi.string().optional().messages({
    "string.base": "Agent must be a string",
  }),
  pricing: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Pricing must be an array",
  }),
  role: Joi.string().valid("USER", "ADMIN").optional().default("USER"),
});

const updateMemberSchema = Joi.object({
  fullname: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Fullname must be a string",
    "string.min": "Fullname must be at least 3 characters long",
    "string.max": "Fullname must be at most 100 characters long",
  }),
  businessName: Joi.string().min(1).max(200).optional().messages({
    "string.base": "Business name must be a string",
    "string.min": "Business name must be at least 1 character long",
    "string.max": "Business name must be at most 200 characters long",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),
  center: Joi.string().min(2).max(120).optional().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
  }),
  phone: Joi.string().min(10).max(15).optional().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 10 characters long",
    "string.max": "Phone must be at most 15 characters long",
  }),
  type: Joi.string().valid("BUSINESS", "INDIVIDUAL").optional().messages({
    "any.only": "Type must be either BUSINESS or INDIVIDUAL",
  }),
  billingFrequency: Joi.string()
    .uppercase()
    .valid("MONTHLY", "YEARLY", "QUARTERLY")
    .optional()
    .messages({
      "any.only":
        "Billing frequency must be one of MONTHLY, YEARLY, or QUARTERLY",
    }),
  category: Joi.string().trim().max(100).optional().messages({
    "string.base": "Category must be a string",
    "string.max": "Category must be at most 100 characters long",
  }),
  location: Joi.object().optional().messages({
    "object.base": "Location must be a valid JSON object",
  }),
  avatar: Joi.string().optional().messages({
    "string.base": "Avatar must be a string",
  }),
  status: Joi.boolean().optional().messages({
    "boolean.base": "Status must be a boolean",
  }),
  agent: Joi.string().optional().messages({
    "string.base": "Agent must be a string",
  }),
  pricing: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Pricing must be an array",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const createSecurityTokenSchema = Joi.object({
  securityToken: Joi.string()
    .pattern(alphaNumPattern)
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.pattern.base":
        "Security token must contain only letters and numbers",
      "string.min": "Security token must be at least 8 characters long",
      "string.max": "Security token must be at most 100 characters long",
      "string.empty": "Security token is required",
      "any.required": "Security token is required",
    }),
  confirmSecurityToken: Joi.string()
    .valid(Joi.ref("securityToken"))
    .required()
    .messages({
      "any.only": "Confirm security token must match security token",
      "any.required": "Confirm security token is required",
    }),
});

const changeSecurityTokenSchema = Joi.object({
  oldSecurityToken: Joi.string().pattern(alphaNumPattern).required().messages({
    "string.pattern.base":
      "Old security token must contain only letters and numbers",
    "string.empty": "Old security token is required",
    "any.required": "Old security token is required",
  }),
  newSecurityToken: Joi.string()
    .pattern(alphaNumPattern)
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.pattern.base":
        "New security token must contain only letters and numbers",
      "string.min": "New security token must be at least 8 characters long",
      "string.max": "New security token must be at most 100 characters long",
      "string.empty": "New security token is required",
      "any.required": "New security token is required",
    }),
  confirmSecurityToken: Joi.string()
    .valid(Joi.ref("newSecurityToken"))
    .required()
    .messages({
      "any.only": "Confirm security token must match new security token",
      "any.required": "Confirm security token is required",
    }),
});

const verifySecurityCodeSchema = Joi.object({
  securityCode: Joi.string().pattern(alphaNumPattern).required().messages({
    "string.pattern.base":
      "Security code must contain only letters and numbers",
    "string.empty": "Security code is required",
    "any.required": "Security code is required",
  }),
});

const billingFrequencySchema = Joi.object({
  frequency: Joi.string()
    .uppercase()
    .valid("MONTHLY", "YEARLY", "QUARTERLY")
    .required()
    .messages({
      "string.base": "Frequency must be a string",
      "any.only": "Frequency must be one of MONTHLY, YEARLY, or QUARTERLY",
      "any.required": "Frequency is required",
    }),
});

const pricingActionSchema = Joi.object({
  ids: Joi.array().items(Joi.string().trim().min(1)).min(1).required().messages({
    "array.base": "ids must be an array",
    "array.min": "ids must contain at least one item",
    "any.required": "ids is required",
  }),
  action: Joi.string().trim().lowercase().valid("upgrade", "downgrade").required().messages({
    "string.base": "action must be a string",
    "any.only": "action must be either upgrade or downgrade",
    "any.required": "action is required",
  }),
});

const changeMemberAgentSchema = Joi.object({
  userId: Joi.string().trim().required().messages({
    "string.base": "User ID must be a string",
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  agentId: Joi.string().trim().required().messages({
    "string.base": "Agent ID must be a string",
    "string.empty": "Agent ID is required",
    "any.required": "Agent ID is required",
  }),
});

export {
  createMemberSchema,
  updateMemberSchema,
  loginSchema,
  createSecurityTokenSchema,
  changeSecurityTokenSchema,
  verifySecurityCodeSchema,
  billingFrequencySchema,
  pricingActionSchema,
  changeMemberAgentSchema,
};
