const Joi = require("joi");

const optionalText = (max) => Joi.string().trim().max(max).empty("").allow(null).default(null);
const optionalUpdateText = (max) => Joi.string().trim().max(max).empty("").allow(null).optional();

const createAdminSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters"
  }),

  firstName: Joi.string().trim().max(100).required().messages({
    "string.empty": "First name is required"
  }),

  lastName: optionalText(100),
  phone: optionalText(30),
  address: optionalText(255),

  departmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Department is required",
    "any.required": "Department is required"
  }),

  designation: optionalText(100),
  employmentStatus: optionalText(50),
  joiningDate: Joi.date().allow(null).optional(),
  photo: optionalText(255)
});

const updateAdminSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).optional().messages({
    "string.email": "Email must be a valid email address"
  }),

  password: Joi.string().min(8).max(128).optional().messages({
    "string.min": "Password must be at least 8 characters"
  }),

  firstName: Joi.string().trim().max(100).optional(),
  lastName: optionalUpdateText(100),
  phone: optionalUpdateText(30),
  address: optionalUpdateText(255),
  departmentId: Joi.number().integer().positive().allow(null).optional(),
  designation: optionalUpdateText(100),
  employmentStatus: optionalUpdateText(50),
  joiningDate: Joi.date().allow(null).optional(),
  photo: optionalUpdateText(255),
  status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED").optional()
}).min(1).messages({
  "object.min": "At least one field is required"
});

const createEmployeeSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),

  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters"
  }),

  firstName: Joi.string().trim().max(100).required().messages({
    "string.empty": "First name is required"
  }),

  lastName: Joi.string().trim().max(100).required().messages({
    "string.empty": "Last name is required"
  }),

  phone: optionalText(30),
  address: optionalText(255),
  photo: optionalText(255),
  departmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Department is required",
    "any.required": "Department is required"
  }),
  designation: optionalText(100)
});

module.exports = {
  createAdminSchema,
  updateAdminSchema,
  createEmployeeSchema
};
