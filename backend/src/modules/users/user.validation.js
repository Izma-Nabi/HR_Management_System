const Joi = require("joi");

const createAdminSchema = Joi.object({

  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Full name is required"
  }),

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

  phone: Joi.string().allow("").optional(),

  office: Joi.string().allow("").optional()

});

const createEmployeeSchema = Joi.object({

  employeeCode: Joi.string().trim().max(50).required().messages({
    "string.empty": "Employee code is required"
  }),

  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Full name is required"
  }),

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

  phone: Joi.string().allow("").optional(),

  address: Joi.string().allow("").optional(),

  department: Joi.string().required().messages({
    "string.empty": "Department is required"
  }),

  designation: Joi.string().allow("").optional(),

  joiningDate: Joi.date().optional()

});

module.exports = {
  createAdminSchema,
  createEmployeeSchema
};